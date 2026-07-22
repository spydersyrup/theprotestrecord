const fs = require('fs');
const path = require('path');

const requiredFields = [
  'id', 'date', 'location', 'title', 'category', 'description',
  'tags', 'graphic_content', 'images', 'contributor',
  'submitted_via', 'verified'
];

const stringFields = ['id', 'location', 'title', 'category', 'description', 'contributor', 'submitted_via'];
const allowedSubmissionMethods = ['github-pr', 'google-form'];
const tagPattern = /^[a-z0-9-]+$/;
const imagePattern = /^[A-Za-z0-9._-]+\.(jpg|jpeg|png)$/i;

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

const missing = requiredFields.filter(field => !(field in entry));
if (missing.length > 0) {
  console.error(`${filePath}: missing fields - ${missing.join(', ')}`);
  process.exit(1);
}

const allowedFields = new Set([...requiredFields, 'source_url']);
const extra = Object.keys(entry).filter(key => !allowedFields.has(key));
if (extra.length) {
  console.error(`${filePath}: unknown fields - ${extra.join(', ')}`);
  process.exit(1);
}

for (const field of stringFields) {
  if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
    console.error(`${filePath}: ${field} must be a non-empty string`);
    process.exit(1);
  }
}

if (entry.contributor.length > 100) {
  console.error(`${filePath}: contributor is too long (max 100 characters)`);
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(entry.id)) {
  console.error(`${filePath}: id must be lowercase letters, numbers, and hyphens only`);
  process.exit(1);
}

const expectedFilename = `${entry.id}.json`;
if (path.basename(filePath) !== expectedFilename) {
  console.error(`${filePath}: filename must match id (${expectedFilename})`);
  process.exit(1);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
  console.error(`${filePath}: date must be YYYY-MM-DD`);
  process.exit(1);
}
const [y, m, d] = entry.date.split('-').map(Number);
const parsedDate = new Date(`${entry.date}T00:00:00Z`);
if (
  Number.isNaN(parsedDate.getTime()) ||
  parsedDate.getUTCFullYear() !== y ||
  parsedDate.getUTCMonth() + 1 !== m ||
  parsedDate.getUTCDate() !== d
) {
  console.error(`${filePath}: ${entry.date} is not a real calendar date`);
  process.exit(1);
}

if (!entry.id.startsWith(`${entry.date}-`)) {
  console.error(`${filePath}: id should begin with the event date (${entry.date}-...)`);
  process.exit(1);
}

if (!allowedSubmissionMethods.includes(entry.submitted_via)) {
  console.error(`${filePath}: submitted_via must be github-pr or google-form`);
  process.exit(1);
}

const allowedCategories = ['photos-videos', 'stories', 'art-memes', 'news-articles'];
if (!allowedCategories.includes(entry.category)) {
  console.error(`${filePath}: category must be photos-videos, stories, art-memes, or news-articles`);
  process.exit(1);
}

if (entry.category === 'news-articles') {
  if (typeof entry.source_url !== 'string' || !entry.source_url.trim()) {
    console.error(`${filePath}: source_url is required and must be a non-empty string for news-articles`);
    process.exit(1);
  }
  try {
    new URL(entry.source_url);
  } catch (e) {
    console.error(`${filePath}: source_url must be a valid URL`);
    process.exit(1);
  }
} else if (entry.source_url !== undefined) {
  if (typeof entry.source_url !== 'string' || (entry.source_url !== '' && !entry.source_url.trim())) {
    console.error(`${filePath}: source_url must be a string if provided`);
    process.exit(1);
  }
}

if (typeof entry.graphic_content !== 'boolean') {
  console.error(`${filePath}: graphic_content must be true or false`);
  process.exit(1);
}
if (typeof entry.verified !== 'boolean') {
  console.error(`${filePath}: verified must be true or false`);
  process.exit(1);
}

if (!Array.isArray(entry.tags) || !entry.tags.every(tag => typeof tag === 'string' && tagPattern.test(tag))) {
  console.error(`${filePath}: tags must contain lowercase letters, numbers, and hyphens only`);
  process.exit(1);
}
if (entry.tags.length === 0) {
  console.error(`${filePath}: at least one tag is required`);
  process.exit(1);
}
if (new Set(entry.tags).size !== entry.tags.length) {
  console.error(`${filePath}: duplicate tags`);
  process.exit(1);
}

if (!Array.isArray(entry.images) || !entry.images.every(img => typeof img === 'string' && imagePattern.test(img))) {
  console.error(`${filePath}: images must be filenames like name.jpg, name.jpeg, or name.png`);
  process.exit(1);
}
if (new Set(entry.images).size !== entry.images.length) {
  console.error(`${filePath}: duplicate images`);
  process.exit(1);
}

const imagesRoot = path.resolve('images');
for (const image of entry.images) {
  const imagePath = path.resolve('images', image);
  if (!imagePath.startsWith(imagesRoot + path.sep)) {
    console.error(`${filePath}: invalid image path - ${image}`);
    process.exit(1);
  }
  if (!fs.existsSync(imagePath)) {
    console.error(`${filePath}: image not found - ${image}`);
    process.exit(1);
  }
}

console.log(`${filePath} looks good`);
