const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function run() {
  const picsDir = path.join(__dirname, '..', 'pics');
  const targetImgDir = path.join(__dirname, '..', 'data', 'images');
  const eventsDir = path.join(__dirname, '..', 'data', 'events');
  
  if (!fs.existsSync(picsDir)) {
    console.log("Could not find the 'pics' folder. Make sure it's in the same folder as publish.bat!");
    process.exit(1);
  }

  const files = fs.readdirSync(picsDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  
  if (files.length === 0) {
    console.log("No images found in the 'pics' folder!");
    process.exit(0);
  }

  console.log(`\n=== The Protest Record Bulk Importer ===`);
  console.log(`Found ${files.length} images to process.\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`--------------------------------------------------`);
    console.log(`[${i + 1}/${files.length}] Processing: ${file}`);
    console.log(`--------------------------------------------------`);

    // Extract default date from screenshots (e.g. Screenshot_20260720-113240...)
    let defaultDate = new Date().toISOString().split('T')[0];
    const dateMatch = file.match(/2026(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
    if (dateMatch) {
      defaultDate = `2026-${dateMatch[1]}-${dateMatch[2]}`;
    }

    const title = await ask('Title: ');
    if (!title) {
      console.log("Skipping this file...\n");
      continue;
    }

    const date = await ask(`Date (YYYY-MM-DD) [${defaultDate}]: `);
    const finalDate = date || defaultDate;

    console.log("Categories: photos-videos | stories | art-posters-memes | news-articles | social-links");
    const category = await ask('Category [photos-videos]: ');
    const finalCat = category || 'photos-videos';

    const source_url = await ask('Source URL (Optional): ');
    
    // Generate URL-friendly ID
    const id = finalDate + '-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const event = {
      id,
      date: finalDate,
      location: 'New Delhi', // default
      title,
      category: finalCat,
      description: '',
      tags: [],
      graphic_content: false,
      images: [file],
      contributor: 'Anonymous',
      submitted_via: 'bulk-import',
      verified: true
    };

    if (source_url) {
      event.source_link = source_url;
    }

    // Get file extension (e.g. .jpg, .png)
    const ext = path.extname(file).toLowerCase();
    
    // Create a beautifully clean filename based on the title
    const newFilename = id + ext;
    event.images = [newFilename];

    // 1. Move and RENAME image to data/images/
    fs.renameSync(path.join(picsDir, file), path.join(targetImgDir, newFilename));
    
    // 2. Save JSON to data/events/
    const filepath = path.join(eventsDir, `${id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(event, null, 2));
    
    console.log(`[SAVED] Created entry and moved image to data/images/!`);
    console.log("");
  }

  console.log(`\nAll done processing the 'pics' folder!`);
  console.log('You can now run publish.bat to push them to the live site!');
  rl.close();
}

run();
