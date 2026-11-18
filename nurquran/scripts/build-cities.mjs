// Generates world location data for Prayer Times into public/data/
//   countries.json          [[code, name], ...]
//   cities/<CC>.json         {tz:[iana...], c:[[name, lat, lng, tzIndex], ...]}
//   nearest.json             [[name, cc, lat, lng], ...]  (thinned, for GPS lookup)
import { Country, City } from "country-state-city";
import { find } from "geo-tz";
import { mkdirSync, writeFileSync } from "fs";

const EXTRA = { AE: [["Abu Dhabi", 24.4539, 54.3773]] }; // well-known names missing from the dataset
const out = "public/data";
mkdirSync(`${out}/cities`, { recursive: true });

const countries = Country.getAllCountries().map((c) => [c.isoCode, c.name]).sort((a, b) => a[1].localeCompare(b[1]));
const nearest = [];
const grid = new Set();
let total = 0;

for (const [cc] of countries) {
  const seen = new Set();
  const list = [];
  const add = (name, lat, lng) => {
    const key = name.toLowerCase();
    if (seen.has(key) || !isFinite(lat) || !isFinite(lng)) return;
    seen.add(key);
    list.push([name, +(+lat).toFixed(4), +(+lng).toFixed(4)]);
  };
  (EXTRA[cc] || []).forEach(([n, a, b]) => add(n, a, b));
  (City.getCitiesOfCountry(cc) || []).forEach((c) => add(c.name, parseFloat(c.latitude), parseFloat(c.longitude)));
  if (!list.length) {
    const c = Country.getCountryByCode(cc);
    if (c && c.latitude) add(c.name, parseFloat(c.latitude), parseFloat(c.longitude));
  }
  list.sort((a, b) => a[0].localeCompare(b[0]));
  const tzs = [];
  const rows = list.map(([n, a, b]) => {
    const tz = find(a, b)[0] || "UTC";
    let i = tzs.indexOf(tz);
    if (i < 0) { tzs.push(tz); i = tzs.length - 1; }
    const g = `${Math.round(a * 5)}:${Math.round(b * 5)}`;
    if (!grid.has(g)) { grid.add(g); nearest.push([n, cc, a, b]); }
    return [n, a, b, i];
  });
  total += rows.length;
  writeFileSync(`${out}/cities/${cc}.json`, JSON.stringify({ tz: tzs, c: rows }));
}
writeFileSync(`${out}/countries.json`, JSON.stringify(countries));
writeFileSync(`${out}/nearest.json`, JSON.stringify(nearest));
console.log(`countries ${countries.length}, cities ${total}, nearest ${nearest.length}`);
