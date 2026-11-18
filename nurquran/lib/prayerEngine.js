// Prayer-time engine: calculation methods, timezone-aware times, Qibla, Hijri.
// Everything runs on the device — no server needed.

export const METHODS = {
  UAE:       { name: "UAE General Authority",       short: "UAE Gov",    fajr: 18.2, isha: 18.2,
               tune: { Sunrise: -3, Zohr: 1, Asr: -1, Maghrib: 2, Isha: -1 } }, // matches official UAE timetable
  MAKKAH:    { name: "Umm al-Qura, Makkah",          short: "Umm al-Qura", fajr: 18.5, isha: "90" },
  KARACHI:   { name: "University of Islamic Sciences, Karachi", short: "Karachi", fajr: 18, isha: 18 },
  MWL:       { name: "Muslim World League",          short: "MWL",        fajr: 18, isha: 17 },
  EGYPT:     { name: "Egyptian General Authority",   short: "Egypt",      fajr: 19.5, isha: 17.5 },
  ISNA:      { name: "Islamic Society of North America", short: "ISNA",   fajr: 15, isha: 15 },
  GULF:      { name: "Gulf Region",                  short: "Gulf",       fajr: 19.5, isha: "90" },
  KUWAIT:    { name: "Kuwait",                       short: "Kuwait",     fajr: 18, isha: 17.5 },
  QATAR:     { name: "Qatar",                        short: "Qatar",      fajr: 18, isha: "90" },
  SINGAPORE: { name: "Singapore / Malaysia",         short: "JAKIM",      fajr: 20, isha: 18 },
  TURKEY:    { name: "Diyanet, Turkey",              short: "Diyanet",    fajr: 18, isha: 17 },
  FRANCE:    { name: "UOIF, France",                 short: "UOIF",       fajr: 12, isha: 12 },
  RUSSIA:    { name: "Spiritual Administration of Muslims of Russia", short: "Russia", fajr: 16, isha: 15 },
};

const COUNTRY_METHOD = {
  AE: "UAE", SA: "MAKKAH", BD: "KARACHI", PK: "KARACHI", IN: "KARACHI", AF: "KARACHI",
  EG: "EGYPT", SD: "EGYPT", LY: "EGYPT", US: "ISNA", CA: "ISNA", OM: "GULF", BH: "GULF", YE: "GULF",
  KW: "KUWAIT", QA: "QATAR", MY: "SINGAPORE", SG: "SINGAPORE", ID: "SINGAPORE", BN: "SINGAPORE",
  TR: "TURKEY", FR: "FRANCE", RU: "RUSSIA",
};
const HANAFI_COUNTRIES = ["BD", "PK", "IN", "AF"];

export const methodFor = (settings) =>
  settings.method && settings.method !== "auto" ? settings.method : COUNTRY_METHOD[settings.loc?.cc] || "MWL";
export const asrFor = (settings) =>
  settings.asr && settings.asr !== "auto" ? settings.asr : HANAFI_COUNTRIES.includes(settings.loc?.cc) ? 2 : 1;

export const PRAYERS = ["Fajr", "Sunrise", "Zohr", "Asr", "Maghrib", "Isha"];

/* ---------- math ---------- */
const D2R = Math.PI / 180;
const sin = (d) => Math.sin(d * D2R), cos = (d) => Math.cos(d * D2R), tan = (d) => Math.tan(d * D2R);
const asin = (x) => Math.asin(x) / D2R, acos = (x) => Math.acos(x) / D2R;
const atan2 = (y, x) => Math.atan2(y, x) / D2R, acot = (x) => Math.atan(1 / x) / D2R;
const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function sunPos(jd) {
  const D = jd - 2451545;
  const g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
  const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
  return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fix(RA, 24) };
}

/* ---------- timezone ---------- */
// Offset (hours) of an IANA zone at a given UTC instant.
export function tzOffset(tz, utcMs) {
  try {
    const p = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(new Date(utcMs)).forEach((x) => (p[x.type] = x.value));
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000) / 60;
  } catch (e) {
    return 0;
  }
}
// Wall-clock parts {y,m,d,h(decimal),dow} in a zone.
export function nowIn(tz, utcMs = Date.now()) {
  const local = new Date(utcMs + tzOffset(tz, utcMs) * 3600000);
  return {
    y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate(), dow: local.getUTCDay(),
    h: local.getUTCHours() + local.getUTCMinutes() / 60 + local.getUTCSeconds() / 3600,
  };
}
export function addDays({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() };
}

/* ---------- prayer times ---------- */
// Returns decimal local hours for {Fajr, Sunrise, Zohr, Asr, Maghrib, Isha}.
export function getTimes(date, settings) {
  const { lat, lng, tz } = settings.loc;
  const M = METHODS[methodFor(settings)];
  const asrF = asrFor(settings);
  const { y, m, d } = date;
  const tzH = tzOffset(tz, Date.UTC(y, m - 1, d, 12) - 0);
  const jd = julian(y, m, d) - lng / (15 * 24);
  const midDay = (t) => fix(12 - sunPos(jd + t).eqt, 24);
  const angleTime = (angle, t, before) => {
    const dec = sunPos(jd + t).decl;
    const v = acos((-sin(angle) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat))) / 15;
    return midDay(t) + (before ? -v : v);
  };
  const adj = tzH - lng / 15;
  const sunrise = angleTime(0.833, 6 / 24, true) + adj;
  const maghrib = angleTime(0.833, 18 / 24) + adj;
  const night = 24 - (maghrib - sunrise);
  let fajr = angleTime(M.fajr, 5 / 24, true) + adj;
  if (!isFinite(fajr)) fajr = sunrise - (night * M.fajr) / 60; // high latitude fallback
  let isha = typeof M.isha === "string" ? maghrib + +M.isha / 60 : angleTime(M.isha, 18 / 24) + adj;
  if (!isFinite(isha)) isha = maghrib + (night * M.isha) / 60;
  const dec = sunPos(jd + 13 / 24).decl;
  const asr = angleTime(-acot(asrF + tan(Math.abs(lat - dec))), 13 / 24) + adj;
  // round to the minute (+ safety minutes like most official timetables)
  const r = (h, plus = 0) => Math.round((h + plus / 60) * 60) / 60;
  const out = {
    Fajr: r(fajr), Sunrise: r(sunrise - 1 / 60), Zohr: r(midDay(12 / 24) + adj, 1),
    Asr: r(asr, 1), Maghrib: r(maghrib, 1), Isha: r(isha),
  };
  const tune = { ...(M.tune || {}), ...(settings.tune || {}) };
  Object.keys(tune).forEach((k) => { if (out[k] != null) out[k] += (tune[k] || 0) / 60; });
  return out;
}

export function fmtTime(h, pad = true) {
  const mins = Math.round(fix(h, 24) * 60) % 1440;
  const H = Math.floor(mins / 60), M = mins % 60, h12 = H % 12 || 12;
  return `${pad && h12 < 10 ? "0" : ""}${h12}:${M < 10 ? "0" : ""}${M} ${H >= 12 ? "PM" : "AM"}`;
}
export const fmtCountdown = (secs) =>
  `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m ${Math.floor(secs % 60)}s`;

/* Current / next prayer for the home header & countdowns */
export function getPrayerState(settings, utcMs = Date.now()) {
  const tz = settings.loc.tz;
  const now = nowIn(tz, utcMs);
  const t = getTimes(now, settings);
  const tt = getTimes(addDays(now, 1), settings);
  const order = ["Fajr", "Zohr", "Asr", "Maghrib", "Isha"];
  let next = order.find((p) => t[p] > now.h);
  const nextAt = next ? t[next] : tt.Fajr + 24;
  if (!next) next = "Fajr";
  let current, endAt, label;
  if (now.h < t.Fajr) { current = "Isha"; endAt = t.Fajr; label = "Isha ends in"; }
  else if (now.h < t.Sunrise) { current = "Fajr"; endAt = t.Sunrise; label = "Fajr ends in"; }
  else if (now.h < t.Zohr) { current = null; endAt = t.Zohr; label = "Zohr starts in"; }
  else if (now.h < t.Asr) { current = "Zohr"; endAt = t.Asr; label = "Zohr ends in"; }
  else if (now.h < t.Maghrib) { current = "Asr"; endAt = t.Maghrib; label = "Asr ends in"; }
  else if (now.h < t.Isha) { current = "Maghrib"; endAt = t.Isha; label = "Maghrib ends in"; }
  else { current = "Isha"; endAt = tt.Fajr + 24; label = "Isha ends in"; }
  const left = Math.max(0, Math.floor((endAt - now.h) * 3600));
  return { now, times: t, next, nextAt, nextTime: fmtTime(nextAt, false), current, endsLabel: label, secondsLeft: left, countdown: fmtCountdown(left) };
}

/* ---------- dates ---------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const HIJRI_MONTHS = ["Muharram","Safar","Rabi al-Awwal","Rabi al-Akhir","Jumadal Ula","Jumadal Akhira",
  "Rajab","Sha'ban","Ramadan","Shawwal","Dhul Qadah","Dhul Hijjah"];

export const fmtGreg = ({ y, m, d }) => `${MONTHS[m - 1]} ${d}, ${y}`;
export const fmtGregLong = ({ y, m, d }) => {
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[dow]} ${d} ${MONTHS[m - 1]} ${y}`;
};
export function hijriDate(date, adjust = 0) {
  try {
    const { y, m, d } = addDays(date, adjust);
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC",
    }).formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
    const o = {};
    parts.forEach((p) => (o[p.type] = p.value));
    return `${parseInt(o.day, 10)} ${HIJRI_MONTHS[parseInt(o.month, 10) - 1]} ${parseInt(String(o.year).replace(/\D/g, ""), 10)} AH`;
  } catch (e) {
    return "";
  }
}

/* ---------- Qibla ---------- */
const KAABA = { lat: 21.4225, lng: 39.8262 };
export function qiblaBearing(lat, lng) {
  const b = atan2(sin(KAABA.lng - lng), cos(lat) * tan(KAABA.lat) - sin(lat) * cos(KAABA.lng - lng));
  return fix(b, 360);
}
export function distanceToKaaba(lat, lng) {
  const R = 6371;
  const dLat = (KAABA.lat - lat) * D2R, dLng = (KAABA.lng - lng) * D2R;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * D2R) * Math.cos(KAABA.lat * D2R) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export const bearingText = (b) =>
  b > 180 ? `${(360 - b).toFixed(1)}° degrees west of north` : `${b.toFixed(1)}° degrees east of north`;
