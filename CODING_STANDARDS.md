# Coding standards

Read by `/code-review` on the Standards axis. The base rules are the Conventions in `CLAUDE.md`; this file says how to judge them in a diff.

## Pages only display

A page's inline script may fetch data, call `site/src` functions, format values for display (`toLocaleString`, date labels) and build DOM. Anything that derives a number or a decision from the data is **computation** and belongs in a `site/src` module with a test. Computation in a page is a hard violation, even when a ticket or spec placed it there: the ticket was wrong, and the finding says so.

Computation, for this rule:

- arithmetic on data values: sums, averages, percentages, ratios, bar widths and other chart geometry
- filtering, grouping, sorting or de-duplicating rows
- deciding a label or flag from data (for example "Unusual day")

Example: `site/index.html` once sized bars with `(value / max) * 100` inline. That is chart geometry, and it now lives in `barWidths` in `site/src/bars.js`, with its 0-when-max-is-0 edge case under test.

## Edge cases at the seam

A `site/src` function handles empty input and all-zero input, and has a test for each when the page can reach that case. A page never shows `NaN`, `Infinity` or `undefined`.

## Domain language

Names, headings and copy use the terms in `GLOSSARY.md` and none of the terms it lists under _Avoid_.

## Docs track the layout

A diff that adds a page or a `site/src` module also updates the Layout table in `README.md`. `CLAUDE.md` names files by glob, so it only changes when a new kind of file appears.
