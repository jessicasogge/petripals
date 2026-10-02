// @vitest-environment jsdom
// placeAntibiotics adds the disks to the page, so these tests run in jsdom,
// a simulated browser page.
import { beforeEach, describe, expect, it } from 'vitest';
import { placeAntibiotics } from '../public/game/antibiotic.js';
import { SPECIES } from '../public/game/config.js';

beforeEach(() => {
  document.body.innerHTML = '<div class="agar"></div>';
});

describe('placing the disks', () => {
  it('puts one disk per antibiotic on the agar, labeled with its code', () => {
    const disks = placeAntibiotics(SPECIES.goldie.antibiotics.slice(0, 3));
    const els = [...document.querySelectorAll('.agar .antibiotic')];
    expect(els).toHaveLength(3);
    expect(els.map((el) => el.textContent)).toEqual(['OX', 'VA', 'SXT']);
    expect(disks.map((d) => d.el)).toEqual(els);
  });

  it('names the antibiotic for the hover label, starting with a capital letter', () => {
    placeAntibiotics([{ code: 'P', name: 'penicillin' }, { code: 'SXT', name: 'trimethoprim-sulfamethoxazole' }]);
    const names = [...document.querySelectorAll('.antibiotic')].map((el) => el.dataset.name);
    expect(names).toEqual(['Penicillin', 'Trimethoprim-sulfamethoxazole']);
  });

  it("doesn't also show the browser's own slow tooltip", () => {
    placeAntibiotics([{ code: 'P', name: 'penicillin' }]);
    expect(document.querySelector('.antibiotic').hasAttribute('title')).toBe(false);
  });

  it('tells screen readers what the disk is', () => {
    placeAntibiotics([{ code: 'E', name: 'erythromycin' }]);
    expect(document.querySelector('.antibiotic').getAttribute('aria-label')).toMatch(/erythromycin/);
  });
});

describe("a disk for a drug she's resistant to", () => {
  it("tells screen readers there's no clear zone, but the disk still counts", () => {
    placeAntibiotics([{ code: 'GM', name: 'gentamicin', zone: null }]);
    expect(document.querySelector('.antibiotic').getAttribute('aria-label'))
      .toBe("Antibiotic disk: gentamicin. No clear zone (resistant), but don't touch the disk!");
  });
});
