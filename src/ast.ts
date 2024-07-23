export const enum NodeType {
  GROUP,
  WILDCARD,
  CHAR_RANGE,
  CHARSET,
  ANY_CHAR,
  STATIC,
  ROOT
}

/* eslint-disable */
interface BasicNode {
  // Node ID and also priority
  0: NodeType;

  // Next node
  1: GenericNode | null;
}

export interface GroupNode extends BasicNode {
  0: NodeType.GROUP;

  // Multiple node
  2: GenericNode[];
}

export interface WildcardNode extends BasicNode {
  0: NodeType.WILDCARD;

  // Is globstart
  2: boolean;
}

export interface CharRangeNode extends BasicNode {
  0: NodeType.CHAR_RANGE;

  // Char code start
  2: number;

  // Char code end
  3: number;

  // Negate
  4: boolean;
}

export interface CharsetNode extends BasicNode {
  0: NodeType.CHARSET;

  // All chars
  2: string;

  // Negate
  3: boolean;
}

export interface AnyCharNode extends BasicNode {
  0: NodeType.ANY_CHAR;
}

export interface StaticNode extends BasicNode {
  0: NodeType.STATIC;

  // List of char codes
  2: string;
}

export interface RootNode extends BasicNode {
  0: NodeType.ROOT;
}

export type GenericNode =
  | WildcardNode | CharRangeNode | GroupNode
  | CharsetNode | AnyCharNode | StaticNode | RootNode;

export function loadAST(node: GenericNode, pattern: string) {
  for (let idx = 0, { length } = pattern; idx < length;) {
    switch (pattern.charCodeAt(idx)) {
      // Star
      case 42: {
        const isGlobstar = pattern.charCodeAt(idx + 1) === 42;

        const next: WildcardNode = [NodeType.WILDCARD, null, isGlobstar];
        node[1] = next;
        node = next;

        idx += 1 + +isGlobstar;
        continue;
      }

      // Question mark
      case 63: {
        const next: AnyCharNode = [NodeType.ANY_CHAR, null];
        node[1] = next;
        node = next;

        ++idx;
        continue;
      }

      // Bracket [
      case 91: {
        const isNegate = pattern.charCodeAt(idx + 1) === 33;
        idx += isNegate ? 1 : 0;

        // Range node
        if (pattern.charCodeAt(idx + 2) === 45) {
          const next: CharRangeNode = [
            NodeType.CHAR_RANGE, null,
            pattern.charCodeAt(idx + 1), pattern.charCodeAt(idx + 3),
            isNegate
          ];

          node[1] = next;
          node = next;

          // Skip to after ]
          idx += 5;
        } else {
          const endIdx = pattern.indexOf(']', idx);
          const next: CharsetNode = [
            NodeType.CHARSET, null,
            pattern.substring(idx + 1, endIdx), isNegate
          ];

          // Bind the end character
          node[1] = next;
          node = next;

          // Skip to after ]
          idx = endIdx + 1;
        }

        continue;
      }

      // Bracket {
      case 123: {
        const endIdx = pattern.indexOf('}', ++idx);

        const next: GroupNode = [
          NodeType.GROUP,
          null,
          pattern.substring(idx, endIdx).split(',').map(createAST)
        ];
        node[1] = next;
        node = next;

        // Skip to after }
        idx = endIdx + 1;
        continue;
      }

      default:
        switch (node[0]) {
          case NodeType.STATIC:
            node[2] += pattern[idx];
            break;

          default: {
            const next: StaticNode = [NodeType.STATIC, null, pattern[idx]];
            node[1] = next;
            node = next;
            break;
          }
        }

        ++idx;
        continue;
    }
  }
}

export function createAST(pattern: string): GenericNode {
  const root: RootNode = [NodeType.ROOT, null];
  loadAST(root, pattern);

  if (root[1] === null) throw new Error('Pattern is empty!');
  return root[1];
}
