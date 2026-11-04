export function extractRequestParams(endpoint) {
  let url;
  try {
    url = new URL(String(endpoint ?? '').trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.search) return null;

  const params = Array.from(url.searchParams, ([key, value]) => ({
    key,
    value,
    enabled: true,
  }));
  url.search = '';

  return { url: url.toString(), params };
}

export function appendRequestParams(endpoint, params, interpolate = (value) => value) {
  let url;
  try {
    url = new URL(String(endpoint ?? '').trim());
  } catch {
    return endpoint;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return endpoint;

  for (const param of params ?? []) {
    const key = interpolate(param.key ?? '').trim();
    if (!param.enabled || !key) continue;

    url.searchParams.append(key, interpolate(param.value ?? ''));
  }

  return url.toString();
}
