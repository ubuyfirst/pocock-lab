import { test } from "node:test";
import assert from "node:assert/strict";
import { totalRides, ridesByCity, averageRidesByWeekday } from "../site/src/stats.js";

const rows = [
  { date: "2026-07-01", city: "Miami", rides: "10" },
  { date: "2026-07-01", city: "Boston", rides: "20" },
  { date: "2026-07-02", city: "Boston", rides: 30 },
];

test("totalRides sums the rides column", () => {
  assert.equal(totalRides(rows), 60);
});

test("ridesByCity totals per city in alphabetical order", () => {
  assert.deepEqual(ridesByCity(rows), [
    { city: "Boston", rides: 50 },
    { city: "Miami", rides: 10 },
  ]);
});

test("averageRidesByWeekday gives seven weekdays, Monday to Sunday, with 0 for days without rows", () => {
  assert.deepEqual(averageRidesByWeekday([]), [
    { weekday: "Monday", rides: 0 },
    { weekday: "Tuesday", rides: 0 },
    { weekday: "Wednesday", rides: 0 },
    { weekday: "Thursday", rides: 0 },
    { weekday: "Friday", rides: 0 },
    { weekday: "Saturday", rides: 0 },
    { weekday: "Sunday", rides: 0 },
  ]);
});

test("averageRidesByWeekday puts each date on its calendar weekday", () => {
  // 2026-07-01 is a Wednesday and 2026-07-04 is a Saturday.
  const result = averageRidesByWeekday([
    { date: "2026-07-01", city: "Boston", rides: "12" },
    { date: "2026-07-04", city: "Miami", rides: 30 },
  ]);
  assert.deepEqual(result, [
    { weekday: "Monday", rides: 0 },
    { weekday: "Tuesday", rides: 0 },
    { weekday: "Wednesday", rides: 12 },
    { weekday: "Thursday", rides: 0 },
    { weekday: "Friday", rides: 0 },
    { weekday: "Saturday", rides: 30 },
    { weekday: "Sunday", rides: 0 },
  ]);
});

test("averageRidesByWeekday averages over every city-day row, not combined daily totals", () => {
  // 2026-07-06 and 2026-07-13 are both Mondays: (10 + 20 + 60) / 3 = 30,
  // where averaging the daily totals would give (30 + 60) / 2 = 45.
  const result = averageRidesByWeekday([
    { date: "2026-07-06", city: "Boston", rides: "10" },
    { date: "2026-07-06", city: "Denver", rides: 20 },
    { date: "2026-07-13", city: "Boston", rides: "60" },
  ]);
  assert.deepEqual(result[0], { weekday: "Monday", rides: 30 });
});
