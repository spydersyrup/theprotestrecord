<div align="center">

# The Protest Record

### _The World's Largest Demockracy_

A community-driven archive documenting India's 2026 protest movement through
photos, videos, stories, artwork, and news coverage.

[![Website](https://img.shields.io/badge/Website-000000?style=flat-square\&logo=safari\&logoColor=white)](https://theprotestrecord.pages.dev)
[![Contribute](https://img.shields.io/badge/Contribute-000000?style=flat-square\&logo=github\&logoColor=white)](CONTRIBUTING.md)
[![License](https://img.shields.io/badge/License-MIT-000000?style=flat-square)](LICENSE)

</div>

---

## About

In July 2026, thousands of young Indians marched peacefully to Parliament
demanding accountability from their government. Police responded with tear gas
and batons.

The Protest Record exists to preserve what happened through photos, videos,
firsthand accounts, artwork, and news coverage submitted by the people who
witnessed it.

This is an independent personal project and is **not affiliated with any
political party or organization.**

---

## Categories

| Category            | Description                                                               |
| :------------------ | :------------------------------------------------------------------------ |
| **Photos & Videos** | Raw footage and images from the ground                                    |
| **Stories**         | Written testimony and firsthand accounts                                  |
| **Art & Memes**     | Posters, illustrations, memes, and other creative responses               |
| **News Articles**   | Original summaries of news coverage with links to the full source article |

---

## Contributing

Anyone can contribute.

Whether you're submitting photos, videos, stories, artwork, or opening a pull
request, see the contribution guide below.

[![Contribution Guide](https://img.shields.io/badge/CONTRIBUTING.md-000000?style=flat-square\&logo=github\&logoColor=white)](CONTRIBUTING.md)

---

## Architecture

The archive is fully decentralized, serverless, and open source.

There is **no backend** and **no database**.

> **The repository itself is the archive.**

Entries are stored as structured JSON files under `data/events/`.

A custom Node.js build script (`scripts/build-site.js`) reads these files and
generates a static website, currently deployed on Cloudflare Pages.

![HTML5](https://img.shields.io/badge/HTML5-1a1a1a?style=flat-square&logo=html5&logoColor=E34F26)
![CSS3](https://img.shields.io/badge/CSS3-1a1a1a?style=flat-square&logo=css3&logoColor=1572B6)
![JavaScript](https://img.shields.io/badge/JavaScript-1a1a1a?style=flat-square&logo=javascript&logoColor=F7DF1E)
![Node.js](https://img.shields.io/badge/Node.js-1a1a1a?style=flat-square&logo=nodedotjs&logoColor=5FA04E)
![JSON](https://img.shields.io/badge/JSON-1a1a1a?style=flat-square&logo=json&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-1a1a1a?style=flat-square&logo=cloudflarepages&logoColor=F38020)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-1a1a1a?style=flat-square&logo=githubactions&logoColor=2088FF)
![ExifTool](https://img.shields.io/badge/ExifTool-1a1a1a?style=flat-square&logo=linux&logoColor=FCC624)

---

## Maintainer Workflow

### `add-entry.bat`

Launches an interactive CLI wizard that collects entry details and generates a
correctly formatted JSON file inside `data/events/`.

### `publish.bat`

Runs the static site generator, stages changes, commits everything, and
publishes the latest version automatically.

---

## License

Released under the MIT License.

[![MIT License](https://img.shields.io/badge/LICENSE-MIT-000000?style=flat-square)](LICENSE)

---

<div align="center">

Built to preserve history. Maintained by the community.

</div>
