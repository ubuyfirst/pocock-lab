// Holiday report: each city's rides across a Holiday window, compared with
// its Normal days. Terms (Holiday window, Normal range, ...) are in GLOSSARY.md.
import { weekdayName } from "./stats.js";

// The only Holidays the dashboard reports on; every other date is a normal date.
export const HOLIDAYS = [
  { name: "July 4th", date: "2026-07-04" },
  { name: "Labor Day", date: "2026-09-07" },
];

const POSITIONS = ["before", "holiday", "after"];

// One entry per Holiday: each city's rides on each date of its Holiday window,
// against that city's Normal range and Normal average for the same weekday.
export function holidayReport(rows, holidays) {
  const windows = holidays.map((holiday) => holidayWindow(holiday.date));
  const normalRides = ridesOnNormalDays(rows, new Set(windows.flat()));
  return holidays.map((holiday, h) => {
    const days = windows[h].map((date, i) => ({
      date,
      weekday: weekdayName(date),
      position: POSITIONS[i],
      cities: rows
        .filter((row) => row.date === date)
        .map((row) =>
          compareWithNormal(row.city, Number(row.rides), normalRides.get(normalKey(row.city, date))),
        )
        .sort((a, b) => a.city.localeCompare(b.city)),
    }));
    return {
      name: holiday.name,
      date: holiday.date,
      weekday: weekdayName(holiday.date),
      percentVsNormal: windowPercentVsNormal(days),
      days,
    };
  });
}

// Rides on Normal days, grouped by city and weekday.
function ridesOnNormalDays(rows, windowDates) {
  const normalRides = new Map();
  for (const row of rows) {
    if (windowDates.has(row.date)) continue;
    const key = normalKey(row.city, row.date);
    if (!normalRides.has(key)) normalRides.set(key, []);
    normalRides.get(key).push(Number(row.rides));
  }
  return normalRides;
}

function normalKey(city, date) {
  return `${city}|${weekdayName(date)}`;
}

function compareWithNormal(city, rides, normalRides = []) {
  if (normalRides.length === 0) {
    return { city, rides, normalLow: null, normalHigh: null, normalAverage: null, percentVsNormal: null, unusual: false };
  }
  const normalLow = Math.min(...normalRides);
  const normalHigh = Math.max(...normalRides);
  const normalAverage = normalRides.reduce((sum, r) => sum + r, 0) / normalRides.length;
  return {
    city,
    rides,
    normalLow,
    normalHigh,
    normalAverage,
    percentVsNormal: percentDifference(rides, normalAverage),
    unusual: rides < normalLow || rides > normalHigh,
  };
}

// The window's total rides against the total of their Normal averages,
// over the city-days that have a Normal average; null if none do.
function windowPercentVsNormal(days) {
  const compared = days.flatMap((day) => day.cities).filter((c) => c.normalAverage !== null);
  if (compared.length === 0) return null;
  const rides = compared.reduce((sum, c) => sum + c.rides, 0);
  const normal = compared.reduce((sum, c) => sum + c.normalAverage, 0);
  return percentDifference(rides, normal);
}

function percentDifference(value, base) {
  return ((value - base) / base) * 100;
}

// The day before, the Holiday and the day after, as YYYY-MM-DD dates.
function holidayWindow(date) {
  return [-1, 0, 1].map((offset) => {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  });
}
