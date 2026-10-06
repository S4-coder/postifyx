//! Server-Sent Events transport.
//!
//! `reqwest` streams the response and this module parses the SSE wire format
//! (per the WHATWG spec) line by line, emitting each complete event to the UI.
//! Parsing is deliberately incremental: a `data:` field can span many lines,
//! and an event is only dispatched on the blank line that terminates it.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::ws::{emit_status, STREAM_MESSAGE_EVENT};

#[derive(Debug, Clone, Deserialize)]
pub struct SseConnectConfig {
    pub stream_id: String,
    pub url: String,
    #[serde(default)]
    pub headers: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize)]
struct SseMessage {
    #[serde(rename = "streamId")]
    stream_id: String,
    direction: &'static str,
    data: String,
    at: String,
    event: String,
    id: String,
}

/// Per-connection abort flag, used to stop a running stream task.
#[derive(Clone, Default)]
pub struct SseHandle {
    stop: Arc<tokio::sync::Notify>,
}

pub type SseRegistry = Arc<Mutex<HashMap<String, SseHandle>>>;

pub fn new_registry() -> SseRegistry {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Accumulates SSE fields until a dispatching blank line arrives.
#[derive(Debug, Default)]
struct SseParser {
    data_lines: Vec<String>,
    event_name: String,
    last_event_id: String,
}

impl SseParser {
    /// Feeds one line. Returns a finished event when the line was blank and at
    /// least one field had been buffered.
    fn push(&mut self, line: &str, id: &str) -> Option<(String, String)> {
        // Comment line, used for keep-alives.
        if line.starts_with(':') {
            return None;
        }

        if line.is_empty() {
            if self.data_lines.is_empty() && self.event_name.is_empty() {
                return None;
            }

            let event_name = if self.event_name.is_empty() {
                "message".to_string()
            } else {
                std::mem::take(&mut self.event_name)
            };

            let data = if self.data_lines.is_empty() {
                String::new()
            } else {
                // Multi-line data is rejoined with newlines, per spec.
                std::mem::take(&mut self.data_lines).join("\n")
            };

            return Some((event_name, data));
        }

        let (field, value) = match line.split_once(':') {
            Some((f, v)) => (f, v.strip_prefix(' ').unwrap_or(v)),
            // A line with no colon is a field with an empty value.
            None => (line, ""),
        };

        match field {
            "data" => self.data_lines.push(value.to_string()),
            "event" => self.event_name = value.to_string(),
            "id" => {
                // The spec requires ignoring ids containing a NULL byte.
                if !value.contains('\0') {
                    self.last_event_id = value.to_string();
                }
            }
            // `retry` is intentionally ignored: this client does not reconnect.
            _ => {}
        }

        let _ = id;
        None
    }
}

/// Opens the stream and spawns the parse task.
pub async fn connect(
    app: AppHandle,
    registry: SseRegistry,
    config: SseConnectConfig,
) -> Result<(), String> {
    let url = config.url.trim().to_string();

    if url.is_empty() {
        return Err("SSE URL is empty.".to_string());
    }

    disconnect(&registry, &config.stream_id);

    let mut builder = crate::network::client()?
        .get(&url)
        // Servers only treat the request as an event stream with this header.
        .header(reqwest::header::ACCEPT, "text/event-stream")
        .header(reqwest::header::CACHE_CONTROL, "no-cache");

    for (name, value) in &config.headers {
        if name.trim().is_empty() {
            continue;
        }
        if let (Ok(n), Ok(v)) = (
            reqwest::header::HeaderName::from_bytes(name.as_bytes()),
            reqwest::header::HeaderValue::from_str(value),
        ) {
            builder = builder.header(n, v);
        }
    }

    let response = builder
        .send()
        .await
        .map_err(|e| format!("SSE connection failed: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "SSE endpoint returned {} {}",
            response.status().as_u16(),
            response.status().canonical_reason().unwrap_or("")
        ));
    }

    let stream_id = config.stream_id.clone();
    let stop = Arc::new(tokio::sync::Notify::new());

    registry
        .lock()
        .unwrap()
        .insert(stream_id.clone(), SseHandle { stop: stop.clone() });

    emit_status(&app, &stream_id, "open", None);

    let task_app = app.clone();
    let task_id = stream_id.clone();
    let task_registry = registry.clone();
    let cleanup_id = stream_id.clone();

    tauri::async_runtime::spawn(async move {
        let mut parser = SseParser::default();
        let mut buffer = String::new();
        let mut last_sent_id = String::new();
        let mut byte_stream = response.bytes_stream();

        loop {
            tokio::select! {
                // Bias toward shutdown so Disconnect feels immediate.
                biased;

                _ = stop.notified() => {
                    emit_status(&task_app, &cleanup_id, "closed", Some("disconnected".to_string()));
                    break;
                }

                chunk = byte_stream.next() => match chunk {
                    Some(Ok(bytes)) => {
                        buffer.push_str(&String::from_utf8_lossy(&bytes));

                        // Events are separated by newlines; a trailing partial
                        // line stays in the buffer for the next chunk.
                        while let Some(index) = buffer.find('\n') {
                            let raw: String = buffer.drain(..=index).collect();
                            let line = raw.trim_end_matches('\r').to_string();

                            if let Some((event_name, data)) = parser.push(&line, &last_sent_id) {
                                last_sent_id = parser.last_event_id.clone();

                                let _ = task_app.emit(
                                    STREAM_MESSAGE_EVENT,
                                    SseMessage {
                                        stream_id: cleanup_id.clone(),
                                        direction: "in",
                                        data,
                                        at: crate::ws::now_iso8601(),
                                        event: event_name,
                                        id: last_sent_id.clone(),
                                    },
                                );
                            }
                        }
                    }
                    Some(Err(err)) => {
                        emit_status(&task_app, &cleanup_id, "error", Some(err.to_string()));
                        break;
                    }
                    None => {
                        emit_status(&task_app, &cleanup_id, "closed", Some("stream ended".to_string()));
                        break;
                    }
                }
            }
        }

        task_registry.lock().unwrap().remove(&cleanup_id);
    });

    // Nothing else to await: the SSE task is detached by design and cleaned up
    // through the registry.
    let _ = task_id;

    Ok(())
}

/// Signals a running stream to stop.
pub fn disconnect(registry: &SseRegistry, stream_id: &str) {
    if let Some(handle) = registry.lock().unwrap().remove(stream_id) {
        handle.stop.notify_waiters();
    }
}

/// Builds a client with a short connect timeout but no overall timeout, since
/// an event stream is expected to stay open.
pub async fn probe(url: &str) -> Result<(u16, String), String> {
    let response = crate::network::client()?
        .get(url)
        .header(reqwest::header::ACCEPT, "text/event-stream")
        .send()
        .await
        .map_err(|e| format!("SSE probe failed: {e}"))?;

    Ok((
        response.status().as_u16(),
        response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string(),
    ))
}
