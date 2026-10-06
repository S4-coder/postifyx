//! gRPC transport via dynamic protobuf reflection.
//!
//! Most gRPC clients need `protoc` and generated code. OpenClient does not: it
//! accepts a base64 `FileDescriptorSet` plus a JSON message, and
//! `prost-reflect` resolves the method and message shapes at runtime. A
//! `.proto` file is the only build input the user needs.
//!
//! A call is a five-step flow:
//!   1. Build a `DescriptorPool` from the descriptor set.
//!   2. Resolve `service`/`method` into input and output descriptors.
//!   3. Encode the JSON request message to protobuf bytes.
//!   4. Send through a `tonic` channel with a byte pass-through codec.
//!   5. Decode the response back into JSON.

use base64::Engine as _;
use prost::Message;
use prost_reflect::{DescriptorPool, DynamicMessage, FileDescriptorSet, JsonOptions};
use serde::{Deserialize, Serialize};
use tonic::codec::{Codec, DecodeBuf, Decoder, EncodeBuf, Encoder};
use tonic::transport::Channel;
use tonic::{Code, Request, Status};

#[derive(Debug, Clone, Deserialize)]
pub struct GrpcCallConfig {
    /// `host:port` or a full URL of the gRPC server.
    pub url: String,
    /// Fully-qualified service name, with or without a leading slash.
    pub service: String,
    /// Method name, e.g. `SayHello`.
    pub method: String,
    /// base64-encoded `FileDescriptorSet`.
    #[serde(alias = "descriptorSet")]
    pub descriptor_set: String,
    /// Request message as JSON. Defaults to `{}` for methods with no fields.
    #[serde(default)]
    pub message: String,
    /// Request metadata (the gRPC equivalent of HTTP headers).
    #[serde(default)]
    pub metadata: std::collections::HashMap<String, String>,
    /// Plaintext HTTP/2. Only for local servers.
    #[serde(default)]
    pub insecure: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct GrpcCallResult {
    /// Always 0; gRPC status is reported separately from HTTP status.
    pub status: u16,
    #[serde(rename = "grpcStatus")]
    pub grpc_status: String,
    #[serde(rename = "httpStatus")]
    pub http_status: u16,
    /// Response message rendered as JSON.
    pub message: String,
    /// Raw response bytes, base64, present only when decoding failed.
    #[serde(rename = "rawMessage", skip_serializing_if = "Option::is_none")]
    pub raw_message: Option<String>,
    #[serde(rename = "elapsedMs")]
    pub elapsed_ms: u128,
    pub error: Option<String>,
}

// ── Byte pass-through codec ─────────────────────────────────────────────────
//
// gRPC framing is handled by tonic, so the buffer handed to `decode` is
// already exactly one message with no length prefix to strip.

#[derive(Debug, Clone, Copy, Default)]
struct BytesEncoder;

impl Encoder for BytesEncoder {
    type Item = Vec<u8>;
    type Error = Status;

    fn encode(&mut self, item: Self::Item, dst: &mut EncodeBuf<'_>) -> Result<(), Self::Error> {
        dst.put_slice(&item);
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, Default)]
struct BytesDecoder;

impl Decoder for BytesDecoder {
    type Item = Vec<u8>;
    type Error = Status;

    fn decode(&mut self, src: &mut DecodeBuf<'_>) -> Result<Option<Self::Item>, Self::Error> {
        let len = src.remaining();
        if len == 0 {
            return Ok(None);
        }
        Ok(Some(src.copy_to_bytes(len).to_vec()))
    }
}

#[derive(Debug, Clone, Copy, Default)]
struct BytesCodec;

impl Codec for BytesCodec {
    type Encode = Vec<u8>;
    type Decode = Vec<u8>;
    type Encoder = BytesEncoder;
    type Decoder = BytesDecoder;

    fn encoder(&mut self) -> Self::Encoder {
        BytesEncoder
    }

    fn decoder(&mut self) -> Self::Decoder {
        BytesDecoder
    }
}

/// gRPC caps messages at 4 MB by default; raise it so large responses are not
/// silently truncated.
const MAX_MESSAGE_BYTES: usize = 64 * 1024 * 1024;

/// Performs one unary gRPC call.
pub async fn call(config: GrpcCallConfig) -> GrpcCallResult {
    let started = std::time::Instant::now();

    match run(&config).await {
        Ok(message) => GrpcCallResult {
            status: 0,
            grpc_status: "OK".to_string(),
            http_status: 200,
            message,
            raw_message: None,
            elapsed_ms: started.elapsed().as_millis(),
            error: None,
        },
        Err(err) => GrpcCallResult {
            status: 0,
            grpc_status: err.grpc_status,
            http_status: 0,
            message: String::new(),
            raw_message: err.raw,
            elapsed_ms: started.elapsed().as_millis(),
            error: Some(err.message),
        },
    }
}

/// Internal error carrying the gRPC status code alongside the message.
struct CallError {
    message: String,
    grpc_status: String,
    raw: Option<String>,
}

impl CallError {
    fn new(message: impl Into<String>, grpc_status: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            grpc_status: grpc_status.into(),
            raw: None,
        }
    }

    fn with_raw(mut self, bytes: &[u8]) -> Self {
        self.raw = Some(base64::engine::general_purpose::STANDARD.encode(bytes));
        self
    }

    fn from_status(status: Status) -> Self {
        Self {
            message: status.message().to_string(),
            grpc_status: format!("{:?}", status.code()),
            raw: None,
        }
    }
}

async fn run(config: &GrpcCallConfig) -> Result<String, CallError> {
    // ── 1. Descriptor pool ────────────────────────────────────────────────
    let descriptor_bytes = base64::engine::general_purpose::STANDARD
        .decode(config.descriptor_set.trim())
        .map_err(|e| {
            CallError::new(
                format!("descriptor_set is not valid base64: {e}"),
                "INVALID_ARGUMENT",
            )
        })?;

    let file_set = FileDescriptorSet::decode(descriptor_bytes.as_slice()).map_err(|e| {
        CallError::new(
            format!("descriptor_set is not a valid FileDescriptorSet: {e}"),
            "INVALID_ARGUMENT",
        )
    })?;

    let pool = DescriptorPool::from_file_descriptor_set(file_set).map_err(|e| {
        CallError::new(
            format!("could not build descriptor pool: {e}"),
            "INVALID_ARGUMENT",
        )
    })?;

    // ── 2. Resolve the method ─────────────────────────────────────────────
    let service_name = config.service.trim().trim_start_matches('/').to_string();
    let method_name = config.method.trim().to_string();

    if service_name.is_empty() || method_name.is_empty() {
        return Err(CallError::new(
            "Both a service and a method are required.",
            "INVALID_ARGUMENT",
        ));
    }

    let service = pool.get_service_by_name(&service_name).ok_or_else(|| {
        let available = pool
            .all_services()
            .map(|s| s.full_name().to_string())
            .collect::<Vec<_>>()
            .join(", ");
        CallError::new(
            format!(
                "service '{service_name}' is not in the descriptor set (available: {available})"
            ),
            "NOT_FOUND",
        )
    })?;

    let method = service
        .get_method_by_name(&method_name)
        .ok_or_else(|| {
            let available = service
                .methods()
                .map(|m| m.name().to_string())
                .collect::<Vec<_>>()
                .join(", ");
            CallError::new(
                format!(
                    "method '{method_name}' is not on service '{service_name}' (available: {available})"
                ),
                "NOT_FOUND",
            )
        })?;

    if method.is_server_streaming() || method.is_client_streaming() {
        return Err(CallError::new(
            "streaming methods are not supported yet; use a unary method",
            "UNIMPLEMENTED",
        ));
    }

    let input_descriptor = method.input();
    let output_descriptor = method.output();

    // ── 3. Encode the request ─────────────────────────────────────────────
    let json_options = JsonOptions::default().emit_defaults(true);

    let message_text = if config.message.trim().is_empty() {
        "{}".to_string()
    } else {
        config.message.trim().to_string()
    };

    let request_json: serde_json::Value = serde_json::from_str(&message_text).map_err(|e| {
        CallError::new(
            format!("message is not valid JSON: {e}"),
            "INVALID_ARGUMENT",
        )
    })?;

    let request_message =
        DynamicMessage::deserialize(input_descriptor, &request_json).map_err(|e| {
            CallError::new(
                format!("message does not match the input type: {e}"),
                "INVALID_ARGUMENT",
            )
        })?;

    let encoded_request = request_message.encode_to_vec();

    if encoded_request.len() > MAX_MESSAGE_BYTES {
        return Err(CallError::new(
            format!("request message exceeds the {MAX_MESSAGE_BYTES} byte limit"),
            "INVALID_ARGUMENT",
        ));
    }

    // ── 4. Connect ────────────────────────────────────────────────────────
    let endpoint = normalise_endpoint(&config.url, config.insecure)?;

    let channel = Channel::from_shared(endpoint)
        .map_err(|e| CallError::new(format!("invalid url: {e}"), "INVALID_ARGUMENT"))?
        .connect()
        .await
        .map_err(|e| CallError::from_status(Status::new(Code::Unavailable, e.to_string())))?;

    let mut request = Request::new(encoded_request);

    for (key, value) in &config.metadata {
        // Invalid metadata keys are skipped rather than failing the call.
        if let (Ok(k), Ok(v)) = (
            tonic::metadata::MetadataKey::from_bytes(key.as_bytes()),
            tonic::metadata::MetadataValue::try_from(value.as_str()),
        ) {
            request.metadata_mut().insert(k, v);
        }
    }

    let path = format!("/{service_name}/{method_name}")
        .parse()
        .map_err(|e| CallError::new(format!("invalid method path: {e}"), "INVALID_ARGUMENT"))?;

    let mut client = tonic::client::Grpc::new(channel)
        .max_decoding_message_size(MAX_MESSAGE_BYTES)
        .max_encoding_message_size(MAX_MESSAGE_BYTES);

    client.ready().await.map_err(CallError::from_status)?;

    // ── 5. Send and decode ────────────────────────────────────────────────
    let response = client
        .unary(request, path, BytesCodec)
        .await
        .map_err(CallError::from_status)?;

    let body = response.into_inner();

    let response_message =
        DynamicMessage::decode(output_descriptor, body.as_slice()).map_err(|e| {
            CallError::new(
                format!(
                    "could not decode response as {}: {e}",
                    output_descriptor.full_name()
                ),
                "INTERNAL",
            )
            .with_raw(&body)
        })?;

    let response_json = serde_json::Value::deserialize(&response_message).map_err(|e| {
        CallError::new(
            format!("could not render response as JSON: {e}"),
            "INTERNAL",
        )
        .with_raw(&body)
    })?;

    Ok(serde_json::to_string_pretty(&response_json).unwrap_or_else(|_| response_json.to_string()))
}

/// `tonic` needs an absolute URI. Users usually paste `localhost:50051`.
fn normalise_endpoint(url: &str, insecure: bool) -> Result<String, CallError> {
    let trimmed = url.trim().trim_end_matches('/');

    if trimmed.is_empty() {
        return Err(CallError::new("url is required.", "INVALID_ARGUMENT"));
    }

    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return Ok(trimmed.to_string());
    }

    let scheme = if insecure { "http" } else { "https" };

    Ok(format!("{scheme}://{trimmed}"))
}

/// Lists services and methods in a descriptor set, so the UI can populate a
/// picker instead of asking the user to type names by hand.
pub fn describe_services(descriptor_set: &str) -> Result<Vec<serde_json::Value>, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(descriptor_set.trim())
        .map_err(|e| format!("descriptor_set is not valid base64: {e}"))?;

    let file_set = FileDescriptorSet::decode(bytes.as_slice())
        .map_err(|e| format!("descriptor_set is not a valid FileDescriptorSet: {e}"))?;

    let pool = DescriptorPool::from_file_descriptor_set(file_set)
        .map_err(|e| format!("could not build descriptor pool: {e}"))?;

    Ok(pool
        .all_services()
        .map(|service| {
            serde_json::json!({
                "name": service.full_name().to_string(),
                "methods": service
                    .methods()
                    .map(|m| serde_json::json!({
                        "name": m.name().to_string(),
                        "input": m.input().full_name().to_string(),
                        "output": m.output().full_name().to_string(),
                        "serverStreaming": m.is_server_streaming(),
                        "clientStreaming": m.is_client_streaming(),
                    }))
                    .collect::<Vec<_>>(),
            })
        })
        .collect())
}
