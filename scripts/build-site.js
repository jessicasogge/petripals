// Builds the site the deploy publishes (npm run build:site): a copy of
// public/, plus a ready-made page for each pal at pals/<id>.html, so search
// engines find each pal on her own page with her facts written into it,
// rather than one page that JavaScript fills in. The sitemap gets every pal
// page too. The pages aren't committed: the deploy builds them fresh each
// time from config.js and pals.js, like the profile page in the browser.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
export const SITE_URL = 'https://jessicasogge.github.io/petripals/';

// A pal's page title and description, written for search: her species
// first, since that's what people search for.
export function pageTitle(pal, plainScientific) {
  return `${plainScientific}: Meet ${pal.name} | PetriPals`;
}
export function pageDescription(pal, plainScientific, factCount) {
  return `Meet ${pal.name}, a cartoon ${plainScientific}: how she looks under the microscope, ` +
    `her real size, and ${factCount} fun facts about the real bacterium.`;
}

// A pal page's structured data: a learning resource about her real
// bacterium, part of the PetriPals game.
export function structuredData(pal, plainScientific, url, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${pal.name}, a cartoon ${plainScientific}`,
    url,
    description,
    inLanguage: 'en',
    isAccessibleForFree: true,
    learningResourceType: 'Fact sheet',
    audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
    about: { '@type': 'Thing', name: plainScientific },
    isPartOf: { '@type': 'VideoGame', name: 'PetriPals', url: SITE_URL },
  };
}

// The profile page for one pal, as HTML.
async function palPage(template, id, { SPECIES, palById, renderProfile, plainText }) {
  const dom = new JSDOM(template, { url: `${SITE_URL}pal-profile.html` });
  const doc = dom.window.document;
  // The game's drawing code makes its elements in the global document.
  globalThis.window = dom.window;
  globalThis.document = doc;
  renderProfile(doc, id);

  const pal = palById(id);
  const scientific = plainText(SPECIES[id].scientific);
  const url = `${SITE_URL}pals/${id}.html`;
  const title = pageTitle(pal, scientific);
  const description = pageDescription(pal, scientific, SPECIES[id].facts.length);
  doc.title = title;
  const meta = (selector, value) => doc.querySelector(selector)?.setAttribute('content', value);
  meta('meta[name="description"]', description);
  meta('meta[property="og:title"]', title);
  meta('meta[property="og:description"]', description);
  meta('meta[property="og:url"]', url);
  doc.querySelector('link[rel="canonical"]').href = url;
  // This page is the one to index (the ?pal= page isn't).
  doc.querySelector('meta[name="robots"]')?.remove();

  // What the page is about, for search engines (schema.org structured data):
  // the real bacterium, so the page is matched to searches for her species.
  const data = doc.createElement('script');
  data.type = 'application/ld+json';
  data.textContent = JSON.stringify(structuredData(pal, scientific, url, description), null, 2);
  doc.head.append(data);

  // Ready-made, so no loading card and no script to fill it in.
  doc.querySelector('.loading-overlay')?.remove();
  doc.querySelector('script[src$="pal-profile.js"]')?.remove();
  for (const node of [...doc.body.childNodes]) {
    if (node.nodeType === dom.window.Node.COMMENT_NODE) node.remove();
  }

  // One folder down, so links back up the site go up a level.
  for (const el of doc.querySelectorAll('[href^="./"], [src^="./"]')) {
    const attribute = el.hasAttribute('href') ? 'href' : 'src';
    el.setAttribute(attribute, `../${el.getAttribute(attribute).slice(2)}`);
  }
  return dom.serialize();
}

// The sitemap, with a line for every pal page.
function sitemap(source, ids) {
  const pals = ids.map((id) => `  <url><loc>${SITE_URL}pals/${id}.html</loc></url>`).join('\n');
  return source.replace('</urlset>', `${pals}\n</urlset>`);
}

export async function buildSite(outDir = join(ROOT, 'site')) {
  rmSync(outDir, { recursive: true, force: true });
  cpSync(PUBLIC, outDir, { recursive: true });

  const game = {
    ...(await import('../public/game/config.js')),
    ...(await import('../public/game/pals.js')),
    ...(await import('../public/game/profile.js')),
    ...(await import('../public/game/italics.js')),
  };
  const ids = game.PALS.map((pal) => pal.id);
  const template = readFileSync(join(PUBLIC, 'pal-profile.html'), 'utf8');
  mkdirSync(join(outDir, 'pals'), { recursive: true });
  for (const id of ids) {
    writeFileSync(join(outDir, 'pals', `${id}.html`), await palPage(template, id, game));
  }
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap(readFileSync(join(PUBLIC, 'sitemap.xml'), 'utf8'), ids));
  return ids;
}

// Run from the command line: build into site/.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ids = await buildSite();
  console.log(`Built site/ with ${ids.length} pal pages.`);
}
