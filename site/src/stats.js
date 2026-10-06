// Summaries of ride rows: [{ date, city, rides }, ...] with rides as strings or numbers.

export function totalRides(rows) {
  return rows.reduce((sum, row) => sum + Number(row.rides), 0);
}

// Total rides per city, sorted by city name.
export function ridesByCity(rows) {
  const totals = new Map();
  for (const row of rows) {
    totals.set(row.city, (totals.get(row.city) ?? 0) + Number(row.rides));
  }
  return [...totals.entries()]
    .map(([city, rides]) => ({ city, rides }))
    .sort((a, b) => a.city.localeCompare(b.city));
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Average rides per city-day for each day of the week, Monday to Sunday.
export function averageRidesByWeekday(rows) {
  const sums = WEEKDAYS.map(() => 0);
  const counts = WEEKDAYS.map(() => 0);
  for (const row of rows) {
    const i = weekdayIndex(row.date);
    sums[i] += Number(row.rides);
    counts[i] += 1;
  }
  return WEEKDAYS.map((weekday, i) => ({
    weekday,
    rides: counts[i] === 0 ? 0 : sums[i] / counts[i],
  }));
}

// 0 for Monday through 6 for Sunday. The YYYY-MM-DD date is read as UTC so
// the viewer's time zone can't shift it onto a neighbouring day.
function weekdayIndex(date) {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}
