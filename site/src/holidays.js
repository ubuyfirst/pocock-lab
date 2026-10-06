// Holiday report: each city's rides across a Holiday window, compared with
// its Normal days. Terms (Holiday window, Normal range, ...) are in GLOSSARY.md.
import { weekdayName } from "./stats.js";

// The only Holidays the dashboard reports on; no other date is a Holiday.
export const HOLIDAYS = [
  { name: "July 4th", date: "2026-07-04" },
  { name: "Labor Day", date: "2026-09-07" },
];

const POSITIONS = ["before", "holiday", "after"];

// One entry per Holiday: each city's rides on each date of its Holiday window,
// against that city's Normal range and Normal average for the same weekday,
// plus the sorted names of every city with a row in the window.
export function holidayReport(rows, holidays) {
  const windows = holidays.map((holiday) => holidayWindow(holiday.date));
  const normalRides = ridesOnNormalDays(rows, new Set(windows.flat()));
  return holidays.map((holiday, windowIndex) => {
    const days = windows[windowIndex].map((date, i) => ({
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
      cities: [...new Set(days.flatMap((day) => day.cities.map((c) => c.city)))].sort(),
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

function compareWithNormal(city, rides, sameWeekdayRides = []) {
  if (sameWeekdayRides.length === 0) {
    return { city, rides, normalLow: null, normalHigh: null, normalAverage: null, percentVsNormal: null, unusual: false };
  }
  const normalLow = Math.min(...sameWeekdayRides);
  const normalHigh = Math.max(...sameWeekdayRides);
  const normalAverage = sameWeekdayRides.reduce((sum, r) => sum + r, 0) / sameWeekdayRides.length;
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Plain-English findings from holidayReport's output, one sentence per entry.
export function holidaySummary(report) {
  const sentences = [];
  for (const holiday of report) {
    const [first, , last] = holiday.days;
    const windowText = `the ${holiday.name} window (${longDate(first)} to ${longDate(last)})`;
    sentences.push(
      holiday.percentVsNormal === null
        ? `There were no Normal days to compare ${windowText} with.`
        : `Across ${windowText}, rides were ${percentPhrase(holiday.percentVsNormal)} for those days of the week.`,
    );
    const unusual = holiday.days.flatMap((day) =>
      day.cities.filter((c) => c.unusual).map((c) => unusualDaySentence(holiday, day, c)),
    );
    sentences.push(...(unusual.length > 0 ? unusual : [`No city had an Unusual day around ${holiday.name}.`]));
  }
  const cityDays = report.flatMap((holiday) => holiday.days.flatMap((day) => day.cities));
  const unusualCount = cityDays.filter((c) => c.unusual).length;
  sentences.push(
    `Overall, ${unusualCount} of ${cityDays.length} city-days in the Holiday windows ` +
      (unusualCount === 1 ? "was an Unusual day." : "were Unusual days."),
  );
  return sentences;
}

// "3% above the Normal average", rounded to a whole percent.
function percentPhrase(percentVsNormal) {
  const percent = Math.round(percentVsNormal);
  if (percent === 0) return "in line with the Normal average";
  return `${Math.abs(percent)}% ${percent > 0 ? "above" : "below"} the Normal average`;
}

function unusualDaySentence(holiday, day, c) {
  const when = {
    before: `the day before ${holiday.name}`,
    holiday: `${holiday.name} itself`,
    after: `the day after ${holiday.name}`,
  }[day.position];
  return (
    `${c.city} had an Unusual day on ${longDate(day)}, ${when}: ${c.rides} rides, ` +
    `${c.rides > c.normalHigh ? "above" : "below"} its ${day.weekday} Normal range of ${c.normalLow}–${c.normalHigh}.`
  );
}

// "Tuesday, July 14", read straight from the YYYY-MM-DD date.
function longDate(day) {
  const [, month, date] = day.date.split("-").map(Number);
  return `${day.weekday}, ${MONTHS[month - 1]} ${date}`;
}
