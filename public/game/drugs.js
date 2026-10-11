// Disk Detective (disk-detective.html): every antibiotic disk in the game,
// with how it works and facts to learn it by.
//
// Each drug is keyed by its disk code, the same code on its disk in Classic
// mode (see `antibiotics` in config.js), and `name` matches the name there.
// `target` is what the drug attacks (one of TARGETS below) and `family` is
// the group of drugs it belongs to. `works` says how it stops bacteria, in a
// sentence. `facts` each name the drug, so the quiz can swap in "this drug"
// (see withBlanks in guess.js); a drug's name at the start of a sentence is
// capitalized. Put bacteria's scientific names between asterisks for italics.
//
// The quiz only offers drugs that attack something different from the right
// answer, so each fact needs to point to one drug among those, not among its
// own family: "is a cephalosporin" is fine, "works on Pseudomonas" isn't.
import { SPECIES } from './config.js';
import { inRandomOrder, PALS } from './pals.js';

// What each kind of drug attacks, in the order the guide lists them:
// `title` for the guide and `does` for a sentence ("It jams the protein factory.").
export const TARGETS = {
  wall: { title: 'Break the cell wall', does: 'breaks the cell wall' },
  protein: { title: 'Jam the protein factory', does: 'jams the protein factory' },
  dna: { title: 'Wreck the DNA', does: 'wrecks the DNA' },
  folate: { title: 'Starve it of folate', does: 'starves bacteria of folate' },
  rna: { title: 'Stop it reading its genes', does: 'stops bacteria reading their genes' },
};

// How the beta-lactams (penicillins, cephalosporins, carbapenems) work.
const BETA_LACTAM = 'Stops the enzymes that build the cell wall, so the cell bursts.';
const AMINOGLYCOSIDE = 'Makes the ribosome misread its instructions, so the cell builds broken proteins.';
const TETRACYCLINE = 'Blocks new building blocks from reaching the ribosome, so it can’t make proteins.';
const MACROLIDE = 'Plugs the tunnel new proteins come out of in the ribosome.';
const FLUOROQUINOLONE = 'Jams the enzymes that untwist DNA, so the cell can’t copy it.';

export const DRUGS = {
  P: {
    name: 'penicillin',
    family: 'penicillin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Alexander Fleming discovered penicillin in 1928, when a mold landed on his plates of *Staphylococcus* and cleared the colonies around it.',
      'Penicillin is made by a mold, *Penicillium*, like the blue-green fuzz on old bread and oranges.',
      'The penicillin that saved soldiers in World War II came from a moldy cantaloupe bought at a market in Peoria, Illinois.',
      'Penicillin has a square ring of atoms, the beta-lactam ring, that jams the enzymes building the cell wall.',
    ],
  },
  AMX: {
    name: 'amoxicillin',
    family: 'penicillin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Amoxicillin is one of the antibiotics kids get most, often as a sweet liquid.',
      'Amoxicillin is soaked up from the gut better than ampicillin, its close cousin.',
      'Amoxicillin is a go-to drug for ear infections and strep throat.',
    ],
  },
  AMP: {
    name: 'ampicillin',
    family: 'penicillin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Ampicillin, from 1961, was the first penicillin to work on many Gram-negative bacteria too.',
      'Labs add ampicillin to agar so only bacteria carrying a resistance gene can grow, a basic trick of genetic engineering.',
      'Ampicillin is the drug of choice for *Listeria*, often given with gentamicin.',
    ],
  },
  AMC: {
    name: 'amoxicillin-clavulanate',
    family: 'penicillin',
    target: 'wall',
    works: 'A penicillin plus a helper that blocks the enzymes bacteria use to break penicillins.',
    facts: [
      'Amoxicillin-clavulanate gives a penicillin a bodyguard: a helper that blocks the enzymes bacteria use to break penicillins.',
      'The helper in amoxicillin-clavulanate was found in a soil bacterium, *Streptomyces clavuligerus*.',
      'Amoxicillin-clavulanate is also called co-amoxiclav, or Augmentin.',
    ],
  },
  OX: {
    name: 'oxacillin',
    family: 'penicillin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Oxacillin shrugs off penicillinase, the enzyme *Staphylococcus aureus* uses to break penicillin.',
      'A *Staphylococcus aureus* that oxacillin can’t stop is called MRSA: methicillin-resistant *S. aureus*.',
      'Oxacillin is a close cousin of methicillin, which is hardly used anymore but gave MRSA its name.',
    ],
  },
  TZP: {
    name: 'piperacillin-tazobactam',
    family: 'penicillin',
    target: 'wall',
    works: 'A penicillin plus a helper that shields it from the enzymes bacteria use to break penicillins.',
    facts: [
      'Piperacillin-tazobactam is one of the few penicillins that work on *Pseudomonas aeruginosa*.',
      'Piperacillin-tazobactam is given through an IV drip in hospitals, for serious infections.',
    ],
  },
  CRO: {
    name: 'ceftriaxone',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Ceftriaxone lasts so long in the body that one dose a day is often enough.',
      'Ceftriaxone is a cephalosporin, a family first found in a mold growing near a sewer outlet in Sardinia, Italy, in 1945.',
      'Ceftriaxone is a main treatment for gonorrhea and for bacterial meningitis.',
    ],
  },
  CXM: {
    name: 'cefuroxime',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Cefuroxime is a second-generation cephalosporin, a step between the oldest of its family and the newest.',
      'Cefuroxime can be swallowed as a pill or given through an IV.',
    ],
  },
  CTX: {
    name: 'cefotaxime',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Cefotaxime, from 1980, was one of the first third-generation cephalosporins.',
      'Cefotaxime is often picked for newborns, who shouldn’t get its cousin ceftriaxone.',
    ],
  },
  CFM: {
    name: 'cefixime',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Cefixime lasts long enough in the body to be taken just once or twice a day.',
      'Cefixime was the first third-generation cephalosporin made as a pill, in the 1980s.',
    ],
  },
  CAZ: {
    name: 'ceftazidime',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Ceftazidime is one of the few cephalosporins that work well on *Pseudomonas aeruginosa*.',
      'Ceftazidime is often paired with avibactam, a newer helper that blocks drug-breaking enzymes.',
    ],
  },
  MEM: {
    name: 'meropenem',
    family: 'carbapenem',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Meropenem is a carbapenem, a family often saved for the toughest infections.',
      'Bacteria that resist meropenem and the other carbapenems are some of the most worrying superbugs.',
      'Meropenem reaches more kinds of bacteria than almost any other antibiotic: Gram-positives, Gram-negatives and anaerobes.',
    ],
  },
  IPM: {
    name: 'imipenem',
    family: 'carbapenem',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Imipenem, approved in 1985, was the first carbapenem.',
      'Imipenem is given with cilastatin, which stops the kidneys breaking it down.',
      'Imipenem was made from thienamycin, found in the soil bacterium *Streptomyces cattleya*.',
    ],
  },
  VA: {
    name: 'vancomycin',
    family: 'glycopeptide',
    target: 'wall',
    works: 'Grabs the cell wall’s building blocks so they can’t be joined up, so the cell bursts.',
    facts: [
      'Vancomycin was found in a soil sample from the jungles of Borneo in the 1950s.',
      'Vancomycin got its name from the word “vanquish.”',
      'Vancomycin is too big to get through the outer coat of Gram-negative bacteria, so it only works on Gram-positives.',
    ],
  },
  GM: {
    name: 'gentamicin',
    family: 'aminoglycoside',
    target: 'protein',
    works: AMINOGLYCOSIDE,
    facts: [
      'Gentamicin is spelled with an i, not a y, because it comes from *Micromonospora*, not *Streptomyces*.',
      'Gentamicin needs oxygen to get into a cell, so it can’t touch bacteria that live without it.',
    ],
  },
  AN: {
    name: 'amikacin',
    family: 'aminoglycoside',
    target: 'protein',
    works: AMINOGLYCOSIDE,
    facts: [
      'Amikacin was made in a lab in 1972 by tweaking kanamycin so bacteria’s enzymes can’t break it.',
      'Amikacin can be breathed in as a mist, packed into tiny bubbles of fat, to treat lung infections.',
    ],
  },
  K: {
    name: 'kanamycin',
    family: 'aminoglycoside',
    target: 'protein',
    works: AMINOGLYCOSIDE,
    facts: [
      'Kanamycin was discovered in Japan in 1957 by Hamao Umezawa.',
      'Kanamycin is made by a soil bacterium, *Streptomyces kanamyceticus*.',
    ],
  },
  TE: {
    name: 'tetracycline',
    family: 'tetracycline',
    target: 'protein',
    works: TETRACYCLINE,
    facts: [
      'Tetracycline glows yellow under UV light.',
      'Tetracycline can stain children’s growing teeth, so young kids usually don’t get it.',
      'Tetracycline is named for its four (tetra-) rings of atoms.',
      'Traces of tetracycline turned up in the bones of ancient Nubians, likely from their beer.',
    ],
  },
  DO: {
    name: 'doxycycline',
    family: 'tetracycline',
    target: 'protein',
    works: TETRACYCLINE,
    facts: [
      'Doxycycline is a first-choice treatment for Lyme disease.',
      'Doxycycline is also used to keep travelers from catching malaria.',
    ],
  },
  E: {
    name: 'erythromycin',
    family: 'macrolide',
    target: 'protein',
    works: MACROLIDE,
    facts: [
      'Erythromycin was found in 1949 in soil from the Philippines, made by a bacterium now called *Saccharopolyspora erythraea*.',
      'Erythromycin is a macrolide, named for its big ring of atoms.',
    ],
  },
  AZM: {
    name: 'azithromycin',
    family: 'macrolide',
    target: 'protein',
    works: MACROLIDE,
    facts: [
      'Azithromycin was discovered in 1980 by a team at Pliva, a drug company in Croatia.',
      'Azithromycin stays in the body so long that a course is often just 3 to 5 days.',
      'Azithromycin is a main treatment for chlamydia, often as a single dose.',
    ],
  },
  CC: {
    name: 'clindamycin',
    family: 'lincosamide',
    target: 'protein',
    works: 'Jams the spot in the ribosome that links building blocks into a protein.',
    facts: [
      'Clindamycin is made from lincomycin, from a soil bacterium found near Lincoln, Nebraska.',
      'Clindamycin can switch off toxin-making in *Streptococcus* and *Staphylococcus*, so it’s added for toxic shock.',
    ],
  },
  LZD: {
    name: 'linezolid',
    family: 'oxazolidinone',
    target: 'protein',
    works: 'Stops the ribosome getting started, so it can’t make proteins.',
    facts: [
      'Linezolid, approved in 2000, was the first of a whole new family made in a lab, the oxazolidinones.',
      'Linezolid works on MRSA, and on enterococci that vancomycin can’t stop.',
      'Linezolid works just as well swallowed as a pill as it does through an IV.',
    ],
  },
  C: {
    name: 'chloramphenicol',
    family: 'amphenicol',
    target: 'protein',
    works: 'Blocks the ribosome from linking building blocks into a protein.',
    facts: [
      'Chloramphenicol was found in 1947 in *Streptomyces venezuelae*, a bacterium from Venezuelan soil.',
      'Chloramphenicol is rarely used today because, very rarely, it stops the bone marrow making blood.',
      'Chloramphenicol was the first antibiotic made from scratch in a factory instead of grown, in 1949.',
    ],
  },
  CIP: {
    name: 'ciprofloxacin',
    family: 'fluoroquinolone',
    target: 'dna',
    works: FLUOROQUINOLONE,
    facts: [
      'Ciprofloxacin was stockpiled in the U.S. during the 2001 anthrax letter attacks.',
      'Ciprofloxacin is a fluoroquinolone, a family that can, rarely, make tendons tear.',
      'Ciprofloxacin came out in 1987 and became one of the most used antibiotics in the world.',
    ],
  },
  LVX: {
    name: 'levofloxacin',
    family: 'fluoroquinolone',
    target: 'dna',
    works: FLUOROQUINOLONE,
    facts: [
      'Levofloxacin is the “left-handed” half of an older drug, ofloxacin, and the half that does the work.',
      'Levofloxacin is called a “respiratory fluoroquinolone” because it works well on *Streptococcus pneumoniae*.',
    ],
  },
  MTZ: {
    name: 'metronidazole',
    family: 'nitroimidazole',
    target: 'dna',
    works: 'Switches on only inside cells that live without oxygen, then breaks their DNA.',
    facts: [
      'Metronidazole only switches on inside cells that live without oxygen, so it hits anaerobes like *C. difficile*.',
      'Metronidazole also kills some parasites, like *Giardia*.',
    ],
  },
  SXT: {
    name: 'trimethoprim-sulfamethoxazole',
    family: 'sulfonamide combination',
    target: 'folate',
    works: 'Two drugs that block two steps in making folate, a vitamin bacteria need to build DNA.',
    facts: [
      'Trimethoprim-sulfamethoxazole blocks two steps in a row on the way to making folate, like closing two gates on one road.',
      'Trimethoprim-sulfamethoxazole is the main treatment for *Nocardia*.',
      'Trimethoprim-sulfamethoxazole has a sulfa drug in it, from the first family of antibacterial medicines, in the 1930s.',
    ],
  },
  RA: {
    name: 'rifampin',
    family: 'rifamycin',
    target: 'rna',
    works: 'Stops RNA polymerase, so the cell can’t read its genes.',
    facts: [
      'Rifampin turns tears, sweat and pee orange-red.',
      'Rifampin is one of the main drugs for tuberculosis.',
      'Rifampin’s family is named after Rififi, a 1955 French heist movie.',
    ],
  },
};

// The pals whose dishes have this drug's disk in Classic mode, in the usual order.
export function palsFor(code) {
  return PALS.filter((pal) => SPECIES[pal.id].antibiotics.some((drug) => drug.code === code));
}

// Every fact about every drug as { code, fact }, shuffled.
export function drugDeck(random = Math.random) {
  const all = Object.entries(DRUGS).flatMap(([code, drug]) => drug.facts.map((fact) => ({ code, fact })));
  return inRandomOrder(all, random);
}

// How many disks to choose from for each fact.
export const CHOICES = 4;

// The disks to choose from for a fact about `code`: it and three drugs that
// attack something else (so only one fits the fact), in a random order.
export function choicesFor(code, random = Math.random) {
  const target = DRUGS[code].target;
  const others = Object.keys(DRUGS).filter((other) => DRUGS[other].target !== target);
  return inRandomOrder([code, ...inRandomOrder(others, random).slice(0, CHOICES - 1)], random);
}

// "A macrolide" or "An aminoglycoside".
export const withArticle = (word) => `${/^[aeiou]/i.test(word) ? 'An' : 'A'} ${word}`;

// "Ciprofloxacin", for the start of a sentence or a heading.
export const capitalized = (name) => name[0].toUpperCase() + name.slice(1);
