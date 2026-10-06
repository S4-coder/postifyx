//! WebSocket transport.
//!
//! The Rust side owns the socket so the webview never opens a network
//! connection itself. Incoming and outgoing frames are forwarded to the UI as
//! Tauri events, keyed by `streamId`.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use base64::Engine as _;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;

/// Event carrying one frame. The UI listens for this for every stream protocol.
pub const STREAM_MESSAGE_EVENT: &str = "openclient://stream-message";
/// Event carrying connection lifecycle changes.
pub const STREAM_STATUS_EVENT: &str = "openclient://stream-status";

#[derive(Debug, Clone, Deserialize)]
pub struct WsConnectConfig {
    pub stream_id: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize)]
struct StreamMessage {
    #[serde(rename = "streamId")]
    stream_id: String,
    direction: &'static str,
    data: String,
    at: String,
}

#[derive(Debug, Clone, Serialize)]
struct StreamStatus {
    #[serde(rename = "streamId")]
    stream_id: String,
    status: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    detail: Option<String>,
}

pub fn emit_message(app: &AppHandle, stream_id: &str, direction: &'static str, data: &str) {
    let _ = app.emit(
        STREAM_MESSAGE_EVENT,
        StreamMessage {
            stream_id: stream_id.to_string(),
            direction,
            data: data.to_string(),
            at: now_iso8601(),
        },
    );
}

pub fn emit_status(app: &AppHandle, stream_id: &str, status: &'static str, detail: Option<String>) {
    let _ = app.emit(
        STREAM_STATUS_EVENT,
        StreamStatus {
            stream_id: stream_id.to_string(),
            status,
            detail,
        },
    );
}

/// RFC 3339 timestamp built by hand, avoiding a `chrono` dependency.
pub fn now_iso8601() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    // Civil-from-days, per Howard Hinnant's algorithm.
    let days = secs.div_euclid(86_400);
    let secs_of_day = secs.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    let (hour, minute, second) = (
        secs_of_day / 3600,
        (secs_of_day % 3600) / 60,
        secs_of_day % 60,
    );

    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}Z")
}

fn civil_from_days(days: i64) -> (i64, i64, i64) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };

    (if m <= 2 { y + 1 } else { y }, m, d)
}

/// Commands the writer task can receive.
pub enum WsOutbound {
    Text(String),
    Binary(Vec<u8>),
    Pong(Vec<u8>),
    Shutdown,
}

#[derive(Clone)]
pub struct WsHandle {
    pub tx: mpsc::UnboundedSender<WsOutbound>,
}

pub type WsRegistry = Arc<Mutex<HashMap<String, WsHandle>>>;

pub fn new_registry() -> WsRegistry {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Opens a socket and spawns the read/write pump.
///
/// Returns once the handshake completes; frames stream afterwards as events
/// until the peer closes or `ws_disconnect` is called.
pub async fn connect(
    app: AppHandle,
    registry: WsRegistry,
    config: WsConnectConfig,
) -> Result<(), String> {
    let url = config.url.trim().to_string();

    if url.is_empty() {
        return Err("WebSocket URL is empty.".to_string());
    }

    // Close any previous socket for this id so a reconnect cannot leak a task.
    disconnect(&registry, &config.stream_id);

    let (socket, _response) = tokio_tungstenite::connect_async(&url)
        .await
        .map_err(|e| format!("WebSocket handshake failed: {e}"))?;

    let (mut sink, mut source) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<WsOutbound>();

    registry
        .lock()
        .unwrap()
        .insert(config.stream_id.clone(), WsHandle { tx: tx.clone() });

    let stream_id = config.stream_id.clone();
    emit_status(&app, &stream_id, "open", None);

    // Writer task: drains the outbound channel into the sink. Pongs are routed
    // here too, because splitting the socket moved the sink away from the
    // reader and tungstenite cannot answer pings on its own.
    let writer_app = app.clone();
    let writer_id = stream_id.clone();
    let writer = tokio::spawn(async move {
        while let Some(command) = rx.recv().await {
            let frame = match command {
                WsOutbound::Text(payload) => Message::Text(payload),
                WsOutbound::Binary(payload) => Message::Binary(payload.into()),
                WsOutbound::Pong(payload) => Message::Pong(payload.into()),
                WsOutbound::Shutdown => {
                    let _ = sink.close().await;
                    break;
                }
            };

            if let Err(err) = sink.send(frame).await {
                emit_status(&writer_app, &writer_id, "error", Some(err.to_string()));
                break;
            }
        }
    });

    // Reader task: forwards inbound frames to the UI.
    let reader_app = app.clone();
    let reader_id = stream_id.clone();
    let reader_tx = tx.clone();
    let reader = tokio::spawn(async move {
        let mut close_reason: Option<String> = None;

        while let Some(frame) = source.next().await {
            match frame {
                Ok(Message::Text(text)) => {
                    emit_message(&reader_app, &reader_id, "in", text.as_str())
                }
                Ok(Message::Binary(bytes)) => {
                    // Binary is base64 so nothing is lost in the JSON hop.
                    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
                    emit_message(&reader_app, &reader_id, "in", &encoded);
                }
                Ok(Message::Ping(payload)) => {
                    let _ = reader_tx.send(WsOutbound::Pong(payload.to_vec()));
                }
                Ok(Message::Pong(_)) | Ok(Message::Frame(_)) => {}
                Ok(Message::Close(frame)) => {
                    close_reason = frame
                        .map(|f| f.reason.to_string())
                        .filter(|r| !r.is_empty());
                    break;
                }
                Err(err) => {
                    emit_status(&reader_app, &reader_id, "error", Some(err.to_string()));
                    break;
                }
            }
        }

        emit_status(&reader_app, &reader_id, "closed", close_reason);
    });

    // Both tasks are awaited here so neither is silently detached.
    let cleanup_registry = registry;
    let cleanup_id = stream_id.clone();
    tokio::spawn(async move {
        let _ = reader.await;
        cleanup_registry.lock().unwrap().remove(&cleanup_id);
        let _ = writer.await;
    });

    Ok(())
}

/// Queues an outbound text frame.
pub fn send(registry: &WsRegistry, stream_id: &str, data: String) -> Result<(), String> {
    let guard = registry.lock().unwrap();

    match guard.get(stream_id) {
        Some(handle) => handle
            .tx
            .send(WsOutbound::Text(data))
            .map_err(|_| "Socket is not open.".to_string()),
        None => Err("No open socket for this stream.".to_string()),
    }
}

/// Tears the socket down.
pub fn disconnect(registry: &WsRegistry, stream_id: &str) {
    if let Some(handle) = registry.lock().unwrap().remove(stream_id) {
        let _ = handle.tx.send(WsOutbound::Shutdown);
    }
}
