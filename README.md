# Rob's Gin Bar — English Billiards Scorer

A self-contained, mobile-first scoreboard for marking up a game of English
Billiards, themed for **Rob's Gin Bar** — a home bar and snooker club. It runs
entirely in the browser from a single HTML file — no build step, no server-side
code, no dependencies to install, and no network connection required once the
page has loaded.

The whole app lives in [`index.html`](index.html): markup, styling and game
logic are bundled into one file so it can be dropped onto any static web host —
including GitHub Pages, which serves it straight from the repository root — or
simply opened from disk.

---

## Purpose

When friends play English Billiards down the pub or in the club room, keeping
score on a chalkboard is fiddly and easy to get wrong. This tool turns a phone,
tablet or laptop into a dedicated marker's board:

- Tap a button each time a player scores and the totals, the current break and
  the high break all update automatically.
- It enforces nothing about *how* you play — it simply does the arithmetic, so
  the players stay in charge of the game.
- At the end it shows a full breakdown of the match: per-player statistics and a
  score-progression chart.

It is designed to feel at home on the table rail and behind the bar: the look is
drawn straight from the room — the green cloth and glossy black rails of the
table, the tan leather pockets, and the cream / gold / hairline-green of the
Rob's Gin Bar bottle label, which is reproduced as a diamond mark in the header.
Big touch targets, a screen that stays awake while you play, and a gently
animated backdrop of drifting billiard balls round it off.

---

## Scoring rules

The buttons follow standard English Billiards scoring:

| Action            | Points | Notes                                   |
| ----------------- | -----: | --------------------------------------- |
| Pot Red           | **+3** | Potting the red ball                    |
| In-off Red        | **+3** | Cue ball goes in off the red            |
| Pot Cue Ball      | **+2** | Potting the opponent's (white) cue ball |
| In-off Cue Ball   | **+2** | Cue ball goes in off the other cue ball |
| Cannon            | **+2** | Cue ball strikes both other balls       |
| Foul              | **+2** | Awarded to the **opponent**             |

Points accumulate into the striker's **current break** until the break ends
(either by ending the turn or committing a foul). The highest break each player
makes during the match is tracked separately.

The match is won by the first player to reach the agreed target score
(the "finish line"). Targets of 50, 100, 150 or 200 are one tap away, or you can
type any number.

---

## Using the tool

### Opening it

- **Locally:** open `index.html` in any modern browser (double-click it, or
  drag it onto a browser window).
- **Hosted:** upload `index.html` to any static web host, or enable **GitHub
  Pages** for the repository — because the file sits at the root, Pages serves
  it as the site's home page with no extra configuration. Then visit the page.
- **As an app:** on iOS/Android, use *Add to Home Screen* to launch it
  full-screen like a native app.

### Setting up a match

1. Enter each player's name (optional — defaults to "Player 1" / "Player 2").
2. Pick a coloured ball for each player. The colour the opponent picks is shown
   on the cue-ball buttons during play so it's clear which ball is which.
3. Choose the finish line (the score the match is played to).
4. Tap **Start match**.

### During play

- The active player's panel is highlighted and marked **In play**.
- Before any points are scored you can tap the *other* player's panel to swap
  who breaks first.
- Tap a scoring button each time the striker scores; the score, current break
  and high break update immediately.
- Tap **End break & change player** to hand over to the opponent.
- Tap **Foul (+2 opp.)** to award two points to the opponent and pass the turn.
- **Undo** reverses the last action (multiple levels of undo are supported).
- **New match** resets everything (with a confirmation prompt).

### Extras

- **Full screen** — toggle a distraction-free full-screen view.
- **Screen** — a keep-awake toggle so the display doesn't lock mid-frame
  (where the browser supports it).
- **Sounds** — choose a sound pack (Arcade, Sci-Fi, Jazz Age, Darts, Classic)
  or mute entirely. All sounds are synthesised in the browser — no audio files.

### End of the match

When a player reaches the target, an end screen shows:

- The winner and the final score.
- A match summary (scoring strokes, lead changes, best break).
- Per-player statistics: final score, highest break, visits, average per visit,
  cannons, pots, in-offs and fouls conceded.
- A score-progression line chart for both players.

From there you can start a **Rematch** with the same players and settings, or
set up a **New match**.

---

## Technical notes

- **Single file, zero dependencies.** Everything is inline in `index.html`. The
  only external resources are Google Fonts, which are optional — the page falls
  back to system fonts if they can't load.
- **No data is stored or transmitted.** All state lives in memory for the
  duration of the match; refreshing the page starts over.
- **Progressive enhancement.** Wake-lock, full-screen and the Web Audio API are
  all used only when available and degrade gracefully when they aren't.
- **Animated background, no libraries.** The drifting billiard balls are a
  hand-rolled 2D `<canvas>` simulation — wall bounce, ball-to-ball collisions and
  a push-away from your finger or cursor — with no WebGL and no third-party code.
  It dims during play so the scoreboard stays legible, and falls back to a static
  arrangement when the device prefers reduced motion.
- **Responsive.** Layouts are tuned for phones, tablets and landscape displays.

## Tests

End-to-end tests (Playwright) drive the real page and check the full flow:
branding and the ballpit, score / break / high-break maths, end break, fouls,
undo, choosing who breaks first, the win condition and end-of-match summary,
rematch / new match, and the sound controls. They run against both a desktop
and a mobile (Pixel 5) profile.

```bash
npm install                 # install @playwright/test
npx playwright install chromium   # one-time browser download
npm test                    # run the suite (spins up a local static server)
```

`npm run test:headed` watches it happen in a browser; `npm run test:ui` opens
Playwright's interactive runner. The app itself stays dependency-free — these
dev dependencies are only for running the tests.

## Repository layout

```
.
├── index.html             # the entire application (no build step)
├── tests/
│   └── billiards.spec.js  # Playwright end-to-end tests
├── playwright/
│   └── static-server.js   # tiny zero-dependency server used by the tests
├── playwright.config.js   # test + dev-server configuration
├── package.json           # test scripts and dev dependencies
├── package-lock.json      # locked dependency versions
├── .gitignore             # excludes node_modules/ and test output
└── README.md              # this file
```

`node_modules/` and Playwright's test output (`test-results/`,
`playwright-report/`) are generated locally and are not committed.
