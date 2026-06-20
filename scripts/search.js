/**
 * Compiles a user-supplied regex pattern safely.
 * Returns null for empty input, the string 'invalid' for bad patterns,
 * or a RegExp on success. The 'invalid' sentinel lets callers distinguish
 * "nothing typed yet" from "typed something broken".
 */
export function compileRegex(input, caseInsensitive = true) {
  if (!input || !input.trim()) return null;
  try {
    return new RegExp(input, caseInsensitive ? 'i' : '');
  } catch {
    return 'invalid';
  }
}

/**
 * Highlights all matches of re in text using <mark> elements.
 * Matches against the original text, then HTML-escapes each segment
 * individually before assembling — so the regex works on raw text while
 * the output is safe to set as innerHTML.
 */
export function highlight(text, re) {
  const str = String(text);
  if (!re || re === 'invalid') return escapeHtml(str);

  const parts = [];
  // Force global flag so exec advances correctly through the string
  const g = new RegExp(re.source, re.flags.replace('g', '') + 'g');
  let last = 0;
  let m;

  while ((m = g.exec(str)) !== null) {
    parts.push(escapeHtml(str.slice(last, m.index)));
    parts.push(`<mark>${escapeHtml(m[0])}</mark>`);
    last = g.lastIndex;
    // Prevent infinite loop on zero-length matches (e.g. /a*/)
    if (m[0].length === 0) g.lastIndex++;
  }
  parts.push(escapeHtml(str.slice(last)));
  return parts.join('');
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
