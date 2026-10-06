//! OpenClient native core.
//!
//! Four protocol engines live here:
//!
//! - `http`    — REST / GraphQL over HTTP, via a pooled `reqwest` client.
//! - `ws`      — WebSocket, with frames forwarded to the UI as Tauri events.
//! - `sse`     — server-sent events, parsed per the WHATWG spec.
//! - `grpc`    — HTTP/2 gRPC with dynamic protobuf reflection.
//!
//! Every command returns data rather than throwing on a transport failure, so
//! the UI can render errors inline next to the response.

mod grpc;
mod http;
mod network;
mod sse;
mod ws;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use grpc::GrpcCallConfig;
use sse::SseConnectConfig;
use ws::WsConnectConfig;

/// Shared, mutable state handed to every command.
pub struct AppState {
    pub http: network::ClientPool,
    pub websockets: ws::WsRegistry,
    pub event_streams: sse::SseRegistry,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            http: network::ClientPool::default(),
            websockets: ws::new_registry(),
            event_streams: sse::new_registry(),
        }
    }
}

/// Version and limits, shown in the About panel.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    name: &'static str,
    version: &'static str,
    user_agent: &'static str,
    max_body_bytes: usize,
    max_message_bytes: usize,
    timeout_seconds: u64,
}

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: "OpenClient",
        version: env!("CARGO_PKG_VERSION"),
        user_agent: concat!("OpenClient/", env!("CARGO_PKG_VERSION")),
        max_body_bytes: http::MAX_BODY_BYTES,
        max_message_bytes: grpc::MAX_MESSAGE_BYTES,
        timeout_seconds: network::REQUEST_TIMEOUT.as_secs(),
    }
}

// ── REST / GraphQL ──────────────────────────────────────────────────────────

#[tauri::command]
async fn execute_rest_request(
    state: State<'_, AppState>,
    request: http::HttpRequestPayload,
) -> Result<http::HttpResponsePayload, String> {
    http::execute(state, request).await
}

// ── WebSocket ───────────────────────────────────────────────────────────────

#[tauri::command]
async fn ws_connect(
    app: AppHandle,
    state: State<'_, AppState>,
    config: WsConnectConfig,
) -> Result<(), String> {
    ws::connect(app, state.websockets.clone(), config).await
}

#[tauri::command]
fn ws_send(state: State<'_, AppState>, stream_id: String, data: String) -> Result<(), String> {
    ws::send(&state.websockets, &stream_id, data)
}

#[tauri::command]
fn ws_disconnect(state: State<'_, AppState>, stream_id: String) {
    ws::disconnect(&state.websockets, &stream_id);
}

// ── Server-sent events ──────────────────────────────────────────────────────

#[tauri::command]
async fn sse_connect(
    app: AppHandle,
    state: State<'_, AppState>,
    config: SseConnectConfig,
) -> Result<(), String> {
    sse::connect(app, state.event_streams.clone(), config).await
}

#[tauri::command]
fn sse_disconnect(state: State<'_, AppState>, stream_id: String) {
    sse::disconnect(&state.event_streams, &stream_id);
}

// ── gRPC ────────────────────────────────────────────────────────────────────

#[tauri::command]
async fn grpc_call(config: GrpcCallConfig) -> Result<grpc::GrpcCallResult, String> {
    Ok(grpc::call(config).await)
}

/// Lists services in a descriptor set so the UI can populate a method picker.
#[tauri::command]
fn grpc_describe_services(descriptor_set: String) -> Result<Vec<serde_json::Value>, String> {
    grpc::describe_services(&descriptor_set)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            app_info,
            execute_rest_request,
            ws_connect,
            ws_send,
            ws_disconnect,
            sse_connect,
            sse_disconnect,
            grpc_call,
            grpc_describe_services,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenClient");
}
