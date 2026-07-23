const readline = require('readline');
const path = require('path');
const utils = require('./utils');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function run() {
  console.log("\n=== The Protest Record Archive Entry Wizard ===\n");
  
  const date = await ask('Date (YYYY-MM-DD): ');
  const title = await ask('Title: ');
  const location = await ask('Location (e.g. Jantar Mantar, New Delhi): ');
  
  console.log("\nCategories: photos-videos | stories | art-posters-memes | news-articles | social-links");
  const category = await ask('Category: ');
  const description = await ask('Description/Stories: ');
  const tagsStr = await ask('Tags (comma separated, e.g. march, police): ');
  const graphic = await ask('Does this show injury or violence? (y/n): ');
  
  console.log("\n-- Media & Links --");
  const imagesStr = await ask('Image/Video filenames (comma separated, must be in data/images/): ');
  const source_link = await ask('News Article or Social Media Link: ');
  const contributor = await ask('Name or initials (leave blank for anonymous): ');
  const socials = await ask('Socials (Instagram, X): ');

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

  if (socials) event.socials = socials;
  if (source_link) event.source_link = source_link;

  const eventsDir = path.join(__dirname, '..', 'data', 'events');
  try {
    const filepath = utils.saveEvent(eventsDir, event);
    console.log(`\n[SUCCESS] Created ${filepath}`);
    console.log('You can now run publish.bat to push it to the live site!');
  } catch (err) {
    console.error(`\n[ERROR] Failed to create entry: ${err.message}`);
  }
  
  rl.close();
}

run();
