// tree.js: how the pals are related, simplified to the pals in the game.
import { describe, expect, it } from 'vitest';
import { PALS } from '../public/game/pals.js';
import { branchById, lineage, palsOn, TREE } from '../public/game/tree.js';

const names = (branches) => branches.map((b) => b.name);

describe('the family tree', () => {
  it('has every pal in the game on it exactly once, and no one else', () => {
    const on = palsOn(TREE);
    expect([...on].sort()).toEqual(PALS.map((pal) => pal.id).sort());
    expect(new Set(on).size).toBe(on.length);
  });

  it('gives every branch a name and a short note', () => {
    (function check(branch) {
      if (branch.leaf) return;
      expect(branch.id).toMatch(/^[a-z]+$/);
      expect(branch.name.length).toBeGreaterThan(0);
      expect(branch.note.length).toBeLessThanOrEqual(90);
      branch.kids.forEach(check);
    })(TREE);
  });

  it("traces a pal's branches from the top of the tree down to hers", () => {
    expect(names(lineage('colette'))).toEqual(['Bacteria', 'Proteobacteria', 'Gammaproteobacteria', 'Gut cousins']);
    expect(names(lineage('goldie'))).toEqual(['Bacteria', 'Firmicutes', 'Bacilli']);
    expect(names(lineage('dina'))).toEqual(['Bacteria', 'Deinococcota']);
    // A branch's own trail ends with itself.
    expect(names(lineage('gamma'))).toEqual(['Bacteria', 'Proteobacteria', 'Gammaproteobacteria']);
  });

  it('nests the gut cousins (Enterobacterales) inside the Gammaproteobacteria', () => {
    expect(branchById('enterobacterales').parent).toBe(branchById('gamma'));
    expect(lineage('sara')).toContain(branchById('gamma'));
  });

  it('knows the science: Bree and Coco look alike but sit on different branches', () => {
    expect(lineage('bree').at(-1)).toBe(branchById('alpha'));
    expect(lineage('coco').at(-1)).not.toBe(lineage('bree').at(-1));
    // Marina's waxy coat makes her stain poorly, but she's on a Gram-positive branch.
    expect(lineage('marina')).toContain(branchById('actinobacteria'));
  });

  it('finds the pals on any branch, however far down', () => {
    expect(palsOn(branchById('firmicutes'))).toEqual(['ceres', 'ivy', 'lissie', 'goldie', 'scarlett', 'penny', 'terra', 'diffany']);
    expect(branchById('nope')).toBeNull();
  });
});
