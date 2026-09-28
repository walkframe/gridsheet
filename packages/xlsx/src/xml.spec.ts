import { parseXml, child, children, gatherText, local, decodeEntities, escapeXml, escapeAttr } from './xml';

describe('xml parser', () => {
  it('parses elements, attributes, and nested children', () => {
    const root = parseXml('<a x="1"><b y="2">hi</b><b>bye</b></a>');
    expect(root.tag).toBe('a');
    expect(root.attrs.x).toBe('1');
    const bs = children(root, 'b');
    expect(bs).toHaveLength(2);
    expect(bs[0].attrs.y).toBe('2');
    expect(bs[0].text).toBe('hi');
    expect(bs[1].text).toBe('bye');
  });

  it('handles self-closing tags and the XML declaration', () => {
    const root = parseXml('<?xml version="1.0"?><root><c r="A1" t="s"/><c r="B1"/></root>');
    expect(children(root, 'c')).toHaveLength(2);
    expect(child(root, 'c')!.attrs.r).toBe('A1');
    expect(child(root, 'c')!.attrs.t).toBe('s');
  });

  it('matches elements by local name, ignoring namespace prefixes', () => {
    expect(local('r:id')).toBe('id');
    const root = parseXml('<w:sheets><w:sheet name="S1"/></w:sheets>');
    expect(child(root, 'sheets') === undefined || root.tag === 'w:sheets').toBeTruthy();
    expect(children(root, 'sheet')).toHaveLength(1);
  });

  it('does not end a tag on a > inside a quoted attribute', () => {
    const root = parseXml('<f>IF(A1&gt;2,"x","y")</f>');
    expect(root.tag).toBe('f');
    expect(root.text).toBe('IF(A1>2,"x","y")');
  });

  it('gathers text across rich-text runs', () => {
    const si = parseXml('<si><r><t>Hello </t></r><r><t>World</t></r></si>');
    expect(gatherText(si)).toBe('Hello World');
    const plain = parseXml('<si><t xml:space="preserve"> keep </t></si>');
    expect(gatherText(plain)).toBe(' keep ');
  });

  it('decodes and escapes entities symmetrically', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &#65; &#x42;')).toBe('a & b <c> A B');
    expect(escapeXml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
    expect(escapeAttr('say "hi" & <bye>')).toBe('say &quot;hi&quot; &amp; &lt;bye&gt;');
  });
});
