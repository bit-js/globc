import { describe, it, expect } from 'bun:test';

export default function load(props: {
  category: string,
  tests: {
    pattern: string,
    tests: {
      path: string,
      matched: boolean
    }[]
  }[],
  compile: (pattern: string) => (path: string) => boolean
}): void {
  describe('Matcher', () => {
    for (const item of props.tests) {
      const match = props.compile(item.pattern);
      console.log(`'${item.pattern}':`, match.toString());

      describe(item.pattern, () => {
        for (const constraint of item.tests) {
          it(constraint.path, () => {
            expect(match(constraint.path)).toBe(constraint.matched);
          });
        }
      });
    }
  });
}
