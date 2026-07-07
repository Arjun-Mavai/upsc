const fs = require('fs');
const path = 'src/config/mains-topic-ai-prompt.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace MPPSC with UPSC IAS
content = content.replace(/MPPSC/g, 'UPSC IAS');
content = content.replace(/MPPSC State Service/g, 'UPSC Civil Services');
content = content.replace(/MP-specific/g, 'India/Global-specific');
content = content.replace(/MP /g, 'India ');
content = content.replace(/MPPSC एंगल/g, 'UPSC IAS Angle');

// Replace MPPSC marking schemes with UPSC marking schemes
content = content.replace(/15×2m \(≤20 words\), 10×7m \(≤60 words\), 5×10m \(≤200 words\) → 150 marks\/section/g, '10×10m (150 words), 10×15m (250 words) → 250 marks');
content = content.replace(/16×2m, 8×7m, 4×11m \(≤200 words\), 1×18m case study → 150 marks\/section/g, 'Section A: 13×10m, Section B: 6×20m case studies → 250 marks');
content = content.replace(/"2m": exactly two/g, '"10m": exactly two');
content = content.replace(/"7m": two or three/g, '"15m": two or three');
content = content.replace(/2m /g, '10m ');
content = content.replace(/7m /g, '15m ');
content = content.replace(/10\/11m/g, '15m');
content = content.replace(/11m/g, '15m');
content = content.replace(/case18/g, 'case20');

// Replace expected demo block specifics
content = content.replace(/One 2-mark style prompt./g, 'One 10-mark (150 words) style prompt.');
content = content.replace(/One 7-mark analytic prompt./g, 'One 15-mark (250 words) analytic prompt.');
content = content.replace(/One 10-mark essay-style prompt./g, 'One Essay/20-mark analytic prompt.');

fs.writeFileSync(path, content);
console.log('Master prompt updated for UPSC.');
