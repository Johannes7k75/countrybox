export const ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20H15v-6H9v6H4z"/>',
  practice: '<path d="M4 6h10M4 12h7M4 18h10"/><path d="m15 12 5-3v6z" fill="currentColor"/>',
  explore:
    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3.2 3.4 3.2 13.6 0 17M12 3.5c-3.2 3.4-3.2 13.6 0 17"/>',
  reviews: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M6 9V5.5h12V9M9 13h6"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  map: '<path d="m3.5 6.5 5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  restart: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  f_flag: '<path d="M5.5 21V4m0 .5c4.5-2.5 8 2.5 13 0v9c-5 2.5-8.5-2.5-13 0"/>',
  f_name:
    '<path d="M4 18 8.5 6 13 18M5.7 14h5.6M15.5 11.5c.6-1 1.6-1.5 2.7-1.5 1.7 0 2.8 1 2.8 2.7V18m0-3.6c-1-.6-5.6-.9-5.6 1.6 0 2.4 4.3 2.4 5.6.2"/>',
  f_capital:
    '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><path d="m12 7 .9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L9 9.2l2.1-.3z" fill="currentColor" stroke="none"/>',
  f_tld:
    '<circle cx="5" cy="17" r="1.4" fill="currentColor" stroke="none"/><path d="M10 9v8m0-4c0-2.2 1.3-4 4-4M15.5 13h5m-2.5-4v8"/>',
  f_location:
    '<path d="m3.5 6.5 5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><circle cx="12" cy="11" r="2.2" fill="currentColor" stroke="none"/>',
  f_callingCode:
    '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
} as const
export type IconName = keyof typeof ICONS
