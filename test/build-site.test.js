// The site the deploy publishes (scripts/build-site.js): public/, plus a
// ready-made page for each pal, for search engines.
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSite, SITE_URL } from '../scripts/build-site.js';
import { SPECIES } from '../public/game/config.js';
import { plainText } from '../public/game/italics.js';
import { PALS } from '../public/game/pals.js';

let out;
const page = (id) => new JSDOM(readFileSync(join(out, 'pals', `${id}.html`), 'utf8')).window.document;
const meta = (doc, selector) => doc.querySelector(selector)?.getAttribute('content');

beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), 'petripals-site-'));
  await buildSite(out);
});

afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

describe('the built site', () => {
  it('copies the game from public/', () => {
    for (const file of ['index.html', 'pal-picker.html', 'styles.css', 'game/pals.js']) {
      expect(existsSync(join(out, file)), file).toBe(true);
    }
  });

  it('has a ready-made page for every pal', () => {
    for (const { id } of PALS) expect(existsSync(join(out, 'pals', `${id}.html`)), id).toBe(true);
  });

  it("gives each pal page her own title, description and address, for search", () => {
    for (const { id, name } of PALS) {
      const doc = page(id);
      const scientific = plainText(SPECIES[id].scientific);
      expect(doc.title, id).toBe(`${scientific}: Meet ${name} | PetriPals`);
      const description = meta(doc, 'meta[name="description"]');
      expect(description, id).toContain(name);
      expect(description.length, id).toBeLessThanOrEqual(160);
      expect(meta(doc, 'meta[property="og:description"]'), id).toBe(description);
      expect(meta(doc, 'meta[property="og:title"]'), id).toBe(doc.title);
      const url = `${SITE_URL}pals/${id}.html`;
      expect(doc.querySelector('link[rel="canonical"]').getAttribute('href'), id).toBe(url);
      expect(meta(doc, 'meta[property="og:url"]'), id).toBe(url);
      // Unlike the ?pal= page, these are the ones to index.
      expect(doc.querySelector('meta[name="robots"]'), id).toBeNull();
    }
  });

  it('tells search engines her page is about her real bacterium (structured data)', () => {
    for (const { id, name } of PALS) {
      const doc = page(id);
      const data = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
      const scientific = plainText(SPECIES[id].scientific);
      expect(data['@context'], id).toBe('https://schema.org');
      expect(data['@type'], id).toBe('LearningResource');
      expect(data.name, id).toBe(`${name}, a cartoon ${scientific}`);
      expect(data.about.name, id).toBe(scientific);
      expect(data.url, id).toBe(`${SITE_URL}pals/${id}.html`);
      expect(data.description, id).toBe(meta(doc, 'meta[name="description"]'));
      expect(data.isPartOf.url, id).toBe(SITE_URL);
    }
  });

  it('writes her profile into the page, so it reads without JavaScript', () => {
    const doc = page('hallie');
    expect(doc.querySelector('.profile-name').textContent).toBe('Hallie');
    expect(doc.querySelector('.profile-species').textContent).toBe('Helicobacter pylori');
    expect(doc.querySelector('.profile-size').textContent).toBe('~3 µm');
    expect(doc.querySelector('.profile-pal svg')).not.toBeNull();
    // Her stained picture keeps its stain colors.
    expect(doc.querySelector('.profile-stain-pal svg [style*="fill"]')).not.toBeNull();
    const facts = [...doc.querySelectorAll('.profile-facts li')].map((li) => li.textContent);
    expect(facts).toEqual(SPECIES.hallie.facts.map(plainText));
    // Nothing left to fill in: no loading card and no profile script.
    expect(doc.querySelector('.loading-overlay')).toBeNull();
    expect(doc.querySelector('script[src*="pal-profile.js"]')).toBeNull();
  });

  it('links back up the site from the pals folder', () => {
    const doc = page('cora');
    expect(doc.querySelector('link[rel="stylesheet"]').getAttribute('href')).toBe('../styles.css');
    expect(doc.querySelector('link[rel="icon"]').getAttribute('href')).toBe('../favicon.svg');
    expect(doc.querySelector('.profile-back').getAttribute('href')).toBe('../choose-mode.html?pal=cora');
    for (const el of doc.querySelectorAll('[href^="./"], [src^="./"]')) {
      throw new Error(`still links from the top folder: ${el.outerHTML.slice(0, 80)}`);
    }
  });

  it('adds every pal page to the sitemap, after the pages already there', () => {
    const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
    const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(pages).toContain(SITE_URL);
    expect(pages).toContain(`${SITE_URL}pal-picker.html`);
    for (const { id } of PALS) expect(pages, id).toContain(`${SITE_URL}pals/${id}.html`);
    // Every address is a real file in the built site.
    for (const address of pages) {
      expect(existsSync(join(out, address.slice(SITE_URL.length) || 'index.html')), address).toBe(true);
    }
  });

  it('leaves public/ itself alone', () => {
    expect(existsSync(join('public', 'pals'))).toBe(false);
    expect(readFileSync(join('public', 'sitemap.xml'), 'utf8')).not.toContain('/pals/');
  });
});
