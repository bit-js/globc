import { readdir } from 'fs/promises';
import { readdirSync } from 'fs';

import type { Matcher } from '.';

export function scan(matcher: Matcher): (dir: string) => Promise<string[]> {
  const scanOpts = { recursive: true } as const;

  // eslint-disable-next-line
  const filter = (result: string[]): string[] => result.filter(matcher);

  // eslint-disable-next-line
  return (dir) => readdir(dir, scanOpts).then(filter);
}

export function scanSync(matcher: Matcher): (dir: string) => string[] {
  const scanOpts = { recursive: true };

  // @ts-expect-error Should return a list of string
  return (dir) => readdirSync(dir, scanOpts).filter(matcher);
}
