const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node validate-entry.js <file>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`${filePath}: file does not exist`);
  process.exit(1);
}

const raw = fs.readFileSync(filePath, 'utf-8');
let entry;

try {
  entry = JSON.parse(raw);
} catch (e) {
  console.error(`${filePath}: not valid JSON - ${e.message}`);
  process.exit(1);
}

try {
  utils.validateEvent(entry);
} catch (e) {
  console.error(`${filePath}: ${e.message}`);
  process.exit(1);
}

console.log(`${filePath} looks good`);
