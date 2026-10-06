import { test } from "node:test";
import assert from "node:assert/strict";
import { holidayReport, holidaySummary } from "../site/src/holidays.js";

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
      cities: ["Boston"],
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
    // Denver only has a row on the day after.
    { date: "2026-07-16", city: "Denver", rides: 60 },
  ];
  const [report] = holidayReport(rows, [testDay]);
  assert.deepEqual(report.cities, ["Boston", "Denver", "Miami"]);
  assert.deepEqual(report.days[1].cities, [
    { city: "Boston", rides: 120, normalLow: 80, normalHigh: 120, normalAverage: 100, percentVsNormal: 20, unusual: false },
    { city: "Miami", rides: 100, normalLow: 100, normalHigh: 300, normalAverage: 200, percentVsNormal: -50, unusual: false },
  ]);
});

test("holidayReport leaves every Holiday window out of the Normal days, not only the Holiday's own", () => {
  // Other Holidays put Wednesdays in their windows: the day before Thursday
  // 2026-07-23, the day after Tuesday 2026-07-28, and Wednesday 2026-08-05
  // itself. None of their busy 500s is a Normal day.
  const otherHolidays = [
    { name: "Thursday Holiday", date: "2026-07-23" },
    { name: "Tuesday Holiday", date: "2026-07-28" },
    { name: "Wednesday Holiday", date: "2026-08-05" },
  ];
  const rows = [
    { date: "2026-07-01", city: "Boston", rides: 100 },
    { date: "2026-07-08", city: "Boston", rides: 100 },
    { date: "2026-07-22", city: "Boston", rides: 500 },
    { date: "2026-07-29", city: "Boston", rides: 500 },
    { date: "2026-08-05", city: "Boston", rides: 500 },
    { date: "2026-07-15", city: "Boston", rides: 110 },
  ];
  const [report] = holidayReport(rows, [testDay, ...otherHolidays]);
  assert.deepEqual(report.days[1].cities, [
    { city: "Boston", rides: 110, normalLow: 100, normalHigh: 100, normalAverage: 100, percentVsNormal: 10, unusual: true },
  ]);
});

// A city-day as holidayReport returns it; the summary reads only these fields.
const cityDay = (city, rides, normalLow, normalHigh) => ({
  city,
  rides,
  normalLow,
  normalHigh,
  normalAverage: (normalLow + normalHigh) / 2,
  percentVsNormal: 0,
  unusual: rides < normalLow || rides > normalHigh,
});

// A Holiday as holidayReport returns it, with one list of city-days per date.
const reportedHoliday = (name, percentVsNormal, [before, holiday, after]) => ({
  name,
  date: "2026-07-15",
  weekday: "Wednesday",
  percentVsNormal,
  days: [
    { date: "2026-07-14", weekday: "Tuesday", position: "before", cities: before },
    { date: "2026-07-15", weekday: "Wednesday", position: "holiday", cities: holiday },
    { date: "2026-07-16", weekday: "Thursday", position: "after", cities: after },
  ],
});

test("holidaySummary describes a Holiday window with no Unusual days", () => {
  const report = [
    reportedHoliday("Test Day", -3.4, [
      [cityDay("Boston", 100, 90, 110)],
      [cityDay("Boston", 95, 90, 110)],
      [cityDay("Boston", 105, 90, 110)],
    ]),
  ];
  assert.deepEqual(holidaySummary(report), [
    "Across the Test Day window (Tuesday, July 14 to Thursday, July 16), rides were 3% below the Normal average for those days of the week.",
    "No city had an Unusual day around Test Day.",
    "Overall, 0 of 3 city-days in the Holiday windows were Unusual days.",
  ]);
});

test("holidaySummary names each Unusual day with its position, rides and Normal range", () => {
  const report = [
    reportedHoliday("Test Day", 12.6, [
      [cityDay("Boston", 80, 90, 110), cityDay("Miami", 100, 90, 110)],
      [cityDay("Boston", 120, 90, 110), cityDay("Miami", 100, 90, 110)],
      [cityDay("Boston", 100, 90, 110), cityDay("Miami", 115, 100, 112)],
    ]),
  ];
  assert.deepEqual(holidaySummary(report), [
    "Across the Test Day window (Tuesday, July 14 to Thursday, July 16), rides were 13% above the Normal average for those days of the week.",
    "Boston had an Unusual day on Tuesday, July 14, the day before Test Day: 80 rides, below its Tuesday Normal range of 90–110.",
    "Boston had an Unusual day on Wednesday, July 15, Test Day itself: 120 rides, above its Wednesday Normal range of 90–110.",
    "Miami had an Unusual day on Thursday, July 16, the day after Test Day: 115 rides, above its Thursday Normal range of 100–112.",
    "Overall, 3 of 6 city-days in the Holiday windows were Unusual days.",
  ]);
});

test("holidaySummary says 'in line with' when a window rounds to 0% and uses the singular for one Unusual day", () => {
  const report = [
    reportedHoliday("Test Day", 0.4, [[cityDay("Boston", 100, 90, 110)], [cityDay("Boston", 85, 90, 110)], []]),
    reportedHoliday("Other Day", -0.4, [[], [cityDay("Boston", 100, 90, 110)], []]),
  ];
  assert.deepEqual(holidaySummary(report), [
    "Across the Test Day window (Tuesday, July 14 to Thursday, July 16), rides were in line with the Normal average for those days of the week.",
    "Boston had an Unusual day on Wednesday, July 15, Test Day itself: 85 rides, below its Wednesday Normal range of 90–110.",
    "Across the Other Day window (Tuesday, July 14 to Thursday, July 16), rides were in line with the Normal average for those days of the week.",
    "No city had an Unusual day around Other Day.",
    "Overall, 1 of 3 city-days in the Holiday windows was an Unusual day.",
  ]);
});

test("holidaySummary says when a Holiday window has no Normal days to compare with", () => {
  const noNormalDays = { normalLow: null, normalHigh: null, normalAverage: null, percentVsNormal: null, unusual: false };
  const report = [reportedHoliday("Test Day", null, [[{ city: "Boston", rides: 100, ...noNormalDays }], [], []])];
  assert.deepEqual(holidaySummary(report), [
    "There were no Normal days to compare the Test Day window (Tuesday, July 14 to Thursday, July 16) with.",
    "No city had an Unusual day around Test Day.",
    "Overall, 0 of 1 city-days in the Holiday windows were Unusual days.",
  ]);
});
