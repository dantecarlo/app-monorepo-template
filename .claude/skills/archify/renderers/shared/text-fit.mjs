// Single-line node text fitting, shared by every renderer.
//
// Node text (`label`, `sublabel`, `tag`) renders as one <text> element with
// text-anchor="middle" and is never wrapped. Left unmeasured, an over-long
// value silently spills across its neighbours while validation still reports
// a clean receipt — the failure mode this module exists to close.
//
// Two halves, always used together:
//   - fittedNodeFontSize shrinks the text toward a legible minimum at render
//     time, so ordinary overruns simply get smaller instead of overlapping.
//   - minimumNodeTextWidth reports the width the text still needs once it has
//     shrunk as far as it may, so validation can reject what shrinking cannot
//     save.
//
// The geometry constants below are shared; the per-field `preferred` and
// `minimum` font sizes are not, because renderers set node text at different
// sizes (architecture sublabels are 9px, the rest are 7px).
//
// The node `label` is fitted differently from `sublabel` and `tag`: it shares
// the top rail with the semantic sigil (one top corner) and, when present, the
// brand mark (the other). Because the label is centered, clearing a corner
// mark on one side costs the same room on the other, so the rail reservation
// is symmetric.

import { semanticSigilBox, textUnits } from './utils.mjs';

// widthFactor: px of advance width per text unit, per px of font size.
// horizontalPadding: total px reserved inside the box so text never touches
// the border.
// sigilGap: clear px kept between the label and the semantic sigil box.
// brandMarkSide: px per side the brand mark rail reserves (badge drawn 22px
// in from the right edge, plus a 2px gap).
export const nodeTextFit = {
  widthFactor: 0.6,
  horizontalPadding: 8,
  sigilGap: 4,
  brandMarkSide: 24,
};

function fittedFontSize(text, available, preferred, minimum) {
  const units = Math.max(1, textUnits(text));
  const fitted = Math.min(preferred, Math.max(1, available) / (units * nodeTextFit.widthFactor));
  return Math.max(minimum, Math.floor(fitted * 10) / 10);
}

// Largest font size at or below `preferred` that fits `text` inside `width`,
// floored at `minimum` — below that the text is no longer legible and the
// caller should be reporting a problem instead.
export function fittedNodeFontSize(text, width, preferred, minimum) {
  return fittedFontSize(text, width - nodeTextFit.horizontalPadding, preferred, minimum);
}

// Total horizontal px a centered node label must leave free on its rail: the
// sigil box plus its gap on each side (6 + 11 + 4 = 21 → 42px), or the brand
// mark rail when the node carries one (24 → 48px) — whichever is stricter,
// never both. The reservation already exceeds `horizontalPadding`.
export function nodeLabelRailReserve(hasBrand = false) {
  const sigilSide = semanticSigilBox.inset + semanticSigilBox.size + nodeTextFit.sigilGap;
  return 2 * Math.max(sigilSide, hasBrand ? nodeTextFit.brandMarkSide : 0);
}

// Px a node label may occupy inside a box of `width` without entering the
// sigil (or brand mark) rail.
export function availableNodeLabelWidth(width, hasBrand = false) {
  return width - nodeLabelRailReserve(hasBrand);
}

// Label counterpart of fittedNodeFontSize. `available` is the label room
// already net of the rail reservation (see availableNodeLabelWidth).
export function fittedNodeLabelFontSize(text, available, preferred, minimum) {
  return fittedFontSize(text, available, preferred, minimum);
}

// Smallest box width whose label rail fits `text` at its legible minimum.
export function requiredNodeLabelBoxWidth(text, minimum, hasBrand = false) {
  return Math.ceil(minimumNodeTextWidth(text, minimum) + nodeLabelRailReserve(hasBrand));
}

// Width `text` occupies at its legible minimum. Compare against
// `width - nodeTextFit.horizontalPadding` to decide whether shrink-to-fit can
// rescue it.
export function minimumNodeTextWidth(text, minimum) {
  return textUnits(text) * minimum * nodeTextFit.widthFactor;
}

// Available text width inside a box of `width`.
export function availableNodeTextWidth(width) {
  return width - nodeTextFit.horizontalPadding;
}
