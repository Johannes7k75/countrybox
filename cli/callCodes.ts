import {getCountries, getCountryCallingCode} from "libphonenumber-js"

console.log(getCountries().map(x=>getCountryCallingCode(x)).length);

