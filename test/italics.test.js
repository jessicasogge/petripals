// @vitest-environment jsdom
// Italics in scientific names, marked between asterisks in config.js.
import { describe, expect, it } from 'vitest';
import { plainText, shortSpeciesName, speciesName, withItalics } from '../public/game/italics.js';

// Nodes as "text" and "<i>italic</i>", to compare easily.
const shown = (nodes) => nodes.map((n) => (n.nodeName === 'I' ? `<i>${n.textContent}</i>` : n.textContent)).join('');

describe('italics', () => {
  it('drops the markers for the words as they read on screen', () => {
    expect(plainText('*Salmonella* Typhi')).toBe('Salmonella Typhi');
    expect(plainText('Bacillus cereus')).toBe('Bacillus cereus');
  });

  it('puts the parts between asterisks in <i>, as text, never HTML', () => {
    expect(shown(withItalics('A cousin, *Bacillus anthracis*, too.'))).toBe('A cousin, <i>Bacillus anthracis</i>, too.');
    const [italic] = withItalics('*<b>bold</b>*');
    expect(italic.textContent).toBe('<b>bold</b>');
    expect(italic.querySelector('b')).toBeNull();
  });

  it('leaves out empty pieces at the ends', () => {
    expect(withItalics('*Salmonella* Typhi')).toHaveLength(2);
  });

  it('writes a species all in italics, unless it marks its own', () => {
    expect(shown(speciesName('Bacillus cereus'))).toBe('<i>Bacillus cereus</i>');
    // A serovar is capitalized and upright.
    expect(shown(speciesName('*Salmonella* Typhi'))).toBe('<i>Salmonella</i> Typhi');
  });

  it('shortens a species to the first letter of its genus', () => {
    expect(shown(shortSpeciesName('Pseudomonas aeruginosa'))).toBe('<i>P. aeruginosa</i>');
    expect(shown(shortSpeciesName('*Salmonella* Typhi'))).toBe('<i>S.</i> Typhi');
  });
});
