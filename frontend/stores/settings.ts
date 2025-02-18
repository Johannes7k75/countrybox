export const gameTypes = [
  "name", "capital", "tld", "callCode", "flag"
] as const
export type GameTypes = typeof gameTypes[number]

const defaultSettings = {
  autoNext: false,
  defaultGame: ['name', 'flag'] as [GameTypes,GameTypes],
};

function getKeys<O extends Object>(obj: O): (keyof O)[] {
  return Object.keys(obj) as (keyof O)[]
}

export const useSettingsStore = defineStore('settings', {
  state: (): typeof defaultSettings => {
    const cookie = useCookie('settings', { default: () => defaultSettings});
    console.log(cookie.value)

    return {
      ...defaultSettings, // Default settings
      ...cookie.value
    };
  },
  actions: {
    updateCookie() {
      const cookie = useCookie<typeof defaultSettings>('settings');
      cookie.value = getKeys(defaultSettings).reduce((pre, cur)=>Object.assign(pre, {[cur]: this.$state[cur]}),{}) as typeof defaultSettings
    },
    set<K extends keyof typeof defaultSettings>(key: K, value: typeof defaultSettings[K] ) {
      if (key in this.$state) {
        this.$state[key] = value;
        this.updateCookie();
      } else {
        console.warn(`Setting "${key}" does not exist.`);
      }
    },
  },
});