import { Cache } from "./Cache";
import type { Schema } from "./schema";
import {
  getCountryCallingCode,
  isSupportedCountry,
  type CountryCode,
} from "libphonenumber-js";

const url =
  "https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/dist/countries-unescaped.json";

const cache = new Cache();

// cache.fetch("https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/data/hnd.svg")

const data = (await cache.fetch(url)) as Schema[];

type Country = {
  name: string;
  // translations:  {[name: string]: Record<"official"|"common", string>},
  // currencies: {[name: string]: Record<"name"|"symbol", string>},
  cca2: string;
  cca3: string;
  tlds: string[];
  independent: boolean;
  capital: string;
  region: string;
  subregion: string;
  callingCode: string | null;
  unMember: boolean
};

const extract: Country[] = [];

data.forEach((v) => {
//   const flagUrl = `https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/data/${v.cca3.toLowerCase()}.svg`;
//   cache.fetch(flagUrl);

//   const flagUrl2 = `https://raw.githubusercontent.com/lipis/flag-icons/refs/heads/main/flags/4x3/${v.cca2.toLowerCase()}.svg`;
//   cache.fetch(flagUrl2);

  const tldRegex = /\.[a-z]{2}/;

  const country: Country = {
    name: v.translations.deu.common,
    cca3: v.cca3,
    cca2: v.cca2,
    capital: v.capital[0],
    independent: v.independent ?? false,
    region: v.region,
    subregion: v.subregion,
    tlds: v.tld.filter((tld) => tld.toLowerCase().match(tldRegex)),
    callingCode: isSupportedCountry(v.cca2.toUpperCase())
      ? getCountryCallingCode(v.cca2.toUpperCase() as CountryCode).toString()
      : null,
      unMember: v.unMember
  };

  extract.push(country);
});

cache.put("countries.json", extract);

console.log("Extracted all data");
