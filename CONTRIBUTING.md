# Contributing to PetriPals

Thanks for your interest in PetriPals! Bug reports, ideas for new pals or antibiotics, and fixes are all welcome.

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting a bug or suggesting an idea

[Open an issue](https://github.com/jessicasogge/petripals/issues) and tell us:

- **For a bug:** what you did, what you expected, and what happened instead. Say which browser and device you were on (for example, Chrome on a laptop, or Safari on an iPhone). A screenshot helps a lot.
- **For an idea:** what you'd like to see and why. If it's about the science, such as a new species or drug, a source for the details is great.

## Making a change

1. Fork the repo and create a branch for your change.
2. Install and start the game:

   ```sh
   npm install
   npm run dev
   ```

   Then open http://localhost:3000.

3. Make your change. The game is plain HTML, CSS and JavaScript in `public/`, with no build step. See the [README](README.md#project-layout) for where things live.
4. Add or update tests for what you changed, and make sure they all pass and still cover the game:

   ```sh
   npm run test:coverage
   ```

5. Open a pull request saying what you changed and why. For anything you can see, such as how a pal looks or moves, include a screenshot.

## Style

- **Keep pull requests small and focused.** One fix or feature per pull request is easiest to review.
- **Write comments in plain English** that explain why, not just what, like the existing code does.
- **Check it on a phone as well as a computer.** The game works with both arrow keys and touch.
- **Try both game modes.** Classic and mixed culture share a lot of code (colonies, steering, nutrients), so a change for one can affect the other.
- **Keep the science honest.** If a pal, drug or zone size is simplified or made up for the game, say so in a comment.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
