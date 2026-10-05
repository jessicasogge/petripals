// Detective mode's Pal Book: every pal you've identified, kept in this
// browser so it fills up case by case. Without storage (private browsing,
// etc.) it starts empty each visit, and the game still works.
import { palById } from './pals.js';

const STORAGE_KEY = 'petripals-pal-book';

// The ids of the pals found so far, in the order they were found. Anything
// that isn't a pal's id (an old or edited save) is dropped.
export function loadBook() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id) => palById(id)) : [];
  } catch {
    return [];
  }
}

// Add pal `id` to the book, if she isn't in it yet, and return the book.
export function addToBook(id) {
  const book = loadBook();
  if (!book.includes(id)) book.push(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
  } catch {
    // No storage: she's in the book for this page only.
  }
  return book;
}
