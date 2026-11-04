import { interpolate } from './interpolate.js';

export function parseGraphQLVariables(source, variables = {}) {
  const parsed = JSON.parse(interpolate(source || '{}', variables));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('GraphQL variables must be a JSON object.');
  }
  return parsed;
}

export function buildGraphQLBody(query, variableSource, environment = {}) {
  return JSON.stringify({
    query: interpolate(query, environment),
    variables: parseGraphQLVariables(variableSource, environment),
  });
}
