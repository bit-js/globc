import { NodeType, createAST, type GenericNode } from './ast';

class MatcherBuilder {
  public hasIdx: boolean = false;
  public previousTrackerCount: number = 0;

  public idx: number = 0;

  public readonly dependenciesKey: string[] = [];
  public readonly dependencies: string[] = [];

  public readonly parts: string[] = [];

  public depend(dep: string): string {
    const key = `c${this.dependenciesKey.length}`;
    this.dependenciesKey.push(key);
    this.dependencies.push(`const ${key}=${dep};`);
    return key;
  }

  public getIndex(): string | number {
    return this.hasIdx ? this.idx === 0 ? 'k' : `k+${this.idx}` : this.idx;
  }

  // Return whether index is defined or re-assigned
  public defineIndexTracker(): boolean {
    if (this.hasIdx) {
      if (this.idx !== 0) {
        // Increment to reset later
        this.parts.push(`k+=${this.idx};`);
        this.idx = 0;
        return true;
      }
    } else {
      this.parts.push(`let k=${this.idx};`);
      this.hasIdx = true;
      this.idx = 0;
      return true;
    }

    return false;
  }

  public load(node: GenericNode, nextNode: GenericNode | null): void {
    const { dependencies, parts } = this;
    let closeBracket = false;

    switch (node[0]) {
      case NodeType.GROUP: {
        parts.push('{');
        this.defineIndexTracker();

        const { previousTrackerCount } = this;
        parts.push(`const t${previousTrackerCount}=k;`);
        ++this.previousTrackerCount;

        // Load the first one without resetting the index
        const next = node[1];
        const list = node[2];
        this.load(list[0], next);

        for (let i = 1, { length } = list; i < length; ++i) {
          // Reset the index
          parts.push(`k=t${previousTrackerCount};`);
          this.idx = 0;

          this.load(list[i], next);
        }

        parts.push('}');
        return;
      }

      case NodeType.GLOBSTAR:
        if (node[2]) {
          closeBracket = true;
          parts.push('{');
          this.defineIndexTracker();
          parts.push("const s=p.lastIndexOf('/');if(s>=k)k=s+1;");
        } else {
          // Match everything after
          parts.push('return true;');
          return;
        }

        break;

      case NodeType.WILDCARD:
        // No next node so no need to check node[1] after
        if (node[2] === null) {
          parts.push(`return p.indexOf('/',${this.getIndex()})===-1;`);
          return;
        }

        const negateNode = node[2];

        closeBracket = true;
        parts.push('{');
        this.defineIndexTracker();

        // Reset index to use k instead
        this.idx = 0;

        const negateCharsMap = this.depend('[]');
        let isNegate = false;

        switch (negateNode[0]) {
          case NodeType.CHAR_RANGE: {
            dependencies.push(`for(let i=${negateNode[2]};i<${negateNode[3] + 1};++i)${negateCharsMap}[i]=null;`);
            isNegate = negateNode[4];
            break;
          }

          case NodeType.CHARSET: {
            for (let i = 0, list = negateNode[2], { length } = list; i < length; ++i) dependencies.push(`${negateCharsMap}[${list.charCodeAt(i)}]=null;`);
            isNegate = negateNode[3];
            break;
          }

          case NodeType.STATIC: {
            // Only check one character
            dependencies.push(`${negateCharsMap}[${negateNode[2].charCodeAt(0)}]=null;`);
            break;
          }

          default:
            throw new Error(`Invalid node: ${JSON.stringify(negateNode)}`);
        }

        // Stop when reach slash
        dependencies.push(`${negateCharsMap}[47]=null;`);
        parts.push(`while(k<l&&${negateCharsMap}[p.charCodeAt(k)]${isNegate ? '=' : '!'}==null)++k;`);
        ++this.idx;

        break;

      case NodeType.CHAR_RANGE: {
        const key = this.depend('[]');

        dependencies.push(`for(let i=${node[2]};i<${node[3] + 1};++i)${key}[i]=null;`);
        parts.push(`if(${key}[p.charCodeAt(${this.getIndex()})]${node[4] ? '!' : '='}==null)`);

        ++this.idx;
        break;
      }

      case NodeType.CHARSET: {
        const key = this.depend('[]');
        for (let i = 0, list = node[2], { length } = list; i < length; ++i) dependencies.push(`${key}[${list.charCodeAt(i)}]=null;`);

        this.parts.push(`if(${key}[p.charCodeAt(${this.getIndex()})]${node[3] ? '!' : '='}==null)`);

        ++this.idx;
        break;
      }

      case NodeType.ANY_CHAR:
        ++this.idx;
        break;

      case NodeType.STATIC: {
        const str = node[2];
        for (let i = 0, { length } = str; i < length; ++i, ++this.idx) parts.push(`if(p.charCodeAt(${this.getIndex()})===${str.charCodeAt(i)})`);
        break;
      }

      case NodeType.ROOT:
        break;
    }

    // Handle next node
    const next = node[1] ?? nextNode;
    if (next === null)
      parts.push(`if(l===${this.getIndex()})return true;`);
    else
      this.load(next, null);

    if (closeBracket)
      parts.push('}');
  }

  public build(): any {
    console.log(`${this.dependencies.join('')}return (p)=>{const l=p.length;${this.parts.join('')}return false;}`);
    return Function(`${this.dependencies.join('')}return (p)=>{const l=p.length;${this.parts.join('')}return false;}`)();
  }
}

export type Matcher = (path: string) => boolean;

export function createMatcher(pattern: string): Matcher {
  const builder = new MatcherBuilder();
  builder.load(createAST(pattern), null);
  return builder.build();
}
