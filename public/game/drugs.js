// Disk Detective: all antibiotic disks, mechanisms, and facts.
// Keys/names match config.js; `target` uses TARGETS, `family` groups drugs,
// and `works` explains their action. Wrap scientific names in *asterisks*.
//
// Facts name the drug (capitalized at sentence start) for quiz substitution.
// Distinguish it from other targets, not its family: "is a cephalosporin"
// works; "works on Pseudomonas" doesn't.
import { SPECIES } from './config.js';
import { inRandomOrder, PALS } from './pals.js';

// What each kind of drug attacks
export const TARGETS = {
  wall: { title: 'Block cell-wall building', does: 'blocks cell-wall building' },
  protein: { title: 'Jam the protein factory', does: 'jams the protein factory' },
  dna: { title: 'Disrupt DNA copying', does: 'disrupts DNA copying' },
  folate: { title: 'Block the folate supply', does: 'blocks the production of usable folate' },
  rna: { title: 'Stop genes becoming RNA messages', does: 'stops bacteria making RNA messages from their genes' },
};

// How the beta-lactams (penicillins, cephalosporins, carbapenems) work.
const BETA_LACTAM = 'Blocks enzymes that strengthen the cell wall, so the cell can burst.';
const AMINOGLYCOSIDE = 'Makes the ribosome misread its instructions, so it builds faulty proteins.';
const TETRACYCLINE = 'Stops the ribosome accepting new amino acids, so it can’t extend proteins.';
const MACROLIDE = 'Binds inside the ribosome’s exit tunnel, stalling the growth of new proteins.';
const FLUOROQUINOLONE = 'Traps enzymes that manage DNA twists, disrupting DNA copying and causing breaks.';

export const DRUGS = {
  P: {
    name: 'penicillin',
    family: 'penicillin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Alexander Fleming discovered penicillin in 1928 after a mold contaminated a plate of *Staphylococcus* and stopped bacteria growing nearby.',
      'Some *Penicillium* molds make penicillin; their relatives include the blue-green fuzz on old bread and oranges.',
      'Mold from a cantaloupe found in Peoria, Illinois, helped scientists mass-produce penicillin during World War II.',
      'Penicillin has a four-atom beta-lactam ring that disables enzymes needed to build strong bacterial cell walls.',
    ],
  },
  AMX: {
    name: 'amoxicillin',
    family: 'penicillin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Amoxicillin is commonly prescribed to children, often as a sweet, flavored liquid.',
      'Amoxicillin is soaked up from the gut better than ampicillin, its close cousin.',
      'Amoxicillin is a go-to drug for middle-ear infections and strep throat.',
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
    works: 'A penicillin plus a helper that blocks some enzymes bacteria use to break penicillins.',
    facts: [
      'Amoxicillin-clavulanate gives a penicillin a bodyguard: a helper that blocks many penicillin-breaking enzymes.',
      'The helper in amoxicillin-clavulanate was discovered in a soil bacterium, *Streptomyces clavuligerus*.',
      'Amoxicillin-clavulanate is also called co-amoxiclav, or sold under the brand name Augmentin.',
    ],
  },
  OX: {
    name: 'oxacillin',
    family: 'penicillin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Oxacillin shrugs off penicillinase, an enzyme some *Staphylococcus aureus* strains use to break penicillin.',
      'A *Staphylococcus aureus* that tests resistant to oxacillin is reported as MRSA: methicillin-resistant *S. aureus*.',
      'Oxacillin is a close cousin of methicillin, which is hardly used anymore but gave MRSA its name.',
    ],
  },
  TZP: {
    name: 'piperacillin-tazobactam',
    family: 'penicillin',
    target: 'wall',
    works: 'A penicillin plus a helper that blocks some enzymes bacteria use to break penicillins.',
    facts: [
      'Piperacillin-tazobactam is one of the few penicillin combinations that can work on *Pseudomonas aeruginosa*.',
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
      'Cefuroxime belongs to the second generation of cephalosporin antibiotics.',
      'Cefuroxime can be swallowed as a pill or given through an IV.',
    ],
  },
  CTX: {
    name: 'cefotaxime',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Cefotaxime, introduced around 1980, was one of the first third-generation cephalosporins.',
      'Cefotaxime has been preferred for newborns because ceftriaxone poses special risks for them.',
    ],
  },
  CFM: {
    name: 'cefixime',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Cefixime lasts long enough in the body to be taken just once or twice a day.',
      'Cefixime was the first third-generation cephalosporin available by mouth, in the 1980s.',
    ],
  },
  CAZ: {
    name: 'ceftazidime',
    family: 'cephalosporin',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Ceftazidime is one of the few cephalosporins that can work on *Pseudomonas aeruginosa*.',
      'Ceftazidime can be paired with avibactam, a newer helper that blocks some drug-breaking enzymes.',
    ],
  },
  MEM: {
    name: 'meropenem',
    family: 'carbapenem',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Meropenem is a carbapenem, a family often reserved for serious or resistant infections.',
      'Bacteria that resist carbapenems like meropenem are some of the most worrying superbugs.',
      'Meropenem covers a wide range of bacteria: many Gram-positives, Gram-negatives and anaerobes.',
    ],
  },
  IPM: {
    name: 'imipenem',
    family: 'carbapenem',
    target: 'wall',
    works: BETA_LACTAM,
    facts: [
      'Imipenem became the first carbapenem approved for clinical use in 1985.',
      'Imipenem is given with cilastatin, which stops a kidney enzyme from breaking it down.',
      'Imipenem was developed from thienamycin, found in the soil bacterium *Streptomyces cattleya*.',
    ],
  },
  VA: {
    name: 'vancomycin',
    family: 'glycopeptide',
    target: 'wall',
    works: 'Grabs cell-wall building blocks so they can’t be joined properly, and the cell can burst.',
    facts: [
      'Vancomycin was found in a soil sample from the jungles of Borneo in the 1950s.',
      'Vancomycin got its name from the word “vanquish.”',
      'Vancomycin is too big to cross most Gram-negative outer membranes, so it mainly works on Gram-positives.',
    ],
  },
  GM: {
    name: 'gentamicin',
    family: 'aminoglycoside',
    target: 'protein',
    works: AMINOGLYCOSIDE,
    facts: [
      'Gentamicin is spelled with an i, not a y, because it comes from *Micromonospora*, not *Streptomyces*.',
      'Gentamicin needs energy from bacterial respiration to get inside, so it doesn’t work on obligate anaerobes.',
    ],
  },
  AN: {
    name: 'amikacin',
    family: 'aminoglycoside',
    target: 'protein',
    works: AMINOGLYCOSIDE,
    facts: [
      'Amikacin was developed by tweaking kanamycin so many bacterial resistance enzymes can’t inactivate it.',
      'Amikacin can be inhaled in tiny bubbles of fat to help treat certain hard-to-treat mycobacterial lung infections.',
    ],
  },
  S: {
    name: 'streptomycin',
    family: 'aminoglycoside',
    target: 'protein',
    works: AMINOGLYCOSIDE,
    facts: [
      'Albert Schatz discovered streptomycin in 1943 in Selman Waksman’s lab, with contributions from Elizabeth Bugie.',
      'Streptomycin was first isolated from the soil bacterium *Streptomyces griseus*.',
      'Streptomycin was the first effective antibiotic against tuberculosis.',
      'Streptomycin is still one of the drugs used to treat plague.',
    ],
  },
  K: {
    name: 'kanamycin',
    family: 'aminoglycoside',
    target: 'protein',
    works: AMINOGLYCOSIDE,
    facts: [
      'Kanamycin was discovered in Japan in 1957 by Hamao Umezawa and his team.',
      'Kanamycin is made by a soil bacterium, *Streptomyces kanamyceticus*.',
    ],
  },
  TE: {
    name: 'tetracycline',
    family: 'tetracycline',
    target: 'protein',
    works: TETRACYCLINE,
    facts: [
      'Tetracycline can glow yellow under UV light.',
      'Tetracycline can stain developing teeth, so it is usually avoided in children under eight.',
      'Tetracycline is named for its four (tetra-) rings of atoms.',
      'Tetracycline was found in ancient Nubian bones, probably from fermented grain used in beer.',
    ],
  },
  DO: {
    name: 'doxycycline',
    family: 'tetracycline',
    target: 'protein',
    works: TETRACYCLINE,
    facts: [
      'Doxycycline is a first-choice treatment for early Lyme disease.',
      'Doxycycline is also used to help prevent malaria in travelers.',
    ],
  },
  E: {
    name: 'erythromycin',
    family: 'macrolide',
    target: 'protein',
    works: MACROLIDE,
    facts: [
      'Erythromycin came from Philippine soil sampled in 1949, made by a bacterium now called *Saccharopolyspora erythraea*.',
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
      'Azithromycin can treat chlamydia with a single dose.',
    ],
  },
  CC: {
    name: 'clindamycin',
    family: 'lincosamide',
    target: 'protein',
    works: 'Jams the spot in the ribosome that links building blocks into a protein.',
    facts: [
      'Clindamycin is made from lincomycin, from a soil bacterium found near Lincoln, Nebraska.',
      'Clindamycin reduces toxin-making in some strep and staph bacteria, so it can be added for toxic shock.',
    ],
  },
  LZD: {
    name: 'linezolid',
    family: 'oxazolidinone',
    target: 'protein',
    works: 'Stops the ribosome getting started, so it can’t make proteins.',
    facts: [
      'Linezolid, approved in 2000, was the first antibiotic in the synthetic oxazolidinone family.',
      'Linezolid can treat MRSA and enterococci that resist vancomycin.',
      'Linezolid is absorbed almost completely, so equivalent pill and IV doses work similarly.',
    ],
  },
  C: {
    name: 'chloramphenicol',
    family: 'amphenicol',
    target: 'protein',
    works: 'Blocks the ribosome from linking building blocks into a protein.',
    facts: [
      'Chloramphenicol was found in 1947 in *Streptomyces venezuelae*, a bacterium from Venezuelan soil.',
      'Chloramphenicol’s use is limited because it can very rarely cause life-threatening bone-marrow failure.',
      'Introduced in 1949, chloramphenicol was the first antibiotic manufactured synthetically on a large scale.',
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
      'Ciprofloxacin was approved in the U.S. in 1987.',
    ],
  },
  LVX: {
    name: 'levofloxacin',
    family: 'fluoroquinolone',
    target: 'dna',
    works: FLUOROQUINOLONE,
    facts: [
      'Levofloxacin is the “left-handed” half of an older drug, ofloxacin, and the much more active half.',
      'Levofloxacin is called a “respiratory fluoroquinolone” because it works well on *Streptococcus pneumoniae*.',
    ],
  },
  MTZ: {
    name: 'metronidazole',
    family: 'nitroimidazole',
    target: 'dna',
    works: 'Gets switched on inside certain microbes adapted to little or no oxygen, then damages their DNA.',
    facts: [
      'Metronidazole targets anaerobic bacteria—bacteria that can live without oxygen.',
      'Metronidazole also kills some parasites, like *Giardia*.',
    ],
  },
  SXT: {
    name: 'trimethoprim-sulfamethoxazole',
    family: 'sulfonamide combination',
    target: 'folate',
    works: 'Two drugs that block two steps in making usable folate, a vitamin bacteria need to build DNA.',
    facts: [
      'Trimethoprim-sulfamethoxazole blocks two steps along the folate pathway, like closing two gates on one road.',
      'Trimethoprim-sulfamethoxazole is a main treatment for infections caused by *Nocardia*.',
      'Trimethoprim-sulfamethoxazole contains a sulfa drug, from one of the first widely used families of antibacterial medicines in the 1930s.',
    ],
  },
  RA: {
    name: 'rifampin',
    family: 'rifamycin',
    target: 'rna',
    works: 'Stops bacterial RNA polymerase, so the cell can’t read its genes.',
    facts: [
      'Rifampin can turn tears, sweat and pee orange-red.',
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
