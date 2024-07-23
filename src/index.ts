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
  public defineIndexTracker(): void {
    if (this.hasIdx) {
      if (this.idx !== 0) {
        // Increment to reset later
        this.parts.push(`k+=${this.idx};`);
        this.idx = 0;
      }
    } else {
      this.parts.push(`let k=${this.idx};`);
      this.hasIdx = true;
      this.idx = 0;
    }
  }

  public defineIndexBacktrack(): number {
    const { previousTrackerCount } = this;
    this.parts.push(`let t${previousTrackerCount}=k;`);
    ++this.previousTrackerCount;

    return previousTrackerCount;
  }

  public load(node: GenericNode): void {
    const { dependencies, parts } = this;
    const nextNode = node[1];

    switch (node[0]) {
      case NodeType.WILDCARD:

        if (nextNode === null) {
          if (node[2]) parts.push('return true;');
          else parts.push(`if(p.indexOf('/',${this.getIndex()})===-1)return true;`);
        } else {
          parts.push('{');

          this.defineIndexTracker();
          const trackerID = this.defineIndexBacktrack();

          parts.push(`while(k<l${node[2] ? '' : '&&p.charCodeAt(k)!==47'}){`);
          this.load(nextNode);
          parts.push(`k=++t${trackerID};}}`);
        }

        return;

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

      case NodeType.GROUP:
        break;
    }

    // Handle next node
    if (nextNode === null)
      parts.push(`if(l===${this.getIndex()})return true;`);
    else
      this.load(nextNode);
  }

  public build(): any {
    return Function(`${this.dependencies.join('')}return (p)=>{const l=p.length;${this.parts.join('')}return false;}`)();
  }
}

export type Matcher = (path: string) => boolean;

export function createMatcher(pattern: string): Matcher {
  const builder = new MatcherBuilder();
  builder.load(createAST(pattern));
  return builder.build();
}
