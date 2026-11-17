// @vitest-environment jsdom
// On the Plate: each pal's colonies on a streaked plate (game/colonies.js).
import { describe, expect, it } from 'vitest';
import { COLONIES, plate } from '../public/game/colonies.js';
import { SPECIES } from '../public/game/config.js';

const IDS = Object.keys(SPECIES);
const svgOf = (id) => {
  const box = document.createElement('div');
  box.innerHTML = plate(id);
  return box.querySelector('svg');
};

describe('colonies', () => {
  it('describes every pal, and no one else', () => {
    expect(Object.keys(COLONIES).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)("%s's caption fits beside her plate and has no dashes", (id) => {
    const { caption } = COLONIES[id];
    expect(caption.length).toBeLessThanOrEqual(110);
    expect(caption).not.toMatch(/[-–—]/);
  });

  it.each(IDS)("draws %s's plate the same every time, with everything kept on the agar", (id) => {
    expect(plate(id)).toBe(plate(id));
    const svg = svgOf(id);
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 200');
    expect(svg.querySelector(`clipPath#dish-${id}`)).not.toBeNull();
    expect(svg.querySelector('g[clip-path]').getAttribute('clip-path')).toBe(`url(#dish-${id})`);
  });

  it('gives each pal her own pattern of colonies', () => {
    const scatter = (id) => [...svgOf(id).querySelectorAll('g[clip-path] circle')].slice(0, 5).map((c) => c.getAttribute('cx'));
    expect(scatter('goldie')).not.toEqual(scatter('sara'));
  });

  it('streaks most plates: one merged band of growth, then separate colonies', () => {
    const svg = svgOf('goldie');
    const bands = [...svg.querySelectorAll('g[clip-path] path')].filter((p) => p.getAttribute('stroke-width'));
    expect(bands.length).toBeGreaterThan(0);
    expect(svg.querySelectorAll('g[clip-path] circle').length).toBeGreaterThan(50);
  });

  it('puts the right agar under her: blood agar for Scarlett, chocolate for Coco', () => {
    const agar = (id) => svgOf(id).querySelector(`#agar-${id} stop`).getAttribute('stop-color');
    expect(agar('scarlett')).toBe('#a3202a');
    expect(agar('coco')).toBe('#8a5a3c');
  });

  it('rings colonies that change the agar around them, inside out', () => {
    const fills = (id) => new Set([...svgOf(id).querySelectorAll('g[clip-path] circle')].map((c) => c.getAttribute('fill')));
    expect(fills('scarlett')).toContain('#efc38f'); // clear rings
    // Cleo's double zone: a hazy outer ring and a clear inner one.
    expect(fills('cleo')).toContain('#c4474f');
    expect(fills('cleo')).toContain('#efc38f');
    expect(fills('vera')).toContain('#2a2118'); // the agar turns black
    expect(fills('goldie')).not.toContain('#efc38f');
  });

  it("leaves Elia's plate empty: she doesn't grow on ordinary agar", () => {
    expect(svgOf('elia').querySelector('g[clip-path]').children).toHaveLength(0);
    expect(COLONIES.elia.caption).toMatch(/won't grow/);
  });

  it('spreads Ivy out in a few big rootlike colonies, not a streak', () => {
    const svg = svgOf('ivy');
    expect(svg.querySelectorAll('g[clip-path] path[stroke="#fbf8ee"]').length).toBeGreaterThan(50);
  });

  it('covers Terra\'s plate in a thin film, and gives Sallie black centers', () => {
    expect(svgOf('terra').querySelector('g[clip-path] path[opacity="0.35"]')).not.toBeNull();
    expect([...svgOf('sallie').querySelectorAll('circle')].some((c) => c.getAttribute('fill') === '#1f1a1a')).toBe(true);
  });

  it('gives Colette and Mona a metallic sheen', () => {
    for (const id of ['colette', 'mona']) expect(svgOf(id).querySelector(`linearGradient#colony-${id}`)).not.toBeNull();
    expect(svgOf('goldie').querySelector('linearGradient')).toBeNull();
  });
});
