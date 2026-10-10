// How each pal grows. Every pal is a single cell that divides each time it
// eats. Rods (Mona, Vi) separate after dividing. Cocci are round cells whose
// daughters stick together: in chains for Streptococcus (divides in one
// plane) or grape-like clusters for Staphylococcus (divides in several).
// Ceres is a rod whose daughters stick together too, so she grows like a
// coccus chain, with rod-shaped cells (`shape: 'rod'`).
//
// Each antibiotic's `zone` is the zone of inhibition around its disk, as the
// diameter in millimeters a lab would measure for a susceptible strain of
// that species (ballpark figures from standard disk tests; bigger means the
// drug works better). Borrelia can't be grown for disk tests, so Elia's are
// made up from how well each drug works on her. The game scales these down
// to fit the dish (see ZONE_* below).
//
// `antibiotics` are the disks placed in each pal's dish, in order (level 1
// uses the first, level 5 all five, and later levels start over from the
// top): drugs commonly used against that species, labeled with their
// standard disk codes.
//
// `scientific` is the species name shown above the dish, with the pal's name
// in her `color`. It's all in italics, unless it marks the italic part
// between asterisks: Sallie's is *Salmonella* Typhi, since Typhi is a
// serovar, which is never in italics.
//
// `gram` is how she looks after a Gram stain: 'positive' cells stay purple,
// 'negative' ones turn pink (the picker's microscope mode shows this).
// `faintStain` marks a pal who barely takes the stain at all.
// Rod-style pals are drawn `size` percent of the dish wide (12 unless set).
//
// For rod-style pals, `body` traces the drawing's outline as circles
// [x, y, radius], in fractions of the drawing's width from its center. It's
// what counts as touching an antibiotic disk.
// `facts` are short fun facts about each pal; one is shown at random in the
// pop-up at the end of every level or race, win or lose (see game/facts.js).
// Put other bacteria's scientific names between asterisks (*Bacillus
// anthracis*) and the pop-up shows them in italics.
export const SPECIES = {
  mona: {
    facts: [
      "Mona usually swims with one whip-like tail, called a polar flagellum.",
      "Mona's species name, aeruginosa, refers to verdigris: the blue-green patina of copper.",
      "Mona can make pyocyanin, a blue pigment that helps give her cultures a blue-green look.",
      "Mona's cultures smell a little like grapes.",
      "One of Mona's pigments glows under UV light.",
      "Mona loves damp places like sink drains and hot tubs.",
      "Mona builds slimy shields called biofilms to protect herself.",
      "Mona is naturally resistant to many antibiotics.",
      "Mona often infects the lungs of people with cystic fibrosis.",
      "Without oxygen, Mona can use nitrate for anaerobic respiration.",
      "Mona can often grow at 42°C, unlike many of her close relatives.",
      "Mona is oxidase-positive: a drop of test reagent turns her colonies dark purple.",
      "Mona's cells signal to each other with chemicals, called quorum sensing.",
      "Mona is a common cause of swimmer's ear, an infection of the outer ear canal.",
      "Mona can survive in distilled water, where there are almost no nutrients.",
      "Mona's colonies may have a metallic sheen and can make blue-green pigments.",
    ],
    scientific: 'Pseudomonas aeruginosa',
    color: '#15803d', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    size: 9.5,
    body: [
      // tail (flagellum)
      [-0.443, 0.0, 0.057],
      [-0.386, 0.0, 0.057],
      [-0.33, 0.0, 0.057],
      [-0.159, 0.0, 0.182],
      [-0.008, 0.0, 0.182],
      [0.144, 0.0, 0.182],
      [0.295, 0.0, 0.182],
    ],
    antibiotics: [
      { code: 'CIP', name: 'ciprofloxacin', zone: 33 },
      { code: 'GM', name: 'gentamicin', zone: 19 },
      { code: 'CAZ', name: 'ceftazidime', zone: 26 },
      { code: 'TZP', name: 'piperacillin-tazobactam', zone: 29 },
      { code: 'MEM', name: 'meropenem', zone: 32 },
    ],
  },
  vi: {
    facts: [
      "Vi is shaped like a comma.",
      "Vi is an exceptionally fast and agile swimmer, using one polar flagellum.",
      "Vi lives naturally in salty coastal water.",
      "Vi hitches rides on tiny shrimp-like animals called copepods.",
      "Vi's toxin genes were delivered by a virus that infected her.",
      "Vi usually takes thousands to millions of cells or more to make someone sick.",
      "Vi causes cholera, which John Snow traced to a London water pump in 1854.",
      "In 1854, Filippo Pacini described Vi, the comma-shaped bacterium linked to cholera.",
      "Oral rehydration (clean water, the right salt and sugar) saves most people Vi sickens.",
      "Filtering water through folded sari cloth kept Vi out and cut cholera in Bangladesh.",
      "Vi has two chromosomes instead of the usual one.",
      "On TCBS agar, Vi typically grows into yellow colonies, but other bacteria can do that too.",
      "Vi's toxin makes the gut pour out water and salt, which is why cholera dehydrates people.",
      "Vi's cholera has caused seven pandemics since 1817.",
      "In 1884, Robert Koch isolated Vi in pure culture and linked her to cholera.",
      "Vi has 200+ serogroups, but only O1 and O139 are linked to epidemic cholera.",
    ],
    scientific: 'Vibrio cholerae',
    color: '#c2410c', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    size: 9.5,
    body: [
      // tail (flagellum)
      [-0.444, -0.072, 0.056],
      [-0.389, -0.072, 0.056],
      [-0.333, -0.072, 0.056],
      [-0.189, -0.072, 0.161],
      [-0.098, -0.114, 0.161],
      [-0.009, -0.128, 0.161],
      [0.078, -0.114, 0.161],
      [0.162, -0.072, 0.161],
      [0.243, -0.003, 0.161],
      [0.322, 0.094, 0.161],
    ],
    antibiotics: [
      { code: 'TE', name: 'tetracycline', zone: 24 },
      { code: 'CIP', name: 'ciprofloxacin', zone: 36 },
      { code: 'AZM', name: 'azithromycin', zone: 21 },
      { code: 'DO', name: 'doxycycline', zone: 25 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 26 },
    ],
  },
  // A spirochete: a long corkscrew-shaped cell that divides in two like a rod.
  elia: {
    facts: [
      "Elia is a spirochete, shaped like a corkscrew.",
      "Elia's flagella are inside her body, so she swims by twisting.",
      "Elia is spread by Ixodes ticks: blacklegged or \"deer\" ticks in much of the eastern U.S.",
      "Elia causes Lyme disease, named after Lyme, Connecticut.",
      "Elia is named for Willy Burgdorfer, who helped identify the Lyme spirochete in 1982.",
      "Elia's Lyme disease often starts with a spreading rash; many aren't a bull's-eye.",
      "Mice, especially white-footed mice in the eastern U.S., are key reservoir hosts for Elia.",
      "Unlike most bacteria, Elia doesn't need iron and relies heavily on manganese instead.",
      "Elia's chromosome is a straight line instead of a circle.",
      "Elia is difficult to grow in special lab media and can take days to weeks to multiply.",
      "Elia's DNA was found in Ötzi, a 5,300-year-old Iceman frozen in the Alps.",
      "Ticks usually feed a day or more before they're likely to pass Elia on. Remove them fast!",
      "Elia can carry about 20 extra DNA pieces called plasmids, unusually many for a bacterium.",
      "Lyme disease, mainly from Elia, is the most commonly reported U.S. tick-borne disease.",
      "Elia can move through thick, gel-like body tissues that slow many other bacteria.",
      "Deer rarely infect ticks with Elia, but they feed adult ticks and keep tick numbers up.",
    ],
    scientific: 'Borrelia burgdorferi',
    color: '#7e22ce', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    faintStain: true, // too thin to show up well on a Gram stain
    size: 9.5,
    body: [
      [-0.333, 0.0, 0.104],
      [-0.266, 0.0, 0.104],
      [-0.199, 0.0, 0.104],
      [-0.132, 0.0, 0.104],
      [-0.065, 0.0, 0.104],
      [0.002, 0.0, 0.104],
      [0.069, 0.0, 0.104],
      [0.137, 0.0, 0.104],
      [0.204, 0.0, 0.104],
      [0.271, 0.0, 0.104],
      [0.354, 0.0, 0.083],
    ],
    antibiotics: [
      { code: 'DO', name: 'doxycycline', zone: 34 },
      { code: 'AMX', name: 'amoxicillin', zone: 29 },
      { code: 'CXM', name: 'cefuroxime', zone: 22 },
      { code: 'CRO', name: 'ceftriaxone', zone: 37 },
      { code: 'AZM', name: 'azithromycin', zone: 32 },
    ],
  },
  // A coccobacillus: a short, plump rod with no flagellum. Divides in two like a rod.
  // H. influenzae is one of the smallest bacteria, and her drawing fills
  // more of its box than the other rods', so she's drawn smaller.
  coco: {
    facts: [
      "Despite her name, Coco doesn't cause the flu.",
      "During the 1889 to 1890 flu pandemic, Coco was mistakenly thought to cause influenza.",
      "\"Haemophilus\" means blood-loving: Coco needs X and V growth factors that blood provides.",
      "Coco grows best on \"chocolate agar,\" made from heated blood.",
      "On blood agar, Coco can grow near Goldie, borrowing growth factors Goldie releases.",
      "Coco was the first free-living organism to have its whole genome read, in 1995.",
      "HindII, a DNA-cutting restriction enzyme from Coco, helped launch genetic engineering.",
      "Coco can live harmlessly in the nose and throat, especially in children.",
      "Before Hib vaccines, Coco's type b was a top cause of bacterial meningitis in young kids.",
      "The Hib vaccine made Coco's type b disease rare where vaccination coverage is high.",
      "Coco is a coccobacillus: in between a round coccus and a rod-shaped bacillus.",
      "Coco has six capsule types, a to f; the Hib vaccine targets type b.",
      "Many Coco strains have no capsule at all and commonly cause ear infections.",
      "Richard Pfeiffer described Coco in 1892; she was once called Pfeiffer's bacillus.",
      "Coco is a small Gram-negative coccobacillus, so she stains pink on a Gram stain.",
      "Nontypeable strains of Coco are a common cause of pink eye, especially in children.",
    ],
    scientific: 'Haemophilus influenzae',
    color: '#7c4a2d', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    size: 8.5,
    body: [
      [-0.142, 0.008, 0.275],
      [0.0, 0.008, 0.275],
      [0.142, 0.008, 0.275],
    ],
    antibiotics: [
      { code: 'CRO', name: 'ceftriaxone', zone: 40 },
      { code: 'AMC', name: 'amoxicillin-clavulanate', zone: 18 },
      { code: 'AZM', name: 'azithromycin', zone: 14 },
      { code: 'LVX', name: 'levofloxacin', zone: 39 },
      { code: 'CTX', name: 'cefotaxime', zone: 38 },
    ],
  },
  // Bifidobacterium bifidum, one of the "good" gut bacteria (a probiotic):
  // a rod that splits into a Y at one end (bifidus means split in two), drawn
  // upright like arms raised in a cheer. She divides like a rod. Her name is
  // a nod to "anaerobe": oxygen is bad for her. Like Borrelia, there are no
  // standard lab disk sizes for her, so her zones are estimates from how well
  // each drug works on bifidobacteria. They're naturally resistant to
  // gentamicin, so that disk has no zone at all.
  ana: {
    facts: [
      "Ana is a common, usually beneficial member of the human gut microbiome.",
      "Ana's name refers to the forked or split-looking shapes these bacteria can make.",
      "Ana was first described in 1899 from the stool of breastfed infants.",
      "Ana can be among the early bacteria that colonize babies' guts.",
      "Some Ana strains can help use breast-milk sugars that babies can't digest on their own.",
      "Ana grows best without oxygen and is very sensitive to it.",
      "Ana makes acids that can help make the gut less welcoming to some harmful microbes.",
      "Ana is included in some probiotics and, occasionally, in fermented dairy foods.",
      "Ana has no flagellum, so she can't swim.",
      "Bifidobacteria like Ana are often most abundant in infancy and less dominant with age.",
      "Ana is Gram-positive, so she stains purple under the microscope.",
      "Some Ana strains can feed on parts of mucin, the slimy layer lining the gut.",
      "Ana breaks down sugars with a pathway named for her group, the \"bifid shunt.\"",
      "Ana was first isolated by Henri Tissier, a pediatrician at the Pasteur Institute.",
      "Some Ana strains use tiny hair-like pili to stick to the gut lining.",
      "Babies born by C-section often acquire bifidobacteria like Ana later than others.",
    ],
    scientific: 'Bifidobacterium bifidum',
    color: '#be185d', // for her name above the dish: strawberry-yogurt pink's deeper rose
    kind: 'rod',
    gram: 'positive',
    size: 8.5,
    body: [
      // stem, bottom to top
      [0.0, 0.305, 0.128],
      [0.0, 0.177, 0.128],
      [0.0, 0.049, 0.128],
      // where the branches meet (her face)
      [0.0, -0.012, 0.134],
      // the two branches, out to their tips
      [-0.07, -0.149, 0.128],
      [-0.121, -0.226, 0.128],
      [-0.183, -0.305, 0.128],
      [0.07, -0.149, 0.128],
      [0.121, -0.226, 0.128],
      [0.183, -0.305, 0.128],
    ],
    antibiotics: [
      { code: 'AMX', name: 'amoxicillin', zone: 35 },
      { code: 'VA', name: 'vancomycin', zone: 23 },
      { code: 'GM', name: 'gentamicin', zone: null }, // resistant: no zone
      { code: 'CC', name: 'clindamycin', zone: 29 },
      { code: 'E', name: 'erythromycin', zone: 26 },
    ],
  },
  // Streptococcus pneumoniae, the pneumococcus: a Streptococcus like
  // Scarlett, but her chains stop at two, so she grows in pairs (a
  // diplococcus). Her glasses are because pneumococcus is the bacterium that
  // showed DNA carries genes (Griffith in 1928; Avery, MacLeod and McCarty in
  // 1944). Labs screen her for penicillin with an oxacillin disk.
  penny: {
    facts: [
      "Penny is often called \"pneumococcus.\"",
      "Penny's cells often come in pairs shaped like tiny pointed ovals, or lancets.",
      "Penny is a major cause of bacterial pneumonia.",
      "Penny also causes many ear infections in kids.",
      "Penny comes in more than 100 capsule, or \"coat,\" types.",
      "Penny makes a greenish halo on blood agar, called alpha-hemolysis.",
      "Penny dissolves in bile, a classic lab test for her.",
      "Penny can pick up loose DNA from her surroundings.",
      "In 1928, Griffith showed harmless Penny cells could be transformed into deadly ones.",
      "In 1944, Avery, MacLeod and McCarty used Penny to show DNA carried the transforming trait.",
      "An optochin disk usually stops Penny growing, a classic test that helps tell her apart.",
      "Penny's colonies often sink in the middle as they age, like tiny checkers pieces.",
      "Vaccines protect against the Penny types that most often cause serious illness.",
      "Penny was independently described by Louis Pasteur and George Sternberg in 1881.",
      "Penny's polysaccharide capsule helps her avoid being eaten by immune cells.",
      "Besides pneumonia, Penny can cause meningitis and sinus infections.",
    ],
    scientific: 'Streptococcus pneumoniae',
    color: '#4f46e5', // for her name above the dish: bluish purple, next to Elia's purple
    kind: 'coccus',
    gram: 'positive',
    layout: 'chain',
    maxCells: 2, // pairs
    glasses: true,
    // Her cells are lancet-shaped, like in her picture: a little longer than
    // they are wide, rounder where the pair meets and narrower at the outer
    // ends. (Pneumococci are often called lancet-shaped diplococci.)
    shape: 'lancet',
    colors: { fill: '#a5b4fc', stroke: '#4f46e5', highlight: '#e0e7ff', dark: '#312e81' },
    antibiotics: [
      { code: 'OX', name: 'oxacillin', zone: 27 },
      { code: 'E', name: 'erythromycin', zone: 31 },
      { code: 'LVX', name: 'levofloxacin', zone: 23 },
      { code: 'VA', name: 'vancomycin', zone: 20 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 25 },
    ],
  },
  scarlett: {
    facts: [
      "\"Strepto\" is Greek for twisted or chain-like, matching how Scarlett's cells often line up.",
      "\"Pyogenes\" in Scarlett's name means pus-making.",
      "Scarlett is the cause of strep throat.",
      "Scarlett also causes scarlet fever, a perfect match for her name.",
      "Doctors call Scarlett \"Group A Strep.\"",
      "Scarlett causes beta-hemolysis, making clear rings on blood agar.",
      "Scarlett can wear a capsule of hyaluronic acid, also found in human connective tissue.",
      "Penicillin still works on Scarlett: confirmed clinical resistance to it hasn't emerged.",
      "Untreated, Scarlett's strep throat can lead to rheumatic fever, which can harm the heart.",
      "Rarely, Scarlett causes necrotizing fasciitis, often called a \"flesh-eating\" infection.",
      "Scarlett is catalase-negative: no bubbles in hydrogen peroxide, unlike Goldie.",
      "A bacitracin disk often stops Scarlett growing, a classic older clue for Group A strep.",
      "A rapid strep test can find Scarlett on a throat swab in minutes.",
      "In the 1930s, Rebecca Lancefield sorted strep like Scarlett into lettered groups.",
      "Scarlett's M protein helps her dodge the immune system.",
      "There are 200+ M protein types of Scarlett, one reason people can get strep throat again.",
    ],
    scientific: 'Streptococcus pyogenes',
    color: '#b91c1c', // for her name above the dish
    kind: 'coccus',
    gram: 'positive',
    layout: 'chain',
    colors: { fill: '#fca5a5', stroke: '#b91c1c', highlight: '#fee2e2', dark: '#7f1d1d' },
    antibiotics: [
      { code: 'P', name: 'penicillin', zone: 32 },
      { code: 'E', name: 'erythromycin', zone: 28 },
      { code: 'CC', name: 'clindamycin', zone: 21 },
      { code: 'CRO', name: 'ceftriaxone', zone: 36 },
      { code: 'VA', name: 'vancomycin', zone: 22 },
    ],
  },
  goldie: {
    facts: [
      "\"Staphylo\" is Greek for a bunch of grapes, how Goldie's cells cluster.",
      "\"Aureus\" means golden, the color of Goldie's colonies.",
      "Goldie's golden pigment helps her fight off the immune system.",
      "Roughly 1 in 4 to 1 in 3 people carry Goldie harmlessly in the nose or on the skin.",
      "Goldie has no flagellum and does not actively swim.",
      "Goldie can persist on dry surfaces for days to weeks, sometimes longer.",
      "Goldie tolerates lots of salt, so labs grow her on salty agar.",
      "Goldie's toxins can cause food poisoning within hours.",
      "MRSA is a type of Goldie that resists methicillin and related drugs, and often others too.",
      "Penicillin was discovered after Fleming saw mold stop Goldie growing on a culture plate.",
      "Goldie is catalase-positive: she makes bubbles in a drop of hydrogen peroxide.",
      "Goldie makes coagulase, which clots plasma, a classic test that helps identify her.",
      "Goldie's food-poisoning toxins can survive cooking, even when Goldie herself doesn't.",
      "Goldie is a common cause of skin infections such as boils and impetigo.",
      "Rarely, toxins from some Goldie strains cause toxic shock syndrome, a serious illness.",
      "Goldie was named in 1884 by Friedrich Rosenbach after her golden colonies.",
    ],
    scientific: 'Staphylococcus aureus',
    color: '#b45309', // for her name above the dish
    kind: 'coccus',
    gram: 'positive',
    layout: 'cluster',
    colors: { fill: '#fde68a', stroke: '#b45309', highlight: '#fef3c7', dark: '#78350f' },
    antibiotics: [
      { code: 'OX', name: 'oxacillin', zone: 21 },
      { code: 'VA', name: 'vancomycin', zone: 17 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 31 },
      { code: 'CC', name: 'clindamycin', zone: 30 },
      { code: 'DO', name: 'doxycycline', zone: 28 },
    ],
  },
  // Bacillus cereus: a big rod that grows in short chains, like train cars
  // (drawn here as chains of up to three). She's a rod, but her daughters
  // stay stuck end to end the way Scarlett's do, so she grows with the chain
  // code in coccus.js, with rod-shaped cells. Her name is a nod to "cereus"
  // and to Ceres, the Roman goddess of grain (B. cereus is famous for growing
  // on rice). There are no standard lab disk sizes for Bacillus, so her zones
  // are estimates from how well each drug works on it. She makes
  // beta-lactamases that break down penicillin and its relatives, so her
  // disks are all drugs that work on her (no penicillin disk).
  ceres: {
    facts: [
      "Ceres is a large Gram-positive rod, so she stains purple on a Gram stain.",
      "Ceres often grows in chains of rods, lined up like a little train.",
      "Ceres makes endospores: tough, dormant cells that can survive cooking.",
      "\"Bacillus,\" the first part of Ceres's species name, means little rod in Latin.",
      "Ceres shares her name with the Roman goddess of grain, fitting for a rice lover.",
      "On agar, Ceres grows large, flat colonies that can look waxy or frosted.",
      "Ceres lives in soil and dust, so she often turns up on rice, vegetables, and spices.",
      "If cooked rice sits out too long, Ceres's spores can wake up, grow, and make toxins.",
      "Food poisoning from Ceres is sometimes nicknamed \"fried rice syndrome.\"",
      "Ceres makes a toxin called cereulide that can cause vomiting within 1 to 6 hours.",
      "Ceres's cereulide survives heat, so reheating rice won't destroy it once it's made.",
      "Ceres can also make different toxins that cause diarrhea 6 to 15 hours after eating.",
      "On blood agar, Ceres is usually beta-hemolytic, clearing the blood around her colonies.",
      "Ceres usually swims using flagella all over her body.",
      "Ceres is a close cousin of *Bacillus anthracis*, the bacterium that causes anthrax.",
      "Ceres's cousin *Bacillus thuringiensis* is used by farmers as a natural insecticide.",
      "Ceres often makes beta-lactamases, enzymes that break down penicillin and its relatives.",
    ],
    scientific: 'Bacillus cereus',
    color: '#0369a1', // for her name above the dish
    kind: 'coccus', // grows in chains (see above), though her cells are rods
    gram: 'positive',
    layout: 'chain',
    maxCells: 3, // short chains
    shape: 'rod',
    colors: { fill: '#bae6fd', stroke: '#0369a1', highlight: '#f0f9ff', dark: '#0c4a6e' },
    antibiotics: [
      { code: 'VA', name: 'vancomycin', zone: 17 },
      { code: 'CIP', name: 'ciprofloxacin', zone: 28 },
      { code: 'E', name: 'erythromycin', zone: 23 },
      { code: 'GM', name: 'gentamicin', zone: 22 },
      { code: 'CC', name: 'clindamycin', zone: 21 },
    ],
  },
  // Salmonella Typhi (Salmonella enterica serovar Typhi), the cause of
  // typhoid fever. A rod with flagella all over her body (peritrichous), so
  // she splits and swims apart like Mona. Typhi is a serovar, not a species,
  // so it's capitalized and not in italics: her `scientific` marks just the
  // genus for italics, between asterisks. Her zones are ballpark sizes for a
  // susceptible strain, and every disk is a drug that works on one (many
  // strains now resist ciprofloxacin, so she doesn't get it). Requested by
  // u/prioryofthebat, whose favorite color is grey, hence her grey.
  sallie: {
    facts: [
      "Sallie is a Gram-negative rod, so she stains pink on a Gram stain.",
      "Sallie usually swims with many flagella spread all over her body.",
      "Sallie's full name is *Salmonella enterica* serovar Typhi.",
      "Sallie causes typhoid fever and is human-restricted: humans are her only known reservoir.",
      "Sallie spreads in food or water tainted by infected stool, and sometimes urine.",
      "Sallie's genus, *Salmonella*, is named for Daniel Salmon, an American veterinary scientist.",
      "Mary Mallon, known as \"Typhoid Mary,\" carried Sallie for years without getting sick.",
      "Sallie can hide in the gallbladder, so some people carry her long after they recover.",
      "Sallie wears a sugary capsule, the Vi antigen, that helps her hide from immune defenses.",
      "Many typhoid vaccines teach the body to spot Sallie's Vi capsule. No relation to Vi!",
      "Sallie can survive inside macrophages, the immune cells that are supposed to eat her.",
      "On MacConkey agar, Sallie's colonies stay pale because she can't ferment lactose.",
      "On XLD agar, Sallie's colonies are usually red, often with a small black center.",
      "Sallie's typhoid fever can cause faint pink rose spots on the belly or upper chest.",
      "Sallie's \"typhoid\" means \"like typhus,\" from a Greek word for smoke, haze, or stupor.",
      "In 2016, an extensively drug-resistant strain of Sallie began spreading in Pakistan.",
    ],
    scientific: '*Salmonella* Typhi',
    color: '#52525b', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    size: 10.5,
    body: [
      // tail (the flagellum behind her)
      [-0.435, 0.0, 0.04],
      [-0.397, 0.0, 0.04],
      [-0.359, 0.0, 0.04],
      [-0.174, 0.0, 0.152],
      [-0.087, 0.0, 0.152],
      [0.0, 0.0, 0.152],
      [0.087, 0.0, 0.152],
      [0.174, 0.0, 0.152],
    ],
    antibiotics: [
      { code: 'CRO', name: 'ceftriaxone', zone: 32 },
      { code: 'AZM', name: 'azithromycin', zone: 20 },
      { code: 'MEM', name: 'meropenem', zone: 31 },
      { code: 'CFM', name: 'cefixime', zone: 27 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 25 },
    ],
  },
  terra: {
    facts: [
      "Terra is a Gram-positive rod, so young cells stain purple on a Gram stain.",
      "Terra makes a round spore at one end, so she looks like a drumstick or a tennis racket.",
      "Terra's spores can persist for years in soil, dust, and animal droppings.",
      "Terra is an obligate anaerobe: oxygen is toxic to her growing cells.",
      "Terra usually swims with flagella spread all over her body.",
      "Terra causes tetanus when her spores sprout in a deep or dirty wound with little oxygen.",
      "Terra makes tetanospasmin, one of the most potent neurotoxins known.",
      "Terra's toxin blocks nerve signals that let muscles relax, so they lock up and spasm.",
      "Tetanus is nicknamed \"lockjaw\" because Terra's toxin often stiffens the jaw muscles first.",
      "The tetanus vaccine is a toxoid: an inactivated, harmless version of Terra's toxin.",
      "Adults are advised to get a booster against Terra's toxin about every 10 years.",
      "Tetanus isn't contagious: people pick up Terra from the environment, not from each other.",
      "Rust doesn't cause tetanus, but a dirty nail can carry Terra's spores deep into a wound.",
      "In 1889, Kitasato Shibasaburo isolated Terra and grew her in pure culture.",
      "Terra's cousin, *Clostridium botulinum*, makes the toxin that causes botulism.",
      "\"Clostridium,\" the first part of Terra's name, comes from a Greek word for spindle.",
    ],
    scientific: 'Clostridium tetani',
    color: '#5f6f12', // for her name above the dish
    kind: 'rod',
    gram: 'positive',
    size: 10.5,
    body: [
      // tail (the flagellum behind her)
      [-0.424, 0.0, 0.04],
      [-0.37, 0.0, 0.04],
      // her rod
      [-0.217, 0.0, 0.12],
      [-0.109, 0.0, 0.12],
      [0.0, 0.0, 0.12],
      [0.109, 0.0, 0.12],
      // her spore end, rounder and wider
      [0.326, 0.0, 0.158],
    ],
    antibiotics: [
      { code: 'MTZ', name: 'metronidazole', zone: 30 },
      { code: 'P', name: 'penicillin', zone: 27 },
      { code: 'VA', name: 'vancomycin', zone: 19 },
      { code: 'CC', name: 'clindamycin', zone: 23 },
      { code: 'DO', name: 'doxycycline', zone: 24 },
    ],
  },
  lissie: {
    facts: [
      "Lissie is a Gram-positive rod, so she typically stains purple on a Gram stain.",
      "Lissie can keep growing at fridge temperatures, where most food germs stall.",
      "Lissie tumbles end over end at 25°C, but usually stops making flagella at 37°C.",
      "Inside our cells, Lissie grabs the cell's actin and builds a comet tail to zoom around.",
      "Lissie's comet tail pushes her into the next cell, hidden from the immune system.",
      "Lissie causes listeriosis, which can come from deli meats, soft cheeses, and smoked fish.",
      "In 2011, cantaloupes carrying Lissie caused one of the deadliest U.S. food outbreaks.",
      "Lissie can cross the placenta, so pregnant people are told to skip some risky foods.",
      "Lissie's genus honors surgeon Joseph Lister, and so does Listerine mouthwash.",
      "Lissie was first described in 1926, after she sickened lab rabbits in Cambridge, England.",
      "Lissie's \"monocytogenes\" comes from the monocytes that piled up in those rabbits' blood.",
      "On blood agar, Lissie makes a narrow, faint ring of beta-hemolysis.",
      "Lissie is catalase-positive, which helps tell her apart from *Streptococcus*.",
      "Lit at an angle, Lissie's colonies can look blue-green.",
      "Lissie can grow in salty foods that stop many other bacteria.",
      "Cephalosporins aren't reliable on Lissie, so doctors often use ampicillin or amoxicillin.",
    ],
    scientific: 'Listeria monocytogenes',
    color: '#2c4f7c', // for her name above the dish
    kind: 'rod',
    gram: 'positive',
    size: 10.5,
    body: [
      // tail (the flagellum behind her)
      [-0.39, 0.0, 0.04],
      [-0.33, 0.0, 0.04],
      // her short rod
      [-0.13, 0.0, 0.141],
      [-0.065, 0.0, 0.141],
      [0.0, 0.0, 0.141],
      [0.065, 0.0, 0.141],
      [0.13, 0.0, 0.141],
    ],
    antibiotics: [
      { code: 'AMP', name: 'ampicillin', zone: 28 },
      { code: 'P', name: 'penicillin', zone: 26 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 30 },
      { code: 'GM', name: 'gentamicin', zone: 20 },
      { code: 'MEM', name: 'meropenem', zone: 32 },
    ],
  },
  sara: {
    facts: [
      "Sara is a Gram-negative rod, so she stains pink on a Gram stain, despite her red color.",
      "Many strains of Sara make prodigiosin, a bright red pigment.",
      "Sara often makes more red pigment at room temperature than at body temperature.",
      "\"Marcescens\" is Latin for fading or decaying, since Sara's red pigment fades over time.",
      "In 1819, Bartolomeo Bizio named Sara after red spots grew on polenta near Padua, Italy.",
      "Sara's genus is named for Serafino Serrati, an Italian physicist and steamboat pioneer.",
      "Red spots on bread were sometimes seen as miracles; some may have been Sara growing.",
      "Sara can make a pink, orange, or red film in damp spots like showers and toilet bowls.",
      "Some Sara strains swarm on soft agar, spreading quickly across the surface as a group.",
      "Sara usually swims with flagella spread all over her body.",
      "Sara makes DNase, an enzyme that breaks down DNA, which labs use to help identify her.",
      "Sara makes chitinase, an enzyme that breaks down chitin in insect shells.",
      "Sara's cousin *Serratia entomophila* is used in New Zealand to fight grass grubs.",
      "Sara can cause infections in hospital patients, often in the lungs or urinary tract.",
      "Sara can cause eye infections, especially in people who wear contact lenses.",
      "Sara is usually resistant to ampicillin and colistin.",
    ],
    scientific: 'Serratia marcescens',
    color: '#c2003a', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    size: 10.5,
    body: [
      // tail (the flagellum behind her)
      [-0.39, 0.0, 0.04],
      [-0.33, 0.0, 0.04],
      // her short, plump rod
      [-0.108, 0.0, 0.152],
      [-0.054, 0.0, 0.152],
      [0.0, 0.0, 0.152],
      [0.054, 0.0, 0.152],
      [0.108, 0.0, 0.152],
    ],
    // She's naturally resistant to ampicillin, colistin and older
    // cephalosporins, so her disks are drugs that work on her.
    antibiotics: [
      { code: 'CIP', name: 'ciprofloxacin', zone: 31 },
      { code: 'GM', name: 'gentamicin', zone: 18 },
      { code: 'CRO', name: 'ceftriaxone', zone: 29 },
      { code: 'MEM', name: 'meropenem', zone: 28 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 24 },
    ],
  },
  ivy: {
    facts: [
      "Ivy is a Gram-positive rod, so she stains purple on a Gram stain.",
      "Ivy lives in soil all over the world.",
      "\"Mycoides\" means fungus-like, because Ivy's colonies spread out like mold.",
      "On agar, Ivy grows rhizoid colonies: hairy, root-like strands that branch outward.",
      "Ivy's colonies spiral as they spread, some strains clockwise and others counterclockwise.",
      "Ivy grows in long chains of rods, lined up end to end.",
      "Unlike many of her cousins, Ivy usually has no flagella, so she can't swim.",
      "Ivy makes endospores that help her survive heat, cold, and drought in the soil.",
      "Ivy is a close cousin of our pal Ceres.",
      "Ivy can live inside plants without harming them, as an endophyte.",
      "Ivy was first described by the German scientist Carl Flügge in 1886.",
      "Ivy rarely, if ever, causes disease in people.",
      "Some Ivy strains can keep growing in the cold, even at fridge temperatures.",
      "Ivy's colonies can spread across a whole agar plate in just a few days.",
      "Scientists study Ivy's spiral colonies to learn how left- and right-handed shapes form.",
    ],
    scientific: 'Bacillus mycoides',
    color: '#4d6b3c', // for her name above the dish
    kind: 'coccus', // grows in chains with the chain code, like Ceres, though her cells are rods
    gram: 'positive',
    layout: 'chain',
    maxCells: 4, // longer chains than Ceres's
    shape: 'rod',
    colors: { fill: '#b8d8a0', stroke: '#4d6b3c', highlight: '#f0f7e8', dark: '#2f4224' },
    // Like Ceres, she's in the B. cereus group, which tends to make
    // beta-lactamases, so no penicillin. No standard disk sizes exist for
    // her, so these zones are estimates.
    antibiotics: [
      { code: 'VA', name: 'vancomycin', zone: 18 },
      { code: 'CIP', name: 'ciprofloxacin', zone: 30 },
      { code: 'TE', name: 'tetracycline', zone: 23 },
      { code: 'GM', name: 'gentamicin', zone: 20 },
      { code: 'E', name: 'erythromycin', zone: 26 },
    ],
  },
  astrid: {
    facts: [
      "Astrid is a Gram-negative rod, so she stains pink on a Gram stain.",
      "\"Biprosthecum\" means two prosthecae: Astrid grows two stalks.",
      "Astrid's two stalks grow from opposite sides of her cell, around the middle.",
      "Astrid's stalks are part of her cell, wrapped in the same membranes as the rest of her.",
      "Astrid sticks to surfaces with a holdfast, a dab of sugary glue at one end of her cell.",
      "Astrid's glue is on her cell body, not on a stalk tip like her cousin *Caulobacter*'s.",
      "When Astrid divides, she makes two kinds of cell: one with stalks and one that swims.",
      "Usually, Astrid's swimming daughter changes into a stalked cell before she divides.",
      "Astrid lives in fresh water.",
      "Astrid's stalks may help her soak up scarce nutrients from the water.",
      "Bacteria with stalks like Astrid's are called prosthecate bacteria.",
      "Astrid's cousin *Caulobacter crescentus* is a famous model for how cells divide unevenly.",
      "Scientists study Astrid to learn how stalks evolved to grow in new places on the cell.",
      "Astrid was first described as a new species in 1973.",
      "Astrid is an alphaproteobacterium, part of a group related to mitochondria ancestors.",
      "Astrid isn't known to cause disease in people.",
    ],
    scientific: 'Asticcacaulis biprosthecum',
    color: '#1a4f9c', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    size: 10,
    // Two forms: each division leaves her with stalks and makes a new cell
    // that swims (see rod.js).
    swarmers: true,
    body: [
      // tail (her swimmers' flagellum) and holdfast, behind her
      [-0.44, 0.0, 0.04],
      [-0.36, 0.0, 0.07],
      // her rod (her thin stalks don't count, like a flagellum off to the side)
      [-0.175, 0.0, 0.175],
      [-0.031, 0.0, 0.175],
      [0.113, 0.0, 0.175],
      [0.25, 0.0, 0.175],
    ],
    // No standard disk sizes for her so these zones are estimates.
    antibiotics: [
      { code: 'TE', name: 'tetracycline', zone: 28 },
      { code: 'K', name: 'kanamycin', zone: 18 },
      { code: 'C', name: 'chloramphenicol', zone: 22 },
      { code: 'GM', name: 'gentamicin', zone: 19 },
      { code: 'RA', name: 'rifampin', zone: 21 },
    ],
  },
  kiki: {
    facts: [
      "Kiki is a Gram-negative rod, so she stains pink on a Gram stain, despite her yellow color.",
      "Many strains of Kiki turn yellow, more at room temperature than at body temperature.",
      "Kiki swims with flagella spread all over her body.",
      "Kiki used to be called *Enterobacter sakazakii*, until she got her own genus in 2008.",
      "Kiki's species name honors Riichi Sakazaki, a Japanese microbiologist.",
      "Kiki's genus is named for Cronus, the Greek Titan who swallowed his children.",
      "Kiki can survive for a long time in very dry places, which is unusual for her family.",
      "Kiki can cause rare but serious infections in newborns, often from powdered formula.",
      "Making powdered formula with water at least 70°C helps kill Kiki.",
      "Kiki builds biofilms, sticky layers that help her cling to things like factory equipment.",
      "Kiki has been found in soil, on plants, in dried foods, and in food factories.",
      "Kiki is catalase-positive and oxidase-negative, two tests labs use to help identify her.",
      "Kiki is a cousin of our pals Sallie and Sara, in the same big order of gut-type bacteria.",
    ],
    scientific: 'Cronobacter sakazakii',
    color: '#7d7200', // for her name above the dish
    kind: 'rod',
    gram: 'negative',
    size: 10.5,
    body: [
      // tail (the flagellum behind her)
      [-0.39, 0.0, 0.04],
      [-0.33, 0.0, 0.04],
      // her short, plump rod
      [-0.13, 0.0, 0.141],
      [-0.065, 0.0, 0.141],
      [0.0, 0.0, 0.141],
      [0.065, 0.0, 0.141],
      [0.13, 0.0, 0.141],
    ],
    // Drugs used against her in newborns. There are no disk sizes just for
    // Cronobacter (labs use the ones for her whole order, Enterobacterales),
    // so these zones are ballpark figures for a susceptible strain.
    antibiotics: [
      { code: 'CRO', name: 'ceftriaxone', zone: 30 },
      { code: 'GM', name: 'gentamicin', zone: 20 },
      { code: 'MEM', name: 'meropenem', zone: 30 },
      { code: 'CIP', name: 'ciprofloxacin', zone: 32 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 26 },
    ],
  },  electra: {
    facts: [
      "Electra is a Gram-negative rod, so she stains pink on a Gram stain.",
      "Electra lives in oxygen-poor mud, sediment, and soil.",
      "Electra can \"breathe\" rust, passing electrons to iron oxide instead of oxygen.",
      "Electra grows tiny hair-like wires, called nanowires, that carry electricity.",
      "Electra's nanowires can extend many times longer than her own cell.",
      "Electra can help power a microbial fuel cell by turning energy into electricity.",
      "Electra is packed with cytochromes, iron-holding proteins that pass electrons along.",
      "Electra can help remove uranium from groundwater by turning it into a less-soluble form.",
      "Electra eats acetate, a simple molecule other microbes leave behind.",
      "Electra was first found in a ditch in Norman, Oklahoma, in the early 1990s.",
      "Lots of Electras can join up into a living, electricity-carrying film on an electrode.",
      "Electra can receive electrons directly from another microbe.",
    ],
    scientific: 'Geobacter sulfurreducens',
    color: '#4c1d95', // for her name above the dish: grape, darker than Elia's purple
    kind: 'rod',
    gram: 'negative',
    size: 11, // a touch smaller than most, since her nanowires take up room around her
    body: [
      // her rod, from end to end (her thin nanowires don't count)
      [-0.21, 0.0, 0.143],
      [-0.105, 0.0, 0.143],
      [0.0, 0.0, 0.143],
      [0.105, 0.0, 0.143],
      [0.21, 0.0, 0.143],
    ],
    // She's an anaerobe from mud, and there are no standard disk sizes for
    // her, so these drugs and zones are estimates.
    antibiotics: [
      { code: 'GM', name: 'gentamicin', zone: 18 },
      { code: 'CIP', name: 'ciprofloxacin', zone: 30 },
      { code: 'TE', name: 'tetracycline', zone: 22 },
      { code: 'DO', name: 'doxycycline', zone: 24 },
      { code: 'MEM', name: 'meropenem', zone: 26 },
    ],
  },
  diffany: {
    facts: [
      "Diffany is a Gram-positive rod, so she stains purple, but her spore stays clear.",
      "Diffany's name comes from *difficile*, Latin for \"difficult\": she was so hard to grow.",
      "Diffany usually makes an oval spore near one end of her rod.",
      "Oxygen harms Diffany's growing cells, but her spores can last months on surfaces.",
      "Alcohol hand gel doesn't kill Diffany's spores, but soap and water help wash them off.",
      "Bleach-based disinfectants can kill Diffany's spores when used correctly.",
      "Diffany often takes over after antibiotics disrupt the bacteria that kept her in check.",
      "Diffany makes two toxins, called toxin A and toxin B, that inflame the colon.",
      "Diffany's colonies glow yellow-green under UV light and smell a bit like a horse stable.",
      "A transplant of healthy gut bacteria (a \"poop transplant\") can help clear Diffany out.",
      "Diffany was renamed in 2016, from *Clostridium* to *Clostridioides*.",
      "Many healthy babies carry Diffany without ever getting sick.",
      "Diffany swims with flagella spread all over her body.",
    ],
    scientific: 'Clostridioides difficile',
    color: '#7a2e1a', // for her name above the dish
    kind: 'rod',
    gram: 'positive',
    // Big and plump, the biggest of the rods.
    size: 11,
    body: [
      // tail (the flagellum behind her)
      [-0.44, 0.0, 0.04],
      [-0.38, 0.0, 0.04],
      // her big, plump rod
      [-0.156, 0.0, 0.146],
      [-0.078, 0.0, 0.146],
      [0.0, 0.0, 0.146],
      [0.078, 0.0, 0.146],
      [0.156, 0.0, 0.146],
      // the bulge over her spore, near her front end but inside its tip
      [0.146, 0.0, 0.156],
    ],
    // Vancomycin and metronidazole are drugs used against her, and rifampin's
    // family (the rifamycins) works on her too. Many of the usual drugs, like
    // ciprofloxacin and clindamycin, barely touch her (they're what let her
    // take over the gut), so she has just these three, and levels with more
    // disks start the list over. There are no standard disk sizes for
    // anaerobes, so her zones are estimates, like Terra's.
    antibiotics: [
      { code: 'VA', name: 'vancomycin', zone: 17 },
      { code: 'MTZ', name: 'metronidazole', zone: 28 },
      { code: 'RA', name: 'rifampin', zone: 32 },
    ],
  },
  nova: {
    facts: [
      "Nova is Gram-positive, but patchy staining makes her filaments look beaded.",
      "Nova grows long, thin, branching filaments that look a bit like fungal threads.",
      "As Nova's colony ages, her filaments can break into short rods and round cells.",
      "Nova is partly acid-fast: some filaments keep red dye after a weak-acid wash.",
      "Nova shares a bacterial order with *Mycobacterium tuberculosis*, which causes TB.",
      "Nova's genus lives in soil, dust, and decaying plants around the world.",
      "Nova's colonies can look dry and chalky and smell musty, like a damp basement.",
      "Nova can grow fuzzy aerial filaments that rise above her colony.",
      "Nova needs oxygen to grow.",
      "Nova's colonies often appear in days, but some cultures need weeks.",
      "Nova is more likely to cause serious illness in people with weakened immunity.",
      "Nova can enter through inhaled dust or a wound, and infection can reach the brain.",
      "Nova doesn't normally spread from person to person.",
      "Nova's treatment often includes trimethoprim-sulfamethoxazole and lasts months.",
      "Nova is usually susceptible to erythromycin, unlike many other Nocardia species.",
      "Nova's genus honors Edmond Nocard, a French vet who isolated it from sick cattle.",
      "Nova's species name is Latin for \"new.\"",
      "Nova has no flagella.",
    ],
    scientific: 'Nocardia nova',
    color: '#0f766e', // for her name above the dish
    kind: 'rod',
    gram: 'positive',
    size: 8, // her branches reach every way, so she's narrower than the rods to take up as much room
    body: [
      // her hub (her face)
      [0.0, 0.021, 0.129],
      // along her filaments, traced from her drawing
      [-0.443, 0.144, 0.046],
      [-0.354, 0.159, 0.046],
      [-0.264, 0.145, 0.046],
      [-0.18, 0.11, 0.046],
      [-0.103, 0.062, 0.046],
      [0.103, -0.01, 0.046],
      [0.183, -0.048, 0.046],
      [0.268, -0.07, 0.046],
      [0.356, -0.074, 0.046],
      [0.443, -0.062, 0.046],
      [-0.301, 0.27, 0.046],
      [-0.361, 0.361, 0.046],
      [-0.22, 0.031, 0.046],
      [-0.266, -0.053, 0.046],
      [-0.33, -0.124, 0.046],
      [-0.344, -0.038, 0.046],
      [-0.412, -0.031, 0.046],
      [0.0, -0.093, 0.046],
      [0.003, -0.195, 0.046],
      [0.025, -0.296, 0.046],
      [0.062, -0.392, 0.046],
      [-0.066, -0.285, 0.046],
      [-0.124, -0.34, 0.046],
      [0.314, -0.157, 0.046],
      [0.349, -0.224, 0.046],
      [0.402, -0.278, 0.046],
      [0.285, 0.023, 0.046],
      [0.336, 0.1, 0.046],
      [0.402, 0.165, 0.046],
      [0.279, 0.18, 0.046],
      [0.268, 0.289, 0.046],
      [0.031, 0.134, 0.046],
      [0.041, 0.222, 0.046],
      [0.031, 0.309, 0.046],
      [0.0, 0.392, 0.046],
    ],
    // Drugs used against Nocardia. Labs test her by broth dilution, not
    // disks, so there are no standard disk sizes and these zones are
    // estimates. Erythromycin is here because the N. nova group, unlike
    // most Nocardia, is usually susceptible to it.
    antibiotics: [
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 30 },
      { code: 'AN', name: 'amikacin', zone: 28 },
      { code: 'IPM', name: 'imipenem', zone: 30 },
      { code: 'LZD', name: 'linezolid', zone: 36 },
      { code: 'E', name: 'erythromycin', zone: 22 },
    ],
  },
};

// Mixed culture: no disks; race 1–3 AI rivals (chosen or one random) to TARGET cells.
// Multiple rivals use CROWDED_TARGET.
export const MIXED = {
  TARGET: 64,
  CROWDED_TARGET: 32,
  MAX_RIVALS: 3,
  CHOICES: 12, // pals offered on the rival screen; with more, a random 12
  NUTRIENTS_PER_PAL: 7, // flecks on the agar at a time, for each pal in the dish
  RIVAL_SPEED: 0.55, // fraction of the dish radius per second (you swim at GAME.SPEED)
  RIVAL_REACT_MS: 500, // how often the rival looks around for a new nutrient
  RIVAL_WANDER: 0.5, // how much the rival weaves off course, in radians
  RIVAL_START_MS: 1000, // the rival waits this long before it starts, so you get a head start
};

// Petri Picnic (game/tumble.js): your pal swims straight on her own,
// and all you can do is make her tumble to face a random new way
export const TUMBLE = {
  TARGET: 256,
  NUTRIENTS: 30, // flecks on the agar at a time
  SPEED: 0.60, // how fast she swims, as a fraction of the dish radius per second
  TUMBLE_MS: 300, // how long a tumble takes, spinning on the spot
};

// How many cells win a race against `rivals` rival pals.
export function raceTarget(rivals) {
  return rivals > 1 ? MIXED.CROWDED_TARGET : MIXED.TARGET;
}

// Each level adds an antibiotic disk and doubles the colony you need to grow.
export const LEVELS = [
  { disks: 1, target: 4 },
  { disks: 2, target: 8 },
  { disks: 3, target: 16 },
  { disks: 4, target: 32 },
  { disks: 5, target: 64 },
  { disks: 6, target: 128 },
  { disks: 7, target: 256 },
];

export const GAME = {
  GROUP_CAP: 8, // chains and clusters stop growing at this many cells (unless a pal's maxCells is smaller)
  // A new coccus joins a chain or cluster if the player is within this
  // distance of where it would attach (a fraction of the dish radius).
  SNAP_REACH: 0.3,
  NUTRIENTS_PER_DIVISION: 1, // nutrients the player eats before dividing
  SPEED: 0.8, // player speed, as a fraction of the dish radius per second
  // Steering with a mouse, how close to the pointer counts as there (so she
  // settles instead of jittering on the spot), as a fraction of the dish radius.
  ARRIVE: 0.01,
  // Dragging her with a finger, she moves as far as the finger does, up to
  // DRAG_SPEED (a fraction of the dish radius per second) so she keeps up
  // with ordinary dragging. Even that fast she moves less per frame than an
  // antibiotic disk is wide, so a swipe can't skip over a zone.
  DRAG_SPEED: 2,
  // How hard a new group pushes away when it splits off. It slides about
  // BURST_SPEED / SETTLE_RATE of the dish radius (half that for cocci) before
  // it stops: far enough to see, short enough not to slide into a zone easily.
  BURST_SPEED: 0.1,
  SETTLE_RATE: 4, // how quickly a new group slows to a stop (higher = sooner)
  SETTLE_MS: 1500, // after this long, offspring stay put for good
  // How close two new cells can settle before they nudge each other apart:
  // their centers stay at least SPACING times their combined reach apart.
  // Lower lets them pile up more, the way cells on a plate grow on top of
  // each other, which leaves room for big colonies on crowded levels.
  SPACING: 0.5,
  DIVIDE_MS: 600,
  // The antibiotic disks: their radius, how far from the center they can go,
  // and how far apart they must be, center to center (all as fractions of the
  // dish radius). They never sit on the starting spot.
  DISK_RADIUS: 0.085,
  DISK_MIN_DISTANCE: 0.4,
  DISK_MAX_DISTANCE: 0.65,
  DISK_MIN_GAP: 0.4,
  // The zone of inhibition: the clear ring around each disk where the drug
  // has soaked into the agar. Offspring grow right up to its edge but never
  // into it, and the player touching it is game over. Its width comes from
  // the drug's zone in mm: ZONE_MM_SMALL mm or less is ZONE_MIN_WIDTH wide,
  // ZONE_MM_BIG mm or more is ZONE_MAX_WIDTH, and in between scales evenly
  // (widths are fractions of the dish radius).
  ZONE_MM_SMALL: 13,
  ZONE_MM_BIG: 40,
  ZONE_MIN_WIDTH: 0.02,
  ZONE_MAX_WIDTH: 0.075,
  // Zones spread: on a real plate the drug soaks outward from the disk, so
  // the zone starts small and widens. Each zone starts at ZONE_START of its
  // full width and reaches full width after ZONE_SPREAD_SECONDS. (A real
  // zone takes hours to form while the plate incubates; sped up for the game.)
  ZONE_START: 0.1,
  ZONE_SPREAD_SECONDS: 20,
  // Room to swim between two neighboring zones, at least.
  SWIM_ROOM: 0.13,
};
