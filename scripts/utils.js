const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'id', 'date', 'location', 'title', 'category', 'description',
  'tags', 'graphic_content', 'images', 'contributor',
  'submitted_via', 'verified'
];

const STRING_FIELDS = ['id', 'location', 'title', 'category', 'contributor', 'submitted_via'];
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, 'source_url', 'ig_handle', 'x_handle', 'source_link', 'socials']);

function validateEvent(entry) {
  const missing = REQUIRED_FIELDS.filter(field => !(field in entry));
  if (missing.length > 0) {
    throw new Error(`Missing fields: ${missing.join(', ')}`);
  }

  const extra = Object.keys(entry).filter(key => !ALLOWED_FIELDS.has(key));
  if (extra.length) {
    throw new Error(`Unknown fields: ${extra.join(', ')}`);
  }

  for (const field of STRING_FIELDS) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      throw new Error(`Field '${field}' must be a non-empty string`);
    }
  }

  if (typeof entry.description !== 'string') {
    throw new Error(`Field 'description' must be a string`);
  }
}

function saveEvent(eventsDir, event) {
  validateEvent(event);
  const filepath = path.join(eventsDir, `${event.id}.json`);
  fs.writeFileSync(filepath, JSON.stringify(event, null, 2));
  return filepath;
}

module.exports = {
  validateEvent,
  saveEvent,
  REQUIRED_FIELDS,
  ALLOWED_FIELDS
};
