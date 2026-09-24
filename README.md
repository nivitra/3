# September research

A static reading list in white, blue, and black, with a bundled Three.js paper sculpture. No hosting account, build step, CDN, or external font service is required to view the committed website.

Open `index.html` in a browser. The page also runs through a local server:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8765.

## Contents

- 127 distinct reads merged from both research workbooks. Companion articles, PDFs, and code repositories are grouped beside their paper.
- 12 featured picks containing 13 reads. All ten requested selections are retained; Claude misuse is ninth and the NVIDIA pair shares the tenth slot. JIT-Agent and the RSI survey remain featured as picks 11 and 12.
- Exactly three Important labels: WikiSkill, Dream-RSI, and the Anthropic report.
- 14 research indexes.
- Full-text search, 10 topic filters, lab and format filters, date/title sorting, result counts, clear controls, and an empty-results state. Filters are preserved in the URL for sharing.
- Corrected generic and outdated spreadsheet destinations using publisher pages, including the Astra system card, Navier–Stokes article, Claude report, and Meta publications index.
- A real WebGL paper sculpture with textured layers, slow floating motion, pointer response, loading feedback, card tilt, and scroll entrances.
- Animation pauses offscreen and in hidden tabs. A visible pause control and the operating system’s reduced-motion preference disable motion. Without WebGL or JavaScript, the complete reading list remains available.
- Responsive layouts, keyboard focus styles, and print styles.

`catalog.json` contains the source entries, featured ordering, companion sources, and updated links. `link-checks.json` records checks for all 167 external destinations on 24 September 2026: 158 returned HTTP 200 directly; nine were confirmed through retrieved publisher content with web browsing. Direct-request errors are retained in the audit where observed. These checks establish availability at the time of review, not a guarantee of future access or research quality. SoL-Pi’s publication date is corrected to 17 September using its arXiv record.

Browser checks cover combined search/filter behavior, empty results, reset, selected/all views, responsive layout, and the animation pause control. The page retains all content when JavaScript is unavailable.

## Editing the animation

The source is `src/motion.js`. To rebuild the committed browser bundle:

```sh
npm ci
npm run build:motion
npm run check
```

Three.js is pinned to 0.180.0. Its license is included in `THIRD_PARTY_LICENSES.txt`.

This website has not been registered with or published to ChatGPT Sites.
