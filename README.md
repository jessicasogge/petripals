# PetriPals 🧫

A cute microbiology game for the browser. Pick a bacterial pal and eat nutrients to grow your colony. In **classic** mode, steer clear of the antibiotic disks and their zones of inhibition. In **mixed culture** mode, race up to three rival pals to take over the plate.

**[▶ Play PetriPals](https://jessicasogge.github.io/petripals/)**: works on computers, phones and tablets.

<img src="docs/screenshot.png" alt="Classic mode: Scarlett, a red Streptococcus pyogenes, swimming in a petri dish between antibiotic disks labeled E, CC and P, each with a clear zone around it" width="400"> <img src="docs/mixed-culture.png" alt="Mixed culture mode: Goldie vs. Mona, with Goldie's round cells and Mona's green rods spread across the plate, and a counter reading Goldie 4, Mona 13 out of 64 cells" width="400">

## How to play

1. **Pick a pal.** Each one is a real bacterium, drawn as a cartoon.
2. **Choose a mode:** classic or mixed culture. For mixed culture, pick up to three rivals, or tap **Surprise me** for one at random.
3. **Swim around the dish.** Use the arrow keys, or on a touch screen, touch and hold where you want to swim.
4. **Eat nutrients to divide.** Every cell that eats a nutrient divides in two, just like binary fission.

### Classic

Grow your colony to the target size to finish the level, but **don't touch the antibiotics.** Touching a disk, or the clear zone of inhibition around it, ends the game. Antibiotics kill bacteria! The zones start small and spread outward over the first few seconds, so grab the nutrients near the disks early.

There are seven levels. Each one adds another antibiotic disk and doubles the colony you need to grow, from 4 cells up to 256.

### Mixed culture

No antibiotics this time. You share the plate with one to three rival pals steered by the computer. Pick them yourself (any pals but yours, each once; once there are more than 12 to choose from, the rival screen offers a random 12), or tap **Surprise me** for one at random. Against one rival, the **first colony to reach 64 cells wins**; against two or three, the dish fills up fast, so it's the **first to 32**. Each pal in the dish adds more nutrients, and **Race again** takes you back to pick your rivals. You get a one-second head start, and the rivals swim a little slower than you, but they're quick to spot the nearest nutrient, so grab them first!

### Who’s That Pal?

Tap **Who’s That Pal?** on the home page for a quiz on the pals' fun facts. You get one fact with "this pal" in place of her name: tap the pal it's about. A wrong guess greys that pal out so you can try again, and the right one puts her name back in and shows her species. There's no score, so it's just for learning. A counter (like 2 / 88) shows how many facts you've seen so far, and you'll see every quiz fact once before any comes up again. The quiz skips facts too broad to point to one pal (like "is Gram-positive"); the ones it uses are listed in `public/game/quiz-facts.js`.

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
| **Lissie** | *Listeria monocytogenes* | Short denim-blue rod with a few flagella |
| **Sara** | *Serratia marcescens* | Short, plump red rod with flagella all around |
| **Ivy** | *Bacillus mycoides* | Sage-green chain of rods curling up like a vine |
| **Electra** | *Geobacter sulfurreducens* | Grape-purple rod covered in sparking nanowires |

The picker shuffles all the pals each visit and shows them eight to a page, with **More pals** for the rest, so any pal can turn up on any page.

## The real science

The game is loosely based on real lab microbiology:

- **How each pal grows:** rods split and swim apart after dividing. Round cells (cocci) stay stuck together, in chains for *Streptococcus*, which divides in one plane, and in grape-like clusters for *Staphylococcus*, which divides in several. *Streptococcus pneumoniae* is a *Streptococcus* too, but it grows in pairs (diplococci), so Penny's chains stop at two cells. *Bacillus cereus* is a rod, but its cells often stay stuck end to end in short chains, so Ceres grows like a chain too, with rod-shaped cells, up to three at a time.
- **Sallie's flagella** cover her whole body (peritrichous flagella), unlike Mona's and Vi's single tail. Her species line reads *Salmonella* Typhi with Typhi upright: she's *Salmonella enterica* serovar Typhi, and serovar names are capitalized and never in italics.
- **Ivy's curl** comes from her colonies: *Bacillus mycoides* grows rhizoid (root-like) colonies that swirl as they spread, clockwise in some strains and counterclockwise in others. She's a soil bacterium, hence the green, and a cousin of Ceres in the *B. cereus* group, so she grows in chains of rods too, up to four in the dish. Unlike Ceres, she has no flagella. There are no standard disk sizes for her, so her zones are estimates.
- **Electra's nanowires** are the electrically conductive filaments *Geobacter sulfurreducens* is famous for. She lives in mud with no oxygen, so instead of breathing it she passes her spare electrons out along them to rust (iron oxide), which is why her bursts run out to the tips. The usual lab strain doesn't make flagella, so she has none. Her name is for the electricity she carries, and her purple is for fun: real cells are reddish from all their cytochromes. There are no standard disk sizes for her, so her drugs and zones are estimates.
- **Sara's red** is prodigiosin, a pigment many *Serratia marcescens* strains make, mostly at room temperature. It's why her colonies can look like drops of blood, and why she's behind the pink film in some showers. She's Gram-negative, so in microscope mode she turns pink like Mona and Vi, red pigment or not.
- **Terra's drumstick shape** is how *Clostridium tetani* really looks under a microscope: she makes a round spore at one end of her rod, wider than the rod itself. In microscope mode her rod turns purple but her spore stays clear, since spores don't take up a Gram stain. Her name is Latin for earth, where her spores wait in the soil. She's an anaerobe, and there are no standard disk sizes for anaerobes, so her zones are estimates too.
- **Lissie's flagella** are few and short-lived: *Listeria monocytogenes* tumbles end over end at room temperature but mostly stops making flagella at body temperature. Inside human cells she gets around a different way, by building a comet tail out of the cell's own actin. She never gets a cephalosporin disk, since cephalosporins aren't reliable against *Listeria*.
- **Ceres's name** is a nod to *cereus*, which means "waxy" in Latin but sounds like Ceres, the Roman goddess of grain. Fitting, since *B. cereus* is famous for growing on rice.
- **Ana's Y shape** is in her name: *bifidus* means "split in two," and bifidobacteria are rods that branch into a Y. She's one of the "good" gut bacteria (a probiotic), and her name is a nod to "anaerobe," since oxygen is bad for her.
- **Penny's glasses** are a nod to history: pneumococcus is the bacterium that helped show DNA carries genes, in experiments by Frederick Griffith (1928) and by Oswald Avery, Colin MacLeod and Maclyn McCarty (1944).
- **The antibiotic disks** are modeled on the Kirby-Bauer disk test. Each disk is a drug commonly used against that pal's species, labeled with its standard disk code (CIP for ciprofloxacin, P for penicillin, and so on).
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
| `public/choose-mode.html` | Choose classic or mixed culture |
| `public/choose-rivals.html` | Pick up to three rivals for mixed culture, or Surprise me |
| `public/petri-dish.html` | The game, in either mode |
| `public/whos-that-pal.html` | Who’s That Pal?, a quiz: which pal is this fact about? |
| `public/game/` | Game code: classic mode (`game.js`), mixed culture mode (`race.js`, with each rival's steering in `rival.js` and who's racing in `rivals.js`, picked on `choose-rivals.js`), what both share (a colony eating and dividing in `colony.js`, steering in `keyboard.js` and `touch.js`), how the pals grow (`rod.js`, `coccus.js`), antibiotics (`antibiotic.js`), nutrients, physics, settings and fun facts (`config.js`), the fun-fact pop-up (`facts.js`, with italics for scientific names from `italics.js`), the picker's microscope mode (`stain.js`), the win confetti (`spores.js`), Who’s That Pal? (`whos-that-pal.js`, with the facts' "this pal" swap in `guess.js` and the facts it asks about in `quiz-facts.js`), and a little surprise on the home page (`split.js`) |
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
