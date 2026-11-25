// Non-cryptographic content-change fingerprint.
// Used only for curated SEO freshness checks.

export function contentFingerprint(value) {
  const text = String(value || "");

  let first = 0x811c9dc5;
  let second = 0x9e3779b9;

  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);

    first = Math.imul(
      first ^ code,
      0x01000193
    );

    second = Math.imul(
      second ^ code,
      0x85ebca6b
    );

    second ^= second >>> 13;
  }

  const hex = number =>
    (number >>> 0)
      .toString(16)
      .padStart(8, "0");

  return `${text.length}:${hex(first)}${hex(second)}`;
}
