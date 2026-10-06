import { test } from "node:test";
import assert from "node:assert/strict";
import { holidayReport } from "../site/src/holidays.js";

// 2026-07-15 is a Wednesday, so its Holiday window runs Tuesday to Thursday.
const testDay = { name: "Test Day", date: "2026-07-15" };

test("holidayReport covers the day before, the Holiday and the day after, with null figures where a city has no Normal days", () => {
  const rows = [
    { date: "2026-07-14", city: "Boston", rides: "100" },
    { date: "2026-07-15", city: "Boston", rides: 90 },
    { date: "2026-07-16", city: "Boston", rides: "80" },
  ];
  const noNormalDays = { normalLow: null, normalHigh: null, normalAverage: null, percentVsNormal: null, unusual: false };
  assert.deepEqual(holidayReport(rows, [testDay]), [
    {
      name: "Test Day",
      date: "2026-07-15",
      weekday: "Wednesday",
      percentVsNormal: null,
      days: [
        { date: "2026-07-14", weekday: "Tuesday", position: "before", cities: [{ city: "Boston", rides: 100, ...noNormalDays }] },
        { date: "2026-07-15", weekday: "Wednesday", position: "holiday", cities: [{ city: "Boston", rides: 90, ...noNormalDays }] },
        { date: "2026-07-16", weekday: "Thursday", position: "after", cities: [{ city: "Boston", rides: 80, ...noNormalDays }] },
      ],
    },
  ]);
});

test("holidayReport compares each city-day with its Normal range and Normal average for that weekday", () => {
  const rows = [
    // Normal Tuesdays: range 50-70, average 60.
    { date: "2026-07-07", city: "Boston", rides: "50" },
    { date: "2026-07-21", city: "Boston", rides: 70 },
    // Normal Wednesdays: range 80-120, average 100.
    { date: "2026-07-01", city: "Boston", rides: 80 },
    { date: "2026-07-08", city: "Boston", rides: "120" },
    { date: "2026-07-22", city: "Boston", rides: 100 },
    // The Holiday window.
    { date: "2026-07-14", city: "Boston", rides: 75 },
    { date: "2026-07-15", city: "Boston", rides: "90" },
    { date: "2026-07-16", city: "Boston", rides: 80 },
  ];
  const [report] = holidayReport(rows, [testDay]);
  assert.deepEqual(
    report.days.map((day) => day.cities),
    [
      // 75 is 25% above 60, and above the 50-70 range.
      [{ city: "Boston", rides: 75, normalLow: 50, normalHigh: 70, normalAverage: 60, percentVsNormal: 25, unusual: true }],
      // 90 is 10% below 100, inside the 80-120 range.
      [{ city: "Boston", rides: 90, normalLow: 80, normalHigh: 120, normalAverage: 100, percentVsNormal: -10, unusual: false }],
      // No Normal Thursdays.
      [{ city: "Boston", rides: 80, normalLow: null, normalHigh: null, normalAverage: null, percentVsNormal: null, unusual: false }],
    ],
  );
  // (75 + 90) against (60 + 100), leaving out Thursday: 165 / 160 is 3.125% above.
  assert.equal(report.percentVsNormal, 3.125);
});

test("holidayReport sorts cities by name and treats the ends of the Normal range as normal", () => {
  const rows = [
    // Normal Wednesdays: Miami 100-300 (average 200), Boston 80-120 (average 100).
    { date: "2026-07-01", city: "Miami", rides: 100 },
    { date: "2026-07-08", city: "Miami", rides: 300 },
    { date: "2026-07-01", city: "Boston", rides: 80 },
    { date: "2026-07-08", city: "Boston", rides: 120 },
    // On the Holiday Miami sits on its low end and Boston on its high end.
    { date: "2026-07-15", city: "Miami", rides: 100 },
    { date: "2026-07-15", city: "Boston", rides: 120 },
  ];
  const [report] = holidayReport(rows, [testDay]);
  assert.deepEqual(report.days[1].cities, [
    { city: "Boston", rides: 120, normalLow: 80, normalHigh: 120, normalAverage: 100, percentVsNormal: 20, unusual: false },
    { city: "Miami", rides: 100, normalLow: 100, normalHigh: 300, normalAverage: 200, percentVsNormal: -50, unusual: false },
  ]);
});

test("holidayReport leaves every Holiday window out of the Normal days, not only the Holiday's own", () => {
  // 2026-07-29 is another Wednesday Holiday, so its busy 500 is not a Normal day.
  const otherDay = { name: "Other Day", date: "2026-07-29" };
  const rows = [
    { date: "2026-07-01", city: "Boston", rides: 100 },
    { date: "2026-07-08", city: "Boston", rides: 100 },
    { date: "2026-07-29", city: "Boston", rides: 500 },
    { date: "2026-07-15", city: "Boston", rides: 110 },
  ];
  const [report] = holidayReport(rows, [testDay, otherDay]);
  assert.deepEqual(report.days[1].cities, [
    { city: "Boston", rides: 110, normalLow: 100, normalHigh: 100, normalAverage: 100, percentVsNormal: 10, unusual: true },
  ]);
});
