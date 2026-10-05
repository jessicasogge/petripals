// Italics for scientific names, marked between asterisks in config.js:
// "Ceres's cousin *Bacillus thuringiensis* is ..." or "*Salmonella* Typhi".
// Built from text nodes, never HTML, so a fact or name can't break the page.

// `text` without its italics markers: the words as they read on screen.
export const plainText = (text) => text.replaceAll('*', '');

// `text` as nodes to put on the page, with the parts between asterisks in <i>.
export function withItalics(text) {
  return text
    .split('*')
    .map((part, i) => {
      if (i % 2 === 0) return document.createTextNode(part);
      const italic = document.createElement('i');
      italic.textContent = part;
      return italic;
    })
    .filter((node) => node.textContent !== '');
}

// A pal's `scientific` name as nodes for the page. Usually all of it is in
// italics (Bacillus cereus). A name that marks its own italics keeps the rest
// upright, like the serovar in *Salmonella* Typhi.
export function speciesName(scientific) {
  return withItalics(scientific.includes('*') ? scientific : `*${scientific}*`);
}

// Abbreviate a scientific name
export function shortSpeciesName(scientific) {
  const marked = scientific.includes('*') ? scientific : `*${scientific}*`;
  return withItalics(marked.replace(/^\*([A-Z])[a-z]+(\*?) /, '*$1.$2 '));
}
