# TWLD

In July 2026, thousands of young Indians marched peacefully to Parliament demanding accountability from their government. Police responded with tear gas and batons. This is a record of what happened, documented and maintained by the people who were there, not by any newsroom, party, or platform.

Live site: [twld.in](https://twld.in)

## What this is

TWLD brings together photos, videos, written accounts, art, and news coverage of the protest movement into one chronological, categorized archive. Every entry is submitted by contributors and reviewed before publication.

This is an independent personal project, not affiliated with any political party or organization.

## Categories

- **Photos & Videos**: Raw footage and images from the ground.
- **Stories**: Written testimony and firsthand accounts.
- **Art & Memes**: Posters, illustrations, memes, and other creative responses.
- **News Articles**: Original summaries of news coverage, linked to the full source article.

## How to contribute

See [CONTRIBUTING.md](contributing.md) for how to submit an entry, whether through the submission form or a GitHub pull request.

## How this is built

Entries live as structured JSON files under `/data/events/`. A Node build script (`scripts/build-site.js`) generates a static site from that data. GitHub Actions automatically strips image metadata, validates every entry, and rebuilds the site on every merge. The site is hosted on GitHub Pages.

No backend, no database. The repository itself is the archive.

## License

MIT. See [LICENSE](LICENSE).
