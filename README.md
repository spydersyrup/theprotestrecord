# TWLD - The World's Largest Demockracy

In July 2026, thousands of young Indians marched peacefully to Parliament
demanding accountability from their government. Police responded with tear gas
and batons. This is a record of what happened, documented and maintained by the
people who were there, not by any newsroom, party, or platform.

Live site: [twld.in](https://twld.in)

## What this is

TWLD brings together photos, videos, written accounts, art, and news coverage of
the protest movement into one chronological, categorized archive. Every entry is
submitted by contributors and reviewed before publication.

This is an independent personal project, not affiliated with any political party
or organization.

## Categories

- **Photos & Videos**: Raw footage and images from the ground.
- **Stories**: Written testimony and firsthand accounts.
- **Art & Memes**: Posters, illustrations, memes, and other creative responses.
- **News Articles**: Original summaries of news coverage, linked to the full
  source article.

## How to contribute

See [CONTRIBUTING.md](contributing.md) for how to submit an entry, whether
through the submission form or a GitHub pull request.

## How this is built

The archive is completely decentralized, serverless, and open-source. There is
no backend or database. **The repository itself is the archive.**

Entries live as structured JSON files under `/data/events/`. A custom Node build
script (`scripts/build-site.js`) reads these files and generates a beautiful
static HTML site that can be hosted anywhere (currently GitHub Pages).

### Admin Workflow (For Maintainers)

If you are managing the archive, you can use the built-in Windows automation
scripts to review and publish submissions instantly:

1. **`add-entry.bat`**: Double-click this to launch the interactive CLI Entry
   Wizard. It asks you for the entry details (Date, Title, IG/X handles, Image
   filenames) and automatically generates the perfectly formatted JSON file in
   the `data/` folder.
2. **`publish.bat`**: Double-click this to automatically run the static site
   generator, stage the changes, commit them, and push everything live to
   GitHub!

## License

MIT. See [LICENSE](LICENSE).
