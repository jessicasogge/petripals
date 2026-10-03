// Microscope mode: every pal as she'd look after a Gram stain. Gram-positive
// pals stay purple, Gram-negative ones turn pink, all in the same few shades
// so they match, and Elia, who barely takes the stain, only a pale pink.
//
// Turned on with the microscope button on the picker. It's remembered, so the
// mode page and the game show her stained too.

// The shades for each stain: `outline` for outlines, `body` for her body,
// `light` for shines and lighter parts, and `eyes` for her eyes and smile.
export const STAINS = {
  positive: { outline: '#5b21b6', body: '#a78bfa', light: '#ede9fe', eyes: '#2e1065' },
  negative: { outline: '#be185d', body: '#f9a8d4', light: '#fdf2f8', eyes: '#831843' },
  faint: { outline: '#f9a8d4', body: '#fce7f3', light: '#fff7fb', eyes: '#be185d' },
};

// Which shades a pal gets.
export function stainOf(species) {
  return STAINS[species.faintStain ? 'faint' : species.gram];
}

// Whether microscope mode is on. (Browser storage can be missing or blocked,
// e.g. in a private window; then it just isn't remembered.)
const KEY = 'petripals-gram-stain';
export function stainOn(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}
export function setStainOn(on, storage = globalThis.localStorage) {
  try {
    if (on) storage?.setItem(KEY, 'on');
    else storage?.removeItem(KEY);
  } catch {
    // not remembered, but the page still switches
  }
}

// How light a color is, from 0 (black) to 1 (white).
function lightness(color) {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}
const isColor = (value) => /^#[\da-f]{3}([\da-f]{3})?$/i.test(value ?? '');

// The stain shade for one part of her drawing, or null to leave it alone
// (white shines, the pink of her cheeks, anything with no color).
function shadeFor(element, attribute, stain) {
  const color = element.getAttribute(attribute);
  if (!isColor(color)) return null;
  const light = lightness(color);
  if (light > 0.99) return null; // white
  if (element.closest('.face')) {
    // Her eyes, smile and glasses frames: dark parts only, so her cheeks stay pink.
    return light < 0.45 ? stain.eyes : null;
  }
  // Darker parts are outlines (or her eyes, if very dark and filled in);
  // lighter ones are her body (some bodies are drawn as thick lines), and the
  // lightest are shines.
  if (light < 0.35 && attribute === 'fill') return stain.eyes;
  if (light < 0.65) return stain.outline;
  return light < 0.87 ? stain.body : stain.light;
}

// Stain `svg`, one of her drawings from pals.js. Her own colors stay in the
// drawing underneath, so unstainPal puts them back.
export function stainPal(svg, species) {
  const stain = stainOf(species);
  for (const element of svg.querySelectorAll('[fill], [stroke]')) {
    for (const attribute of ['fill', 'stroke']) {
      const shade = shadeFor(element, attribute, stain);
      if (shade) element.style.setProperty(attribute, shade);
    }
  }
}

export function unstainPal(svg) {
  for (const element of svg.querySelectorAll('[fill], [stroke]')) {
    element.style.removeProperty('fill');
    element.style.removeProperty('stroke');
  }
}

// `species` with her round cells' colors (coccus.js draws them itself) in
// her stain.
export function stainedSpecies(species) {
  if (!species.colors) return species;
  const stain = stainOf(species);
  return {
    ...species,
    colors: { fill: stain.body, stroke: stain.outline, highlight: stain.light, dark: stain.eyes },
  };
}
