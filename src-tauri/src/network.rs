//! Shared HTTP client pool for the Rust engine.
//!
//! `reqwest::Client` wraps a connection pool, so one client per timeout
//! profile is created and reused rather than building a new client per
//! request. That keeps TLS sessions warm and stops the process from opening a
//! fresh socket on every keystroke-triggered request.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use reqwest::Client;

pub const CONNECT_TIMEOUT: Duration = Duration::from_secs(15);
/// Default ceiling for ordinary request/response calls.
pub const REQUEST_TIMEOUT: Duration = Duration::from_secs(60);
/// Longest a caller can extend a timeout to.
pub const MAX_TIMEOUT: Duration = Duration::from_secs(600);

fn build(timeout: Duration) -> Result<Client, String> {
    Client::builder()
        .user_agent(concat!("PostifyX/", env!("CARGO_PKG_VERSION")))
        .timeout(timeout)
        .connect_timeout(CONNECT_TIMEOUT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("failed to build HTTP client: {e}"))
}

/// Clients keyed by their timeout, so a per-request override does not
/// invalidate the shared entry.
#[derive(Default)]
pub struct ClientPool {
    clients: Mutex<HashMap<u64, Client>>,
}

impl ClientPool {
    /// Buckets the requested timeout to a whole second and clamps it to
    /// `MAX_TIMEOUT`. Bucketing keeps the pool small: without it every distinct
    /// millisecond value would create a new entry.
    pub fn get(&self, timeout: Option<u64>) -> Result<Client, String> {
        let key = Self::timeout_seconds(timeout.unwrap_or(0));

        let mut guard = self
            .clients
            .lock()
            .map_err(|_| "HTTP client pool is poisoned".to_string())?;

        if let Some(existing) = guard.get(&key) {
            return Ok(existing.clone());
        }

        let client = build(Duration::from_millis(key * 1000))?;
        guard.insert(key, client.clone());

        Ok(client)
    }

    /// Resolves the effective timeout for a request, in seconds.
    ///
    /// Shared with `get()` so error messages quote the same ceiling the
    /// client was actually built with.
    pub fn timeout_seconds(override_ms: u64) -> u64 {
        let millis = match override_ms {
            ms if ms > 0 => ms,
            _ => REQUEST_TIMEOUT.as_millis() as u64,
        }
        .min(MAX_TIMEOUT.as_millis() as u64);

        millis / 1000
    }
}
