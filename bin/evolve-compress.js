#!/usr/bin/env node
// Command-line front end for src/compress.js: compress or decompress a file, or stdin to stdout ("-").
import { readFile, writeFile } from "node:fs/promises";
import { compress, decompress } from "../src/compress.js";

const USAGE = `Usage:
  evolve-compress compress <in> [out]     out defaults to <in>.ec (stdout when <in> is -)
  evolve-compress decompress <in> [out]   out defaults to <in> without .ec (stdout when <in> is -)
  evolve-compress --help

Use - for stdin or stdout.`;

class CliError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

async function readInput(path) {
	if (path === "-") {
		const chunks = [];
		for await (const chunk of process.stdin) chunks.push(chunk);
		return new Uint8Array(Buffer.concat(chunks));
	}
	try {
		return new Uint8Array(await readFile(path));
	} catch (err) {
		if (err.code === "ENOENT") throw new CliError(`evolve-compress: no such file: ${path}`, 1);
		throw err;
	}
}

async function writeOutput(path, bytes) {
	if (path === "-") {
		await new Promise((resolve, reject) => process.stdout.write(bytes, (err) => (err ? reject(err) : resolve())));
	} else {
		await writeFile(path, bytes);
	}
}

// Valid means "something compress() produced": decompressing and compressing again gives the same bytes.
// This holds for any lossless, deterministic compressor, so it keeps working when src/compress.js changes format.
function decompressChecked(data) {
	let out;
	try {
		out = decompress(data);
	} catch {
		out = null;
	}
	const again = out && compress(out);
	if (!again || again.length !== data.length || !again.every((b, i) => b === data[i])) {
		throw new CliError("evolve-compress: input is not a valid compressed stream", 3);
	}
	return out;
}

function defaultOut(command, input) {
	if (input === "-") return "-";
	if (command === "compress") return `${input}.ec`;
	if (input.endsWith(".ec") && input.length > 3) return input.slice(0, -3);
	throw new CliError(`evolve-compress: cannot name the output for ${input} (no .ec suffix); give [out]`, 1);
}

export async function main(argv) {
	const [command, input, output, ...rest] = argv;
	if (command === "--help" || command === "-h") {
		process.stdout.write(`${USAGE}\n`);
		return 0;
	}
	if (command !== "compress" && command !== "decompress") {
		throw new CliError(`evolve-compress: unknown command ${command ? `"${command}"` : "(none)"}\n\n${USAGE}`, 2);
	}
	if (!input || rest.length) throw new CliError(`evolve-compress: expected <in> [out]\n\n${USAGE}`, 2);
	const out = output ?? defaultOut(command, input);
	const data = await readInput(input);
	if (command === "compress") {
		await writeOutput(out, compress(data));
	} else {
		await writeOutput(out, decompressChecked(data));
	}
	return 0;
}

main(process.argv.slice(2)).then(
	(code) => (process.exitCode = code),
	(err) => {
		process.stderr.write(`${err instanceof CliError ? err.message : `evolve-compress: ${err.message}`}\n`);
		process.exitCode = err instanceof CliError ? err.code : 1;
	},
);
