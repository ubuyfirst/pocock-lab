// Bar chart geometry for items: [{ label, value }, ...].

// Each item with a percent width (0-100) against the largest value; 0 when
// nothing is above zero, so an empty chart never divides by zero.
export function barWidths(items) {
  const max = Math.max(0, ...items.map((d) => d.value));
  return items.map((d) => ({ ...d, percent: max > 0 ? (d.value / max) * 100 : 0 }));
}
