/** Resolve environment placeholders such as `{{base_url}}` in request text. */
export const interpolate = (template, vars) =>
  Object.entries(vars || {}).reduce(
    (acc, [key, value]) => acc.split(`{{${key}}}`).join(value),
    String(template ?? ''),
  );
