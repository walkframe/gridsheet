/**
 * Minimal, dependency-free XML reader/writer scoped to the OOXML parts we touch
 * (workbook, worksheet, sharedStrings, relationships, content-types).
 *
 * This is deliberately NOT a general XML parser. It relies on two properties of
 * OOXML that always hold: text content never contains a raw `<` (it is escaped
 * as &lt;), so a `<` always starts a tag; and attribute values are quoted, so a
 * `>` inside a quoted attribute does not end the tag. Namespaces are kept as-is
 * on attributes and matched by local name on elements.
 */

export type XmlNode = {
  /** Tag name including any namespace prefix (e.g. "r:id" stays "r:id"). */
  tag: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  /** Concatenated direct text content (already entity-decoded). */
  text: string;
};

/** Strip a namespace prefix: "r:id" → "id", "sheetData" → "sheetData". */
export const local = (tag: string): string => {
  const i = tag.indexOf(':');
  return i < 0 ? tag : tag.slice(i + 1);
};

/** First direct child element matching `tag` by local name. */
export const child = (node: XmlNode | undefined, tag: string): XmlNode | undefined =>
  node?.children.find((c) => local(c.tag) === tag);

/** All direct child elements matching `tag` by local name. */
export const children = (node: XmlNode | undefined, tag: string): XmlNode[] =>
  node ? node.children.filter((c) => local(c.tag) === tag) : [];

/** Concatenate the text of every descendant <t> element (shared-string runs). */
export const gatherText = (node: XmlNode): string => {
  let out = local(node.tag) === 't' ? node.text : '';
  for (const c of node.children) {
    out += gatherText(c);
  }
  return out;
};

export const decodeEntities = (s: string): string => {
  if (s.indexOf('&') < 0) {
    return s;
  }
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, ent: string) => {
    if (ent[0] === '#') {
      const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isNaN(code) ? whole : String.fromCodePoint(code);
    }
    switch (ent) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      case 'apos':
        return "'";
      default:
        return whole;
    }
  });
};

/** Escape text content for XML (& < >). */
export const escapeXml = (s: string): string =>
  s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));

/** Escape an attribute value (& < > "). */
export const escapeAttr = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'));

const parseTag = (body: string): { tag: string; attrs: Record<string, string> } => {
  let k = 0;
  while (k < body.length && !/\s/.test(body[k])) {
    k++;
  }
  const tag = body.slice(0, k);
  const attrs: Record<string, string> = {};
  const attrStr = body.slice(k);
  const re = /([^\s=]+)\s*=\s*"([^"]*)"|([^\s=]+)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr)) !== null) {
    const key = m[1] ?? m[3];
    const val = m[2] ?? m[4] ?? '';
    attrs[key] = decodeEntities(val);
  }
  return { tag, attrs };
};

/**
 * Parse an XML string into a node tree, returning the root element.
 * Declarations, comments, and DOCTYPE are skipped; CDATA is kept as text.
 */
export const parseXml = (input: string): XmlNode => {
  const root: XmlNode = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];
  const n = input.length;
  let i = 0;

  while (i < n) {
    if (input[i] === '<') {
      if (input.startsWith('<?', i)) {
        const end = input.indexOf('?>', i);
        i = end < 0 ? n : end + 2;
        continue;
      }
      if (input.startsWith('<!--', i)) {
        const end = input.indexOf('-->', i);
        i = end < 0 ? n : end + 3;
        continue;
      }
      if (input.startsWith('<![CDATA[', i)) {
        const end = input.indexOf(']]>', i);
        stack[stack.length - 1].text += input.slice(i + 9, end < 0 ? n : end);
        i = end < 0 ? n : end + 3;
        continue;
      }
      if (input.startsWith('<!', i)) {
        const end = input.indexOf('>', i);
        i = end < 0 ? n : end + 1;
        continue;
      }
      if (input[i + 1] === '/') {
        const end = input.indexOf('>', i);
        if (stack.length > 1) {
          stack.pop();
        }
        i = end < 0 ? n : end + 1;
        continue;
      }
      // Opening (or self-closing) tag. Scan to the closing '>' while respecting quotes.
      let j = i + 1;
      let quote = '';
      while (j < n) {
        const c = input[j];
        if (quote) {
          if (c === quote) {
            quote = '';
          }
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === '>') {
          break;
        }
        j++;
      }
      const raw = input.slice(i + 1, j);
      const selfClose = raw.endsWith('/');
      const { tag, attrs } = parseTag(selfClose ? raw.slice(0, -1) : raw);
      const node: XmlNode = { tag, attrs, children: [], text: '' };
      stack[stack.length - 1].children.push(node);
      if (!selfClose) {
        stack.push(node);
      }
      i = j + 1;
    } else {
      const next = input.indexOf('<', i);
      const end = next < 0 ? n : next;
      stack[stack.length - 1].text += decodeEntities(input.slice(i, end));
      i = end;
    }
  }

  return root.children[0] ?? root;
};
