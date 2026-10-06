# Rides dashboard

Daily ride counts for a set of cities, and the patterns found in them.

## Language

**Holiday**:
A public holiday on which riding may differ from normal, identified by its actual calendar date.
_Avoid_: Observed holiday, day off

**Holiday window**:
The three dates around a Holiday: the day before, the Holiday itself, and the day after.
_Avoid_: Holiday weekend, holiday period

**Normal day**:
A date that falls outside every Holiday window.
_Avoid_: Regular day, ordinary day

**Normal range**:
The lowest to highest ride count a city had on Normal days that share a given day of the week.
_Avoid_: Typical range, band

**Normal average**:
The mean ride count a city had on Normal days that share a given day of the week.
_Avoid_: Baseline, typical day, expected rides

**Unusual day**:
A date in a Holiday window where a city's rides fall outside its Normal range for that day of the week.
_Avoid_: Anomaly, outlier, spike
