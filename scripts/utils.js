const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'id', 'date', 'location', 'title', 'category', 'description',
  'tags', 'graphic_content', 'images', 'contributor',
  'submitted_via', 'verified'
];

const STRING_FIELDS = ['id', 'location', 'title', 'category', 'contributor', 'submitted_via'];
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, 'source_url', 'ig_handle', 'x_handle', 'source_link', 'socials']);
const ALLOWED_SUBMISSION_METHODS = ['github-pr', 'google-form', 'bulk-import', 'tally-form'];
const ALLOWED_CATEGORIES = ['photos-videos', 'stories', 'art-posters', 'memes', 'news-articles', 'art-posters-memes', 'social-links'];
const TAG_PATTERN = /^[a-z0-9-]+$/;
const IMAGE_PATTERN = /^[A-Za-z0-9._-]+\.(jpg|jpeg|png|mp4|webm|mov)$/i;

function validateEvent(entry) {
  const missing = REQUIRED_FIELDS.filter(field => !(field in entry));
  if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(', ')}`);

  const extra = Object.keys(entry).filter(key => !ALLOWED_FIELDS.has(key));
  if (extra.length) throw new Error(`Unknown fields: ${extra.join(', ')}`);

  for (const field of STRING_FIELDS) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      throw new Error(`Field '${field}' must be a non-empty string`);
    }
  }

  if (typeof entry.description !== 'string') throw new Error(`Field 'description' must be a string`);
  if (entry.contributor.length > 100) throw new Error(`contributor is too long (max 100 characters)`);
  if (!/^[a-z0-9-]+$/.test(entry.id)) throw new Error(`id must be lowercase letters, numbers, and hyphens only`);
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) throw new Error(`date must be YYYY-MM-DD`);
  const [y, m, d] = entry.date.split('-').map(Number);
  const parsedDate = new Date(`${entry.date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getUTCFullYear() !== y || parsedDate.getUTCMonth() + 1 !== m || parsedDate.getUTCDate() !== d) {
    throw new Error(`${entry.date} is not a real calendar date`);
  }

  if (!entry.id.startsWith(`${entry.date}-`)) throw new Error(`id should begin with the event date (${entry.date}-...)`);
  
  if (!ALLOWED_SUBMISSION_METHODS.includes(entry.submitted_via)) throw new Error(`submitted_via must be one of: ${ALLOWED_SUBMISSION_METHODS.join(', ')}`);
  if (!ALLOWED_CATEGORIES.includes(entry.category)) throw new Error(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);

  if (entry.category === 'news-articles') {
    if (typeof entry.source_url !== 'string' && typeof entry.source_link !== 'string') {
      throw new Error(`source_url or source_link is required and must be a string for news-articles`);
    }
  } else if (entry.source_url !== undefined) {
    if (typeof entry.source_url !== 'string' || (entry.source_url !== '' && !entry.source_url.trim())) throw new Error(`source_url must be a string if provided`);
  }

  if (typeof entry.graphic_content !== 'boolean') throw new Error(`graphic_content must be true or false`);
  if (typeof entry.verified !== 'boolean') throw new Error(`verified must be true or false`);

  if (!Array.isArray(entry.tags) || !entry.tags.every(tag => typeof tag === 'string' && TAG_PATTERN.test(tag))) {
    throw new Error(`tags must contain lowercase letters, numbers, and hyphens only`);
  }
  if (new Set(entry.tags).size !== entry.tags.length) throw new Error(`duplicate tags`);

  if (!Array.isArray(entry.images) || !entry.images.every(img => typeof img === 'string' && IMAGE_PATTERN.test(img))) {
    throw new Error(`images must be valid filenames`);
  }
  if (new Set(entry.images).size !== entry.images.length) throw new Error(`duplicate images`);

  const imagesRoot = path.resolve(__dirname, '..', 'data', 'images');
  for (const image of entry.images) {
    const imagePath = path.resolve(__dirname, '..', 'data', 'images', image);
    if (!imagePath.startsWith(imagesRoot + path.sep)) throw new Error(`invalid image path - ${image}`);
    if (!fs.existsSync(imagePath)) throw new Error(`image not found - ${image}`);
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
