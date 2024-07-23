import { Glob } from 'bun';
import { createMatcher } from '../src';
import { run, bench, group } from 'mitata';

const patterns = ['src/*.ts', '**/*.js', 'src/**/*.ts', 'src/[a-z][!0-9][A-Z].ts',];

const paths = [
  'src/a.ts', 'src/b.js', 't/a.ts', 'root', 'path/index.ts',
  'src/ast.ts', 'src/nested/a.js', 'src/dir/nested/ast.ts',
  'src/abC.ts', 'src/1xD.ts', 'src/k1B.ts'
];

for (const pattern of patterns)
  group(pattern, () => {
    // Bun glob
    const glob = new Glob(pattern);
    const nativeMatcher = (str: string) => glob.match(str);

    // Glob compiler
    const customMatcher = createMatcher(pattern);

    bench('Bun matcher', () => paths.map(nativeMatcher));
    bench('Custom matcher', () => paths.map(customMatcher));
  });

run();
