// Test settings. `npm run test:coverage` also measures how much of the game
// the tests run, and fails if it drops below the thresholds below. The
// deploy runs it, so a change that leaves new code untested doesn't ship.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['public/**/*.js'],
      exclude: ['public/game/vendor/**'], // confetti, copied in as is
      reporter: ['text-summary', 'text'],
      // Every line is tested today; a few rare branches (physics edge
      // cases) aren't, hence the slightly lower numbers for those.
      thresholds: { lines: 100, statements: 99, functions: 99, branches: 95 },
    },
  },
});
