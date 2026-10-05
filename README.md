# PetriPals 🧫

A cute microbiology game for the browser. Pick a bacterial pal and eat nutrients to grow your colony. In **classic** mode, steer clear of the antibiotic disks and their zones of inhibition. In **mixed culture** mode, race a rival pal to take over the plate. In **detective** mode, run lab tests to identify a mystery pal.

**[▶ Play PetriPals](https://jessicasogge.github.io/petripals/)**: works on computers, phones and tablets.

<img src="docs/screenshot.png" alt="Classic mode: Scarlett, a red Streptococcus pyogenes, swimming in a petri dish between antibiotic disks labeled E, CC and P, each with a clear zone around it" width="400"> <img src="docs/mixed-culture.png" alt="Mixed culture mode: Goldie vs. Mona, with Goldie's round cells and Mona's green rods spread across the plate, and a counter reading Goldie 4, Mona 13 out of 64 cells" width="400">

## How to play

1. **Pick a pal.** Each one is a real bacterium, drawn as a cartoon.
2. **Choose a mode:** classic, mixed culture or detective.
3. **Swim around the dish.** Use the arrow keys, or on a touch screen, touch and hold where you want to swim.
4. **Eat nutrients to divide.** Every cell that eats a nutrient divides in two, just like binary fission.

### Classic

Grow your colony to the target size to finish the level, but **don't touch the antibiotics.** Touching a disk, or the clear zone of inhibition around it, ends the game. Antibiotics kill bacteria! The zones start small and spread outward over the first few seconds, so grab the nutrients near the disks early.

There are seven levels. Each one adds another antibiotic disk and doubles the colony you need to grow, from 4 cells up to 256.

### Mixed culture

No antibiotics this time. You share the plate with a rival pal, picked at random and steered by the computer, and the **first colony to reach 64 cells wins.** You get a one-second head start, and the rival swims a little slower than you, but it's quick to spot the nearest nutrient, so grab them before it does!

### Detective

Your pal is the detective, and the case is a mystery pal. Name her by following a **dichotomous key**: a chain of two-way questions where each answer rules out some of the suspects, until only one is left. Each step is a real lab test (a Gram stain, a look under the microscope, a catalase test, blood agar and more). Run the test, look at the result, and pick the answer that matches. After each right answer you learn the science behind the test.

Solve the case with no wrong answers for three stars; each wrong answer costs one, but every solved case earns at least one. Every pal you identify goes in your **Pal Book**, which this browser remembers between visits.

## The pals

| Pal | Species | Shape |
|---|---|---|
| **Penny** | *Streptococcus pneumoniae* | Bluish-purple pair of round cells, with glasses |
| **Vi** | *Vibrio cholerae* | Orange comma-shaped rod |
| **Goldie** | *Staphylococcus aureus* | Golden grape-like clusters of round cells |
| **Ana** | *Bifidobacterium bifidum* | Pink Y-shaped rod, cheering with her arms up |
| **Scarlett** | *Streptococcus pyogenes* | Red chains of round cells |
| **Coco** | *Haemophilus influenzae* | Small coffee-with-cream coccobacillus |
| **Mona** | *Pseudomonas aeruginosa* | Green rod with one flagellum |
| **Elia** | *Borrelia burgdorferi* | Purple corkscrew (spirochete) |
| **Ceres** | *Bacillus cereus* | Sky-blue chain of three square-ended rods |
| **Sallie** | *Salmonella* Typhi | Grey rod with flagella all around |
| **Terra** | *Clostridium tetani* | Olive drumstick: a slim rod with a round spore at one end |

The picker shuffles all the pals each visit and shows them eight to a page, with **More pals** for the rest, so any pal can turn up on any page.

## The real science

The game is loosely based on real lab microbiology:

- **How each pal grows:** rods split and swim apart after dividing. Round cells (cocci) stay stuck together, in chains for *Streptococcus*, which divides in one plane, and in grape-like clusters for *Staphylococcus*, which divides in several. *Streptococcus pneumoniae* is a *Streptococcus* too, but it grows in pairs (diplococci), so Penny's chains stop at two cells. *Bacillus cereus* is a rod, but its cells often stay stuck end to end in short chains, so Ceres grows like a chain too, with rod-shaped cells, up to three at a time.
- **Sallie's flagella** cover her whole body (peritrichous flagella), unlike Mona's and Vi's single tail. Her species line reads *Salmonella* Typhi with Typhi upright: she's *Salmonella enterica* serovar Typhi, and serovar names are capitalized and never in italics.
- **Terra's drumstick shape** is how *Clostridium tetani* really looks under a microscope: she makes a round spore at one end of her rod, wider than the rod itself. In microscope mode her rod turns purple but her spore stays clear, since spores don't take up a Gram stain. Her name is Latin for earth, where her spores wait in the soil. She's an anaerobe, and there are no standard disk sizes for anaerobes, so her zones are estimates too.
- **Ceres's name** is a nod to *cereus*, which means "waxy" in Latin but sounds like Ceres, the Roman goddess of grain. Fitting, since *B. cereus* is famous for growing on rice.
- **Ana's Y shape** is in her name: *bifidus* means "split in two," and bifidobacteria are rods that branch into a Y. She's one of the "good" gut bacteria (a probiotic), and her name is a nod to "anaerobe," since oxygen is bad for her.
- **Penny's glasses** are a nod to history: pneumococcus is the bacterium that helped show DNA carries genes, in experiments by Frederick Griffith (1928) and by Oswald Avery, Colin MacLeod and Maclyn McCarty (1944).
- **The antibiotic disks** are modeled on the Kirby-Bauer disk test. Each disk is a drug commonly used against that pal's species, labeled with its standard disk code (CIP for ciprofloxacin, P for penicillin, and so on).
- **Detective mode's key** works the way a lab identifies bacteria, one test at a time. The Gram stain splits the pals into purple and pink. Then: round or rod; catalase (Staph fizzes in peroxide, Strep doesn't); blood agar (*S. pneumoniae* leaves a green ring, *S. pyogenes* a clear one); a spore stain (*Bacillus* and *Clostridium* make spores, bifidobacteria don't); an oxygen tube (*B. cereus* grows near the air, *C. tetani* only deep down); corkscrew or rod; oxidase (*Salmonella* stays pale, the others turn purple); comma-shaped or straight; and chocolate agar (*Haemophilus* needs its X and V factors, *Pseudomonas* grows on plain agar too). Real labs use more tests than this, and the key in [`public/game/key.js`](public/game/key.js) is simplified to one test per step. Elia barely takes the Gram stain, so she's on the pink side, with the other Gram-negative pals.
- **A mixed culture** is a plate growing more than one species at once, all competing for the same nutrients. That's the idea behind the mixed culture race.
- **The zones spread** because the drug diffuses outward from the disk into the agar. Diffusion is quick at first and then slows down, so each zone widens fast and then creeps out to its full size. On a real plate this happens over hours of incubation; the game speeds it up to a few seconds.
- **The zones of inhibition** are sized from ballpark zone diameters a lab would measure for a susceptible strain of that species, scaled down to fit the dish. A bigger zone means the drug works better. *Borrelia* can't be grown for disk tests, so Elia's zones are made up from how well each drug works on her, and the same goes for Ana's and Ceres's (there are no standard disk sizes for bifidobacteria or *Bacillus*). Bifidobacteria are naturally resistant to gentamicin, so Ana's gentamicin disk has **no zone at all**: you can swim right up to it, but don't touch the disk itself. Ceres never gets a penicillin disk, because *B. cereus* makes beta-lactamases, enzymes that break penicillin and its relatives down.

## Running it locally

The game is plain HTML, CSS and JavaScript in [`public/`](public/), with no build step. To run it with the included dev server:

```sh
npm install
npm run dev
```

Then open http://localhost:3000.

## Tests

```sh
npm test                # run the tests
npm run test:coverage   # run them and check how much of the game they cover
```

The tests use [Vitest](https://vitest.dev/). Most of the game logic runs in [jsdom](https://github.com/jsdom/jsdom), a simulated browser page. The coverage check fails if the tests leave game code untested (the thresholds are in [`vitest.config.js`](vitest.config.js)), and the deploy runs it, so untested code doesn't ship.

## Project layout

| Path | What's there |
|---|---|
| `public/index.html` | Home page |
| `public/pal-picker.html` | Pick a pal |
| `public/choose-mode.html` | Choose classic, mixed culture or detective |
| `public/detective.html` | Detective mode: the key, the lab bench and the Pal Book (`game/detective.js`, with the key in `game/key.js`, the test drawings in `game/lab.js` and the Pal Book in `game/book.js`) |
| `public/petri-dish.html` | The game, in either mode |
| `public/game/` | Game code: classic mode (`game.js`), mixed culture mode (`race.js`, with the rival in `rival.js`), what both share (a colony eating and dividing in `colony.js`, steering in `keyboard.js` and `touch.js`), how the pals grow (`rod.js`, `coccus.js`), antibiotics (`antibiotic.js`), nutrients, physics, settings and fun facts (`config.js`), the fun-fact pop-up (`facts.js`, with italics for scientific names from `italics.js`), the picker's microscope mode (`stain.js`), the win confetti (`spores.js`), and a little surprise on the home page (`split.js`) |
| `public/game/pals.js` | Every pal's name and drawing, in one place. All the pages draw the pals from here, in the order listed (except the picker, which shuffles them each visit), eight to a page (`PAGE_SIZE`). To add a pal, see the notes at the top. |
| `test/` | Tests |
| `src/index.ts` | Small Express server for local development |

## Deployment

Every push to `main` runs the tests and the coverage check and, if they pass, publishes `public/` to GitHub Pages (see [`.github/workflows/pages.yml`](.github/workflows/pages.yml)).

## Contributing

Bug reports, ideas and fixes are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started, and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

PetriPals is released under the [MIT License](LICENSE). The confetti uses [canvas-confetti](https://github.com/catdad/canvas-confetti), which is ISC licensed ([`public/game/vendor/confetti.LICENSE`](public/game/vendor/confetti.LICENSE)). The home page uses the [Fredoka](https://github.com/hafontia/Fredoka-One) and [Nunito](https://github.com/googlefonts/nunito) fonts, under the SIL Open Font License ([`public/fonts/`](public/fonts/)).

## Credits

Made by Jessica Sogge.
