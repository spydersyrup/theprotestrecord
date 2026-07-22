# Contributing to TWLD

## The Protest Archive

This project documents India's youth-led protest movement, starting with the
Cockroach Janta Party demonstrations of 2026. Anyone can contribute.

---

## If you were there and have photos or videos

> You don't need to know GitHub for this.

Fill out this form:

**https://tally.so/r/5BgpNv**

Include:

- Date
- Rough location
- A short caption

We'll review it and add it to the archive.

---

## If you know GitHub

1. Fork this repo.
2. Add a new JSON file under `/data/events/` following the format in
   `data/schema.json`.
3. Assign one of five categories in the `"category"` field (see **Categories**
   below).
4. Add your photos directly to `/data/images/` _(no subfolders, just the file)_.
5. Open a pull request.

We'll review and merge it if it fits the format and the content checks out.

---

## Categories

Every entry belongs to one of four categories.

### Photos & Videos

Raw footage or images from the ground.

### Stories

Written testimony or firsthand accounts.

### Art & Posters

Posters, illustrations, street art, and physical creative responses.

### Memes

Digital memes and internet culture surrounding the protests.

### News Articles

A short original summary of news coverage, with a link to the full article. Do
not copy or paste article text. Just summarize what it reports and link to the
original source using the `source_url` field.

---

## A few ground rules

- Compress photos before uploading. Large files slow things down for everyone.
- **Privacy Protection:** Don't worry about EXIF metadata! Our automated GitHub Action strips all location data and camera details from your photos before they go live to protect your identity.
- Don't include other people's personal information (full names, phone numbers,
  addresses) without their consent.
- If a photo shows someone getting hurt or shows blood, flag it by setting `"graphic_content": true` in your JSON file so we can blur it by default.
- Be accurate. If you're not sure about a date or location, say so instead of
  guessing.
- For **News Articles** entries, write your own summary. Do not reproduce
  article text directly.

---

## What happens after you submit

> Every submission is reviewed before it goes live.

Someone reviews every submission before it goes live. This isn't about
censorship; it's to keep the archive accurate and to catch anything that
shouldn't be public, like someone's face who didn't consent to being identified,
or a location that could put someone at risk.
