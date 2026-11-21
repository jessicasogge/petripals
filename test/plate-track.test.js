// @vitest-environment jsdom
// Counting which plates get tried on a pal's profile (game/plate-track.js).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));
const { track } = await import('../public/game/track.js');

const file = (name) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8');

// A profile, filled in the way the page does, then counted.
async function openProfile(id = 'colette') {
  track.mockClear();
  const html = file('pal-profile.html');
  vi.stubGlobal('location', { search: `?pal=${id}`, href: `http://localhost/pal-profile.html?pal=${id}`, replace: vi.fn() });
  document.body.outerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/pal-profile.js');
  await import('../public/game/plate-track.js');
}

const paths = () => track.mock.calls.map(([path]) => path);
const pick = (kind) => {
  const radio = document.querySelector(`#plate-${kind}`);
  radio.checked = true;
  radio.dispatchEvent(new window.Event('change', { bubbles: true }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('counting the plates people try', () => {
  it('counts nothing until a plate is picked', async () => {
    await openProfile();
    expect(paths()).toEqual([]);
  });

  it('counts each comparison plate, named the way her button is', async () => {
    await openProfile('colette');
    pick('macconkey');
    expect(paths()).toEqual(['plate/macconkey']);
    expect(track.mock.calls[0][1]).toBe('Tried her on MacConkey');
    pick('blood');
    pick('chocolate');
    expect(paths()).toEqual(['plate/macconkey', 'plate/blood', 'plate/chocolate']);
  });

  it('counts going back to her own plate too', async () => {
    await openProfile('colette');
    pick('blood');
    pick('home');
    expect(paths()).toEqual(['plate/blood', 'plate/home']);
    // Her own plate is named for the agar it is, not "home".
    expect(track.mock.calls[1][1]).toBe('Tried her on EMB');
  });

  it('counts each plate once a visit, so one kid is not a crowd', async () => {
    await openProfile('colette');
    for (let i = 0; i < 3; i++) {
      pick('blood');
      pick('macconkey');
    }
    expect(paths()).toEqual(['plate/blood', 'plate/macconkey']);
  });

  it('leaves Elia alone, who has only her own plate and no buttons', async () => {
    await openProfile('elia');
    expect(document.querySelector('.plate-chips')).toBeNull();
    expect(paths()).toEqual([]);
  });

  it('rides along on the ready-made pal pages, which have no profile script', () => {
    // Those pages are what About opens, so the script has to survive the
    // build (scripts/build-site.js drops only pal-profile.js).
    const page = file('pal-profile.html');
    expect(page).toContain('src="./game/plate-track.js"');
    expect(page).toContain('src="./game/pal-profile.js"');
  });
});
