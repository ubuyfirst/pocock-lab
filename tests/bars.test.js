import { test } from "node:test";
import assert from "node:assert/strict";
import { barWidths } from "../site/src/bars.js";

test("barWidths sizes each bar as a percent of the largest value", () => {
  assert.deepEqual(
    barWidths([
      { label: "Boston", value: 50 },
      { label: "Miami", value: 25 },
    ]),
    [
      { label: "Boston", value: 50, percent: 100 },
      { label: "Miami", value: 25, percent: 50 },
    ],
  );
});

test("barWidths gives every bar 0% when all values are 0, never NaN", () => {
  assert.deepEqual(barWidths([{ label: "Monday", value: 0 }, { label: "Tuesday", value: 0 }]), [
    { label: "Monday", value: 0, percent: 0 },
    { label: "Tuesday", value: 0, percent: 0 },
  ]);
});

test("barWidths returns an empty list for no items", () => {
  assert.deepEqual(barWidths([]), []);
});
