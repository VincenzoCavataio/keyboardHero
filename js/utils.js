/**
 * Converte un colore HEX (#rrggbb) in stringa "r,g,b"
 */
export function hexToRgb(hex) {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((h) => parseInt(h, 16));
  return `${r},${g},${b}`;
}
