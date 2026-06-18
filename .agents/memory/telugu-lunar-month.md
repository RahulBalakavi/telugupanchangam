---
name: Telugu lunar month & adhika masa calculation
description: How the Amanta Telugu month name and intercalary leap month (adhika masa) are computed astronomically
---

# Telugu month naming (Amanta system)

A lunar month runs new moon -> next new moon. It is named after the rashi (zodiac sign)
the Sun *enters* (sankranti) during that month.

- `monthIndex = (sunSiderealRashiAtStart + 1) % 12`, where Chaitra (0) ↔ Mesha sankranti.
- Sidereal rashi = (Sun tropical ecliptic longitude − Lahiri ayanamsa) / 30, floored.

# Adhika masa (intercalary leap month)

**Rule:** if a lunar month contains NO sankranti (Sun stays in the same rashi for the whole
month), it is an "Adhika" month and shares the name of the *following* Nija (regular) month.

**Detection:** sample the Sun's rashi just inside both new-moon boundaries; if `rashiAtStart === rashiAtEnd`, no sankranti occurred → adhika. (A lunar month ~29.5d < solar month ~30-31d, so this fits entirely inside one rashi.)

**Why:** the old code counted months sequentially from a Chaitra anchor with `% 12`, which
silently skips adhika masa and shifts every later month forward by one (e.g. 2026 showed
Ashadha when it was actually Nija Jyeshtha because Adhika Jyeshtha was not detected).

**How to apply:** any month-name logic must derive from sankranti, never from a fixed
month-count offset. Verified against real 2026 calendar: Adhika Jyeshtha ~May 17–Jun 15,
Nija Jyeshtha Jun 16–Jul 14, Ashadha from ~Jul 15.

# Samvatsara (60-year cycle)

Anchored so 2025 (post-Ugadi) = Vishvavasu (index 38); `index = (samvatsaraYear - 1987) % 60`,
where samvatsaraYear is the prior Gregorian year if the date is before ~Mar 20 (Ugadi).
2026 = Parabhava.
