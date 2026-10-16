// Prints `score: <bytes>`: the compressed size of the corpus. Lower is better.
// Fails (no score) if the round trip is not exact or takes over 10 s.
import { readFileSync } from "node:fs";
import { compress, decompress } from "./src/compress.js";

const corpus = new Uint8Array(readFileSync(new URL("./data/corpus.txt", import.meta.url)));
const t0 = performance.now();
const packed = compress(corpus);
const back = decompress(packed);
const ms = performance.now() - t0;
if (back.length !== corpus.length || back.some((b, i) => b !== corpus[i])) throw new Error("round trip failed");
if (ms > 10_000) throw new Error(`too slow: ${Math.round(ms)} ms`);
console.log(`corpus ${corpus.length} bytes -> ${packed.length} bytes in ${Math.round(ms)} ms`);
console.log(`score: ${packed.length}`);
