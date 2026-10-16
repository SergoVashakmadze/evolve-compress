// A lossless byte compressor. compress(Uint8Array) -> Uint8Array; decompress reverses it exactly.
// The starting point is plain run-length encoding: each run is stored as [count, byte].
// It is deliberately weak on text; any lossless scheme that keeps the tests passing is allowed.

export function compress(input) {
	const out = [];
	for (let i = 0; i < input.length; ) {
		let run = 1;
		while (i + run < input.length && input[i + run] === input[i] && run < 255) run++;
		out.push(run, input[i]);
		i += run;
	}
	return Uint8Array.from(out);
}

export function decompress(data) {
	const out = [];
	for (let i = 0; i < data.length; i += 2) for (let k = 0; k < data[i]; k++) out.push(data[i + 1]);
	return Uint8Array.from(out);
}
