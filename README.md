# Globc
An insanely fast cross-runtime glob pattern matcher.

```ts
import { createMatcher } from '@bit-js/globc';

const match = createMatcher('src/*.ts');
match('src/index.ts'); // true
match('src/index.js'); // false
```

## Supported patterns

