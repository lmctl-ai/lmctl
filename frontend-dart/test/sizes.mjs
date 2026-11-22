import {readFileSync} from 'node:fs'; import zlib from 'node:zlib';
for (const f of process.argv.slice(2)) { const b = readFileSync(f);
  const gz = zlib.gzipSync(b,{level:9}).length, br = zlib.brotliCompressSync(b,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11}}).length;
  console.log(f.padEnd(34), String(b.length).padStart(8), String(gz).padStart(8), String(br).padStart(8)); }
