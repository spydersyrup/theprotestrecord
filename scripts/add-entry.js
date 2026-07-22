const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function run() {
  console.log("\n=== TWLD Archive Entry Wizard ===\n");
  
  const date = await ask('Date (YYYY-MM-DD): ');
  const title = await ask('Title: ');
  const location = await ask('Location (e.g. Jantar Mantar, New Delhi): ');
  
  console.log("\nCategories: photos-videos | stories | art-memes | news-articles");
  const category = await ask('Category: ');
  const description = await ask('Description: ');
  const tagsStr = await ask('Tags (comma separated, e.g. march, police): ');
  const graphic = await ask('Graphic content? (y/n): ');
  
  console.log("\n-- Media & Links --");
  const imagesStr = await ask('Image filenames (comma separated, must already be in data/images/): ');
  const ig_handle = await ask('IG Handle (optional): ');
  const x_handle = await ask('X Handle (optional): ');
  const source_link = await ask('Source URL (optional, for articles): ');
  const contributor = await ask('Contributor Name: ');

  // Generate URL-friendly ID
  const id = date + '-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const event = {
    id,
    date,
    location,
    title,
    category,
    description,
    tags: tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : [],
    graphic_content: graphic.toLowerCase().startsWith('y'),
    images: imagesStr ? imagesStr.split(',').map(s => s.trim()).filter(Boolean) : [],
    contributor: contributor || 'Anonymous',
    submitted_via: 'tally-form',
    verified: true
  };

  if (ig_handle) event.ig_handle = ig_handle;
  if (x_handle) event.x_handle = x_handle;
  if (source_link) event.source_link = source_link;

  const filepath = path.join(__dirname, '..', 'data', 'events', `${id}.json`);
  fs.writeFileSync(filepath, JSON.stringify(event, null, 2));
  
  console.log(`\n[SUCCESS] Created ${filepath}`);
  console.log('You can now run publish.bat to push it to the live site!');
  rl.close();
}

run();
