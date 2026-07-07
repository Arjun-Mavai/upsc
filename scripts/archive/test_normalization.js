const { normalizeSubject } = require('./src/features/tests/utils/pyq-subject');

const subjects = [
  'Environment',
  'Geography',
  'Environment & Ecology',
  'History',
  'Ancient History',
  'Current Affairs',
  'Environment / IR'
];

subjects.forEach(s => {
  console.log(`'${s}' -> '${normalizeSubject(s)}'`);
});
