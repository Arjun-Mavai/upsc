const fs = require('fs');
const content = fs.readFileSync('/Users/arjun/Developer/mppsc-new/src/db/schema.ts', 'utf-8');
const matches = content.match(/sqliteTable\(['"]([^'"]+)['"]/g);
if(matches) {
  const tables = matches.map(m => m.match(/['"]([^'"]+)['"]/)[1]);
  console.log("=== TABLES IN LOCAL SCHEMA ===");
  console.log(tables.sort().join('\n'));
} else {
  console.log("No tables found in schema.ts");
}
