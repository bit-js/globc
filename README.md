# Globc

An insanely fast cross-runtime glob pattern matcher.

```ts
import { createMatcher } from "@bit-js/globc";

const match = createMatcher("src/*.ts");
match("src/index.ts"); // true
match("src/index.js"); // false
```

## Features

Globc supports basic glob features:

- `*`: Matches 0 or more characters in a single path part
- `?`: Matches 1 character
- `[...]`: Matches a range of characters, similar to a RegExp range. If the first character of the range is `!` then it matches any character not in the range
- `**`: Matches zero or more directories and subdirectories searching for matches
- `{a,b}`: Matches any of the given patterns

## Directory scan

Currently this library only supports reading and returning paths as `string[]` with Node APIs.

```ts
import { createMatcher } from "@bit-js/globc";
import { scan, scanSync } from "@bit-js/globc/node";

// Require a matcher to be passed in as args
const match = createMatcher("src/*.ts");

// Promise API
const run = scan(match);
await run("src"); // string[]

// Sync API
const runSync = scanSync(match);
runSync("src");
```
