# PetriPals 🧫

A cute microbiology game for the browser. Pick a bacterial pal, eat nutrients to grow your colony, and steer clear of the antibiotic disks and their zones of inhibition.

**[▶ Play PetriPals](https://jessicasogge.github.io/petripals/)**: works on computers, phones and tablets.

<img src="docs/screenshot.png" alt="Scarlett, a red Streptococcus pyogenes, swimming in a petri dish between antibiotic disks labeled P, CC and E, each with a clear zone around it" width="480">

## How to play

1. **Pick a pal.** Each one is a real bacterium, drawn as a cartoon.
2. **Swim around the dish.** Use the arrow keys, or on a touch screen, touch and hold where you want to swim.
3. **Eat nutrients to divide.** Every cell that eats a nutrient divides in two, just like binary fission. Grow your colony to the target size to finish the level.
4. **Don't touch the antibiotics.** Touching a disk, or the clear zone of inhibition around it, ends the game. Antibiotics kill bacteria!

There are seven levels. Each one adds another antibiotic disk and doubles the colony you need to grow, from 4 cells up to 256.

## The pals

| Pal | Species | Shape |
|---|---|---|
| **Mona** | *Pseudomonas aeruginosa* | Green rod with one flagellum |
| **Vi** | *Vibrio cholerae* | Orange comma-shaped rod |
| **Goldie** | *Staphylococcus aureus* | Golden grape-like clusters of round cells |
| **Scarlett** | *Streptococcus pyogenes* | Red chains of round cells |
| **Elia** | *Borrelia burgdorferi* | Purple corkscrew (spirochete) |
| **Coco** | *Haemophilus influenzae* | Small coffee-with-cream coccobacillus |

## The real science

The game is loosely based on real lab microbiology:

- **How each pal grows:** rods split and swim apart after dividing. Round cells (cocci) stay stuck together, in chains for *Streptococcus*, which divides in one plane, and in grape-like clusters for *Staphylococcus*, which divides in several.
- **The antibiotic disks** are modeled on the Kirby-Bauer disk test. Each disk is a drug commonly used against that pal's species, labeled with its standard disk code (CIP for ciprofloxacin, P for penicillin, and so on).
- **The zones of inhibition** are sized from ballpark zone diameters a lab would measure for a susceptible strain of that species, scaled down to fit the dish. A bigger zone means the drug works better. *Borrelia* can't be grown for disk tests, so Elia's zones are made up from how well each drug works on her.

## Running it locally

The game is plain HTML, CSS and JavaScript in [`public/`](public/), with no build step. To run it with the included dev server:

```sh
npm install
npm run dev
```

Then open http://localhost:3000.

## Tests

```sh
npm test
```

The tests use [Vitest](https://vitest.dev/). Most of the game logic runs in [jsdom](https://github.com/jsdom/jsdom), a simulated browser page.

## Project layout

| Path | What's there |
|---|---|
| `public/index.html` | Home page |
| `public/pal-picker.html` | Pick a pal |
| `public/petri-dish.html` | The game |
| `public/game/` | Game code: the game loop (`game.js`), pals (`rod.js`, `coccus.js`), antibiotics (`antibiotic.js`), nutrients, physics, touch steering, and settings (`config.js`) |
| `test/` | Tests |
| `src/index.ts` | Small Express server for local development |

## Deployment

Every push to `main` runs the tests and, if they pass, publishes `public/` to GitHub Pages (see [`.github/workflows/pages.yml`](.github/workflows/pages.yml)).

## Contributing

Bug reports, ideas and fixes are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started, and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

PetriPals is released under the [ISC License](LICENSE). The confetti uses [canvas-confetti](https://github.com/catdad/canvas-confetti), also ISC licensed ([`public/game/vendor/confetti.LICENSE`](public/game/vendor/confetti.LICENSE)).

## Credits

Made by Jessica Sogge.
