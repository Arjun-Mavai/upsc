
const logger = {
  warn: (msg, data) => console.log('WARN:', msg, data)
};

const safeParse = (val, fallback = null) => {
  if (val == null) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (err) {
    logger.warn('Failed to parse:', { error: err.message, value: val.substring(0, 50) });
    return fallback;
  }
};

const testCases = [
  { input: '{"a": 1}', expected: { a: 1 }, name: 'Valid JSON' },
  { input: '', expected: [], name: 'Empty String' },
  { input: '{invalid}', expected: [], name: 'Malformed JSON' },
  { input: null, expected: [], name: 'Null' },
  { input: undefined, expected: [], name: 'Undefined' },
  { input: [1, 2, 3], expected: [1, 2, 3], name: 'Already Array' },
  { input: '[]', expected: [], name: 'Empty Array String' }
];

console.log('--- Verifying safeParse logic ---');
testCases.forEach(tc => {
  const result = safeParse(tc.input, []);
  const passed = JSON.stringify(result) === JSON.stringify(tc.expected);
  console.log(`${passed ? '✅' : '❌'} ${tc.name}: ${JSON.stringify(result)}`);
});
