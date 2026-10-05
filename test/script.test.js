// @vitest-environment jsdom
// script.js runs the home page's "Press Start to Play" button. These tests
// load the real home page into jsdom, a simulated browser page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const html = (name) => {
  const page = readFileSync(resolve(process.cwd(), 'public', name), 'utf8');
  return page.slice(page.indexOf('<body'), page.indexOf('</body>'));
};

let location;

// Open `page` and run script.js on it.
async function open(page = 'index.html') {
  location = { href: `http://localhost/${page}` };
  vi.stubGlobal('location', location);
  document.body.outerHTML = html(page);
  vi.resetModules();
  await import('../public/script.js');
  return document.querySelector('.start-btn');
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the start button', () => {
  it('says "Press Start to Play" when the page opens', async () => {
    const button = await open();
    expect(button.textContent).toBe('Press Start to Play');
    expect(button.disabled).toBe(false);
  });

  it('shows it heard the click right away, and can\'t be pressed twice', async () => {
    // Fake timers, so the click's delayed jump to the picker can't fire after
    // this test file has finished and its simulated page is gone.
    vi.useFakeTimers();
    const button = await open();
    button.click();
    expect(button.textContent).toBe('Opening picker...');
    expect(button.disabled).toBe(true);
  });

  it('opens the pal picker a moment after the click', async () => {
    vi.useFakeTimers();
    const button = await open();
    button.click();
    vi.advanceTimersByTime(249);
    expect(location.href).toBe('http://localhost/index.html'); // not yet
    vi.advanceTimersByTime(1);
    expect(location.href).toBe('./pal-picker.html');
  });
});

describe('coming back with the Back button', () => {
  // The browser can show the page exactly as it was left, so the button
  // used to stay stuck on "Opening picker..." and couldn't be pressed.
  it('puts the button back the way it started', async () => {
    vi.useFakeTimers();
    const button = await open();
    button.click();
    vi.advanceTimersByTime(250);
    window.dispatchEvent(new Event('pageshow'));
    expect(button.textContent).toBe('Press Start to Play');
    expect(button.disabled).toBe(false);
  });

  it('works again after coming back', async () => {
    vi.useFakeTimers();
    const button = await open();
    button.click();
    vi.advanceTimersByTime(250);
    window.dispatchEvent(new Event('pageshow'));
    location.href = 'http://localhost/index.html';
    button.click();
    expect(button.textContent).toBe('Opening picker...');
    vi.advanceTimersByTime(250);
    expect(location.href).toBe('./pal-picker.html');
  });
});

describe('pages without a start button', () => {
  it("doesn't break the pal picker if it's loaded there", async () => {
    await expect(open('pal-picker.html')).resolves.toBeNull();
  });
});
