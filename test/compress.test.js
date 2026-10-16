import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compress, decompress } from "../src/compress.js";

const roundTrip = (bytes) => assert.deepEqual(decompress(compress(bytes)), bytes);

test("empty input", () => roundTrip(new Uint8Array(0)));
test("one byte, and every byte value", () => {
	roundTrip(Uint8Array.of(7));
	roundTrip(Uint8Array.from({ length: 256 }, (_, i) => i));
});
test("long runs, longer than any length field", () => roundTrip(new Uint8Array(70_000).fill(65)));
test("pseudo-random bytes", () => {
	let x = 12345;
	roundTrip(Uint8Array.from({ length: 20_000 }, () => ((x = (x * 1103515245 + 12345) >>> 0) >>> 16) & 255));
});
test("text, including the corpus", () => {
	roundTrip(new TextEncoder().encode("abracadabra ".repeat(500) + "naïve café ✓"));
	roundTrip(new Uint8Array(readFileSync(new URL("../data/corpus.txt", import.meta.url))));
});
test("returns Uint8Array", () => assert.ok(compress(Uint8Array.of(1, 2, 3)) instanceof Uint8Array));
