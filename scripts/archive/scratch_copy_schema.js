const fs = require('fs');

const mppscSchemaPath = '/Users/arjun/Developer/mppsc-new/src/db/schema.ts';
const upscSchemaPath = '/Users/arjun/upsc/upsc/src/db/schema.ts';

const mppscSchema = fs.readFileSync(mppscSchemaPath, 'utf8');
const upscSchema = fs.readFileSync(upscSchemaPath, 'utf8');

// We need to add accessGrants to mppscUsers in upsc schema
let newUpscSchema = upscSchema.replace(
  `    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),`,
  `    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
    /** Product entitlements JSON string, e.g. \`["upsc_pre","upsc_mains"]\`. */
    accessGrants: text('access_grants').$type<string | null>().default(sql\`'["upsc_pre"]'\`),
    // Session version for single-device login enforcement
    sessionVersion: integer('session_version').default(1),`
);

// We need to extract the MAINS section from mppscSchema
const startMarker = '// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n// 🏛️ MPPSC MAINS SECTION TABLES';
const endMarker = '// 💰 PRICING CONFIG';

const startIndex = mppscSchema.indexOf(startMarker);
const endIndex = mppscSchema.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find mains section markers.");
  process.exit(1);
}

let mainsSection = mppscSchema.slice(startIndex, endIndex);

// Replace mppsc_mains default examType with upsc
mainsSection = mainsSection.replace(/default\('mppsc_mains'\)/g, "default('upsc')");
// Replace the enum to match upsc
mainsSection = mainsSection.replace(/enum: \['upsc', 'mppsc', 'all', 'mppolice', 'mppsc_mains'\]/g, "enum: ['upsc', 'mppsc', 'mppolice']");

// We don't need mppscMainsUsers because we are using mppscUsers with accessGrants now.
// Let's replace references of mppscMainsUsers with mppscUsers
mainsSection = mainsSection.replace(/mppscMainsUsers/g, 'mppscUsers');

// Remove the mppscMainsUsers table definition entirely from mainsSection
const userTableStart = mainsSection.indexOf('// 1. Mains Users');
const userTableEnd = mainsSection.indexOf('// 2. Mains Papers');
if (userTableStart !== -1 && userTableEnd !== -1) {
    mainsSection = mainsSection.substring(0, userTableStart) + mainsSection.substring(userTableEnd);
}


// Append mainsSection to newUpscSchema
newUpscSchema += '\n\n' + mainsSection;

fs.writeFileSync(upscSchemaPath, newUpscSchema);
console.log('Successfully updated schema!');
