import { scanSync } from '../src/node';
import { createMatcher } from '../src';

import { run, bench } from 'mitata';

const pattern = '**/*.ts';
const des = './src';

const native = new Bun.Glob(pattern);
const scanNative = () => native.scanSync(des);

const custom = scanSync(createMatcher(pattern));
const scanCustom = () => custom(des);

// Verify
{
  const nativeRes = [...scanNative()];
  console.log('Native:', nativeRes);

  const customRes = scanCustom();
  console.log('Custom:', customRes);

  if (!Bun.deepEquals(nativeRes, customRes)) throw new Error('Invalid implementation!');
}

// Bench
bench('Native', scanNative);
bench('Custom', scanCustom);

run();
