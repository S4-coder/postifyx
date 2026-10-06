//! REST and GraphQL request execution.
//!
//! Both protocols ride the same path: GraphQL is just a POST with a JSON body,
//! so there is no separate engine for it.

use std::collections::HashMap;
use std::time::Instant;

use serde::{Deserialize, Serialize};

use crate::AppState;

/// Largest response buffered into memory. A larger response is truncated so a
/// stray multi-gigabyte download cannot blow the RAM budget.
pub const MAX_BODY_BYTES: usize = 8 * 1024 * 1024;

/// Request payload from the JS bridge.
///
/// Field names are snake_case and match the `HttpRequest` typedef in
/// `src/lib/tauri.js` exactly. No `rename_all` is applied on purpose: Tauri IPC
/// serialises struct field names verbatim, so renaming here would silently
/// break the JS contract.
#[derive(Debug, Clone, Deserialize)]
pub struct HttpRequestPayload {
    pub url: String,
    #[serde(default = "default_method")]
    pub method: String,
    #[serde(default)]
    pub headers: HashMap<String, String>,
    #[serde(default)]
    pub body: Option<String>,
    /// Per-request timeout override in milliseconds, capped at 10 minutes.
    #[serde(default)]
    pub timeout_ms: Option<u64>,
}

fn default_method() -> String {
    "GET".to_string()
}

#[derive(Debug, Clone, Serialize)]
pub struct HttpResponsePayload {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub time_ms: u128,
    pub size_bytes: u64,
    /// `None` on success, a human-readable string when the call failed.
    pub error: Option<String>,
    /// True when the body was cut off at `MAX_BODY_BYTES`.
    pub truncated: bool,
}

/// Builds a failure payload so transport errors render in the inspector rather
/// than rejecting the command.
fn error_response(status: u16, message: String, elapsed: u128) -> HttpResponsePayload {
    HttpResponsePayload {
        status,
        status_text: String::new(),
        headers: HashMap::new(),
        body: String::new(),
        time_ms: elapsed,
        size_bytes: 0,
        error: Some(message),
        truncated: false,
    }
}

/// Executes an HTTP request from a native socket. Because this never touches
/// the webview's `fetch`, browser CORS does not apply: any host, any port.
pub async fn execute(
    state: tauri::State<'_, AppState>,
    request: HttpRequestPayload,
) -> Result<HttpResponsePayload, String> {
    let started = Instant::now();

    let url = reqwest::Url::parse(request.url.trim())
        .map_err(|e| format!("invalid URL '{}': {e}", request.url))?;

    if !matches!(url.scheme(), "http" | "https") {
        return Err(format!(
            "unsupported scheme '{}': only http and https are supported",
            url.scheme()
        ));
    }

    let method = reqwest::Method::from_bytes(request.method.trim().to_uppercase().as_bytes())
        .map_err(|e| format!("invalid HTTP method '{}': {e}", request.method))?;

    let client = state.http.get(request.timeout_ms)?;

    let mut builder = client.request(method, url);

    // Header names and values are user input. Reject only the ones reqwest
    // refuses instead of failing the whole request.
    for (name, value) in &request.headers {
        let name = name.trim();
        if name.is_empty() {
            continue;
        }
        if let (Ok(n), Ok(v)) = (
            reqwest::header::HeaderName::from_bytes(name.as_bytes()),
            reqwest::header::HeaderValue::from_str(value),
        ) {
            builder = builder.header(n, v);
        }
    }

    if let Some(body) = request.body.as_ref().filter(|b| !b.is_empty()) {
        builder = builder.body(body.clone());
    }

    let response = match builder.send().await {
        Ok(r) => r,
        Err(e) => {
            return Ok(error_response(
                0,
                describe_error(&e, request.timeout_ms),
                started.elapsed().as_millis(),
            ))
        }
    };

    let status = response.status();
    let status_code = status.as_u16();
    let status_text = status.canonical_reason().unwrap_or("").to_string();

    let mut headers = HashMap::new();
    for (name, value) in response.headers() {
        if let Ok(v) = value.to_str() {
            headers.insert(name.as_str().to_string(), v.to_string());
        }
    }

    let declared_size = response.content_length().unwrap_or(0);
    let text = match response.text().await {
        Ok(t) => t,
        Err(e) => {
            return Ok(error_response(
                status_code,
                format!("failed to read response body: {e}"),
                started.elapsed().as_millis(),
            ))
        }
    };

    let (body, truncated) = if text.len() > MAX_BODY_BYTES {
        (truncate_utf8(&text, MAX_BODY_BYTES), true)
    } else {
        (text, false)
    };

    Ok(HttpResponsePayload {
        status: status_code,
        status_text,
        headers,
        size_bytes: if declared_size == 0 {
            body.len() as u64
        } else {
            declared_size
        },
        body,
        time_ms: started.elapsed().as_millis(),
        error: None,
        truncated,
    })
}

/// Cuts a string on a char boundary and appends a notice, so a short body is
/// never mistaken for the whole response.
fn truncate_utf8(input: &str, max_bytes: usize) -> String {
    if input.len() <= max_bytes {
        return input.to_string();
    }

    let mut end = max_bytes;
    while end > 0 && !input.is_char_boundary(end) {
        end -= 1;
    }

    format!(
        "{}\n\n[PostifyX] Response truncated at {max_bytes} bytes.",
        &input[..end]
    )
}

/// `reqwest`'s Display output is terse; this adds the actionable cause.
fn describe_error(err: &reqwest::Error, timeout_ms: Option<u64>) -> String {
    if err.is_timeout() {
        return format!(
            "Request timed out after {}s",
            crate::network::ClientPool::timeout_seconds(timeout_ms.unwrap_or(0))
        );
    }
    if err.is_connect() {
        return format!("Could not connect: {err}");
    }
    if err.is_redirect() {
        return format!("Too many redirects: {err}");
    }
    err.to_string()
}
