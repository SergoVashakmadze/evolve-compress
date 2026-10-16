# AGENTS.md

- Only `src/compress.js` should change. Keep `compress`/`decompress` exported with the same signatures.
- `npm test` must pass; `npm run bench` prints `score: <bytes>` (lower is better).
- No dependencies, no network, plain Node 24 ESM. Must stay lossless for any bytes, not just the corpus.
