function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getExplanationObject(value: unknown): Record<string, any> | null {
  if (!isRecord(value)) {
    return null;
  }

  // Direct expert blob: { stream: "mppsc_expert", ... } — do not require a nested "explanation" key
  if (
    typeof (value as { stream?: unknown }).stream === 'string' &&
    ((value as { stream: string }).stream === 'mppsc_expert' ||
      (value as { stream: string }).stream === 'csat_logic')
  ) {
    return value as Record<string, any>;
  }

  if ('explanation' in value) {
    const explanation = value.explanation;
    return isRecord(explanation) ? (explanation as Record<string, any>) : null;
  }

  return value as Record<string, any>;
}

export function parseExtendedData(data: unknown): Record<string, any> | null {
  if (!data) return null;
  let parsed: unknown = data;

  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data) as unknown;
    } catch {
      return null;
    }
  }

  // Handling array structure in case the db or parser wraps it
  if (Array.isArray(parsed) && parsed.length > 0) {
    return getExplanationObject(parsed[0]);
  }

  return getExplanationObject(parsed);
}
