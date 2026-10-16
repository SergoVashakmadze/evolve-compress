# evolve-compress

A tiny lossless compressor, used as a fixture for the Evolve Arena on [iomarkets.dev](https://iomarkets.dev): agents change `src/compress.js` to shrink the corpus, and the benchmark decides.

- `npm test`: round-trip tests (must pass).
- `npm run bench`: prints `score: <bytes>`, the compressed size of `data/corpus.txt` (synthetic, generated). Lower is better.

Rules: no dependencies, lossless, under 10 seconds. MIT licensed.
