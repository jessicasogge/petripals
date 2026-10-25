// For anyone whose device asks for less motion (prefers-reduced-motion),
// nothing in styles.css keeps moving. Speeding a looping animation up isn't
// enough: one that loops forever would then flicker every frame.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Without comments, so they aren't mistaken for selectors.
const css = readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// The insides of every @media (prefers-reduced-motion: reduce) block.
function reducedBlocks() {
  const blocks = [];
  const start = '@media (prefers-reduced-motion: reduce)';
  for (let at = css.indexOf(start); at !== -1; at = css.indexOf(start, at + 1)) {
    const open = css.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++;
      if (css[i] === '}' && --depth === 0) {
        blocks.push(css.slice(open + 1, i));
        break;
      }
    }
  }
  return blocks;
}

// Rules as [selectors, body], from CSS with no nested blocks.
const rules = (text) => [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selectors, body]) => [selectors.split(',').map((s) => s.trim()), body]);

// Every selector whose animation loops forever, outside the reduced blocks.
const looping = rules(css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, ''))
  .filter(([, body]) => /animation:[^;]*infinite/.test(body))
  .flatMap(([selectors]) => selectors);

// Every selector turned off (animation: none) for reduced motion.
const stilled = new Set(reducedBlocks().flatMap(rules)
  .filter(([, body]) => /animation:\s*none/.test(body))
  .flatMap(([selectors]) => selectors));

describe('reduced motion', () => {
  it('finds the looping animations', () => {
    expect(looping).toEqual(expect.arrayContaining(['.bob', '.squish', '.slither', '.wobble', '.infected-cell']));
  });

  it.each(looping)('turns off %s, which loops forever, rather than speeding it up', (selector) => {
    expect(stilled).toContain(selector);
  });

  it('stills the pop-up and the tumble spin too', () => {
    expect(stilled).toContain('.win-banner');
    expect(stilled).toContain('.pal-mover.tumbling .dish-pal');
  });
});
