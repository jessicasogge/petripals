// @vitest-environment jsdom
// Detective mode's Pal Book (book.js): the pals you've identified, kept in
// this browser, and a game that still works without storage.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addToBook, loadBook } from '../public/game/book.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('the Pal Book', () => {
  it('starts empty and keeps each pal once, in the order found', () => {
    expect(loadBook()).toEqual([]);
    addToBook('vi');
    addToBook('goldie');
    expect(addToBook('vi')).toEqual(['vi', 'goldie']);
    expect(loadBook()).toEqual(['vi', 'goldie']);
  });

  it('drops anything in a save that isn\'t a pal', () => {
    localStorage.setItem('petripals-pal-book', JSON.stringify(['mona', 'nobody', 5, 'toString']));
    expect(loadBook()).toEqual(['mona']);
    localStorage.setItem('petripals-pal-book', JSON.stringify({ mona: true }));
    expect(loadBook()).toEqual([]);
    localStorage.setItem('petripals-pal-book', 'not json');
    expect(loadBook()).toEqual([]);
  });

  it('still works when the browser keeps no storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('no storage');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('no storage');
    });
    expect(loadBook()).toEqual([]);
    expect(addToBook('coco')).toEqual(['coco']);
  });
});
