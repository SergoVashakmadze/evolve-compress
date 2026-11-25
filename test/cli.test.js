import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compress } from "../src/compress.js";

const BIN = new URL("../bin/evolve-compress.js", import.meta.url).pathname;
const run = (args, input) => spawnSync(process.execPath, [BIN, ...args], { input });
const dir = () => mkdtempSync(join(tmpdir(), "ec-"));
const bytes = Uint8Array.from({ length: 3000 }, (_, i) => (i * 7) % 256 === 0 ? 0 : (i % 50 < 20 ? 65 : i & 255));

test("--help prints usage and exits 0", () => {
	const r = run(["--help"]);
	assert.equal(r.status, 0);
	assert.match(r.stdout.toString(), /Usage:/);
});

test("compress and decompress files, same bytes as the library", () => {
	const d = dir();
	writeFileSync(join(d, "a.bin"), bytes);
	assert.equal(run(["compress", join(d, "a.bin"), join(d, "a.out")]).status, 0);
	assert.deepEqual(new Uint8Array(readFileSync(join(d, "a.out"))), compress(bytes));
	assert.equal(run(["decompress", join(d, "a.out"), join(d, "a.back")]).status, 0);
	assert.deepEqual(new Uint8Array(readFileSync(join(d, "a.back"))), bytes);
});

test("default names: <in>.ec, and .ec stripped", () => {
	const d = dir();
	writeFileSync(join(d, "b.txt"), "hello");
	assert.equal(run(["compress", join(d, "b.txt")]).status, 0);
	assert.ok(existsSync(join(d, "b.txt.ec")));
	writeFileSync(join(d, "b.txt"), "");
	assert.equal(run(["decompress", join(d, "b.txt.ec")]).status, 0);
	assert.equal(readFileSync(join(d, "b.txt"), "utf8"), "hello");
	assert.notEqual(run(["decompress", join(d, "b.txt")]).status, 0);
});

test("pipes: - is stdin and stdout, binary kept exactly, empty input too", () => {
	const c = run(["compress", "-", "-"], bytes);
	assert.equal(c.status, 0);
	const back = run(["decompress", "-"], c.stdout);
	assert.equal(back.status, 0);
	assert.deepEqual(new Uint8Array(back.stdout), bytes);
	const empty = run(["compress", "-"], Buffer.alloc(0));
	assert.equal(empty.status, 0);
	assert.equal(run(["decompress", "-"], empty.stdout).stdout.length, 0);
});

test("errors: unknown command 2, missing file 1, invalid stream 3", () => {
	assert.equal(run(["squash", "x"]).status, 2);
	assert.equal(run([]).status, 2);
	const missing = run(["compress", "/no/such/file"]);
	assert.equal(missing.status, 1);
	assert.match(missing.stderr.toString(), /no such file/);
	const bad = run(["decompress", "-", "-"], Buffer.from([0, 65, 3]));
	assert.equal(bad.status, 3);
	assert.equal(bad.stdout.length, 0);
});
