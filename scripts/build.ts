/// <reference types='bun-types' />
import { existsSync, rmSync } from 'fs';
import pkg from '../package.json';
import { exec } from './utils';

const outdir = './lib';

// Generating types
if (existsSync(outdir)) rmSync(outdir, { recursive: true });

// Build source files
Bun.build({
    format: 'esm',
    target: 'bun',
    outdir,
    entrypoints: ['./src/index.ts', './src/node.ts'],
    minify: {
        whitespace: true
    },
    // @ts-ignore
    external: Object.keys(pkg.dependencies ?? {})
});

await exec`bun x tsc`;
