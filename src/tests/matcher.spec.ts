import { createMatcher } from '..';
import load from './loader';

load({
  category: 'Matcher',
  tests: [
    {
      pattern: '*.ts',
      tests: [
        { path: 'ast.ts', matched: true },

        { path: '/.ts', matched: false }
      ]
    },

    {
      pattern: 'src/*',
      tests: [
        { path: 'src/ast.ts', matched: true },

        { path: 'src/ast/index.ts', matched: false },
        { path: 'ast.ts', matched: false }
      ]
    },

    {
      pattern: '**/*.ts',
      tests: [
        { path: 'ast.ts', matched: true },
        { path: 'src/ast.ts', matched: true },

        { path: 'dist/index.js', matched: false }
      ]
    },

    {
      pattern: 'src/**/*.ts',
      tests: [
        { path: 'src/ast.ts', matched: true },
        { path: 'src/nested/dir/ast.ts', matched: true },

        { path: 'root', matched: false },
        { path: 'src/nested/dir/ast.js', matched: false }
      ]
    },

    {
      pattern: '**',
      tests: [
        { path: 'src', matched: true },
        { path: 'src/nested/dir', matched: true },
        { path: 'index.ts', matched: true },
        { path: 'src/ast.ts', matched: true }
      ]
    },

    {
      pattern: 'src/**',
      tests: [
        { path: 'src/dir', matched: true },
        { path: 'src/index.js', matched: true },
        { path: 'src/ast/compiler.ts', matched: true },

        { path: 'src', matched: false },
        { path: 'dir', matched: false }
      ]
    },

    {
      pattern: 'src/?',
      tests: [
        { path: 'src/a', matched: true },

        { path: 'src/ab', matched: false }
      ]
    },

    {
      pattern: 'src/[a-z][!0-9][A-Z].ts',
      tests: [
        { path: 'src/afP.ts', matched: true },

        { path: 'src/a1B.ts', matched: false },
        { path: 'src/ax.ts', matched: false },
        { path: 'src/ad8.ts', matched: false },
        { path: 'src/xFG.js', matched: false }
      ]
    },

    // TODO:
    {
      pattern: 'src/{a,b,cd}.ts',
      tests: [
        { path: 'src/a.ts', matched: true },
        { path: 'src/b.ts', matched: true },
        { path: 'src/cd.ts', matched: true },

        { path: 'c.ts', matched: false },
        { path: 'src/c.ts', matched: false },
        { path: 'src/a', matched: false }
      ]
    }
  ],
  compile: createMatcher
});

