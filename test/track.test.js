// @vitest-environment jsdom
// track.js counts game events on GoatCounter. Counting is a nice extra, so
// these tests mostly check it can never break the game: an ad blocker,
// playing offline, or GoatCounter itself failing.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from '../public/game/track.js';

afterEach(() => {
  delete window.goatcounter;
});

describe('track', () => {
  it('counts the event on GoatCounter as an event, not a page visit', () => {
    window.goatcounter = { count: vi.fn() };
    track('level-complete/mona/level-3', 'Mona finished level 3');
    expect(window.goatcounter.count).toHaveBeenCalledWith({
      path: 'level-complete/mona/level-3',
      title: 'Mona finished level 3',
      event: true,
    });
  });

  it('uses the event name as its title when there is no title', () => {
    window.goatcounter = { count: vi.fn() };
    track('won-all-levels/vi');
    expect(window.goatcounter.count).toHaveBeenCalledWith(expect.objectContaining({
      path: 'won-all-levels/vi',
      title: 'won-all-levels/vi',
    }));
  });

  it("quietly does nothing when GoatCounter didn't load (an ad blocker, or offline)", () => {
    expect(() => track('game-over/mona/level-1/CIP')).not.toThrow();
  });

  it('quietly does nothing while GoatCounter is still loading', () => {
    window.goatcounter = {}; // there, but not ready to count yet
    expect(() => track('level-complete/coco/level-1')).not.toThrow();
  });

  it('never lets an error in GoatCounter break the game', () => {
    window.goatcounter = { count: vi.fn(() => { throw new Error('GoatCounter is down'); }) };
    expect(() => track('level-complete/goldie/level-2')).not.toThrow();
    expect(window.goatcounter.count).toHaveBeenCalled();
  });
});
