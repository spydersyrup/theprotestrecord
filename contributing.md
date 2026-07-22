# Contributing to TWLD

This project documents India's youth-led protest movement, starting with the Cockroach Janta Party demonstrations of July 2026. Anyone can contribute.

## If you were there and have photos or videos

You don't need to know GitHub for this. Fill out this form: [https://tally.so/r/5BgpNv]

Include the date, rough location, and a short caption. We'll review it and add it to the archive.

## If you know GitHub

1. Fork this repo
2. Add a new JSON file under `/data/events/` following the format in `data/schema.json`
3. Assign one of four categories in the `"category"` field (see Categories below)
4. Add your photos directly to `/images/` (no subfolders, just the file)
5. Open a pull request

We'll review and merge it if it fits the format and the content checks out.

## Categories

Every entry belongs to one of four categories:

- **Photos & Videos**: Raw footage or images from the ground.
- **Stories**: Written testimony or firsthand accounts.
- **Art & Memes**: Posters, illustrations, memes, and other creative responses.
- **News Articles**: A short original summary of news coverage, with a link to the full article. Do not copy or paste article text. Just summarize what it reports and link to the original source using the `source_url` field.

## A few ground rules

- Compress photos before uploading. Large files slow things down for everyone.
- Don't include other people's personal information (full names, phone numbers, addresses) without their consent.
- If a photo shows someone getting hurt or shows blood, flag it in the caption so we can mark it as graphic content.
- Be accurate. If you're not sure about a date or location, say so instead of guessing.
- For News Articles entries, write your own summary. Do not reproduce article text directly.

## What happens after you submit

Someone reviews every submission before it goes live. This isn't about censorship, it's to keep the archive accurate and to catch anything that shouldn't be public, like someone's face who didn't consent to being identified, or a location that could put someone at risk.
