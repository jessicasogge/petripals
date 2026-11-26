// What the linter checks. The tests already say whether the game works; this
// catches the things tests can't see, like a variable left behind after an
// edit, a promise nobody waits for, or a stray `console.log` shipped to the
// browser. Run it with `npm run lint` (and `npm run lint:fix` to tidy what
// can be tidied on its own).
//
// The rules are the ones the code already follows, so turning the linter on
// didn't mean rewriting anything. Style it doesn't police (how things are
// named, how comments read) stays a matter for review.
import js from '@eslint/js';
import globals from 'globals';

// Rules shared by everything here, on top of ESLint's recommended set.
const shared = {
  // An unused name is almost always something left behind by an edit. A
  // leading underscore says "I know, I want it anyway" (an argument kept for
  // its position, say).
  'no-unused-vars': ['error', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrors: 'none', // `catch {}` with nothing to say about it is fine
  }],
  // The game uses const and let; `var` behaves differently enough to confuse.
  'no-var': 'error',
  'prefer-const': 'error',
  // A promise nobody waits for fails silently, which is the worst way to fail.
  'no-async-promise-executor': 'error',
  'require-atomic-updates': 'error',
  // Easy to write by accident, and always a bug.
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-self-compare': 'error',
  'no-unmodified-loop-condition': 'error',
  'no-constant-binary-expression': 'error',
  'no-template-curly-in-string': 'error', // '${x}' in a plain string does nothing
  'no-unneeded-ternary': 'error',
  'no-useless-concat': 'error',
  'no-useless-rename': 'error',
  'object-shorthand': ['error', 'properties'],
};

export default [
  { ignores: ['site/**', 'coverage/**', 'public/game/vendor/**', 'node_modules/**'] },
  js.configs.recommended,

  // The game itself: runs in a browser, as modules.
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      ...shared,
      // Nothing the player can see should print to their console.
      'no-console': 'error',
      // The game never needs these, and they'd block the page.
      'no-alert': 'error',
    },
  },

  // The build and the dev server: Node.
  {
    files: ['scripts/**/*.js', '*.config.js', '*.config.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: shared,
  },

  // The tests: Vitest, with jsdom standing in for a browser.
  {
    files: ['test/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...shared,
      // A test that prints is usually a leftover from working something out.
      'no-console': 'error',
    },
  },
];
