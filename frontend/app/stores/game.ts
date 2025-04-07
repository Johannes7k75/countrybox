import EventEmitter from "~~/lib/EventEmitter"
import * as db from "~~/shared/database"

export interface GameOption {
  name: string;
  capital: string;
  tld: string;
  callCode: string | null;
  cca2: string;
  cca3: string;
  correct: boolean;
}

interface GameType {
  first: GameTypes;
  second: GameTypes;
}

interface GameStore {
  roundId: number | null;
  round: number;
  maxRounds: number;

  fails: number;
  maxFails: number;

  guesses: Set<string>;

  types: GameType;
  options: GameOption[];

  events: EventEmitter<Events>;
}

function randomInt(min: number, max: number): number {
  if (window.crypto && window.crypto.getRandomValues) {
    const range = max - min + 1;
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return (buffer[0]! % range) + min;
  } else {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

type Events = {
  start: () => void;
  next: () => void;
  correctGuess: () => void;
  wrongGuess: () => void;
  roundOver: () => void;
  gameOver: () => void
};

export const useGameStore = defineStore("gameStore", {
  state: (): GameStore => ({
    roundId: null,
    round: 0,
    maxRounds: 20,
    fails: 0,
    maxFails: 3,
    guesses: new Set(),
    types: {
      first: useSettingsStore().defaultGame[0],
      second: useSettingsStore().defaultGame[1],
    },
    options: [],

    events: new EventEmitter<Events>(),
  }),

  getters: {
    correctOption: (state) => state.options.find((o) => o.correct),
    correctGuessed(): boolean {
      return this.correctOption
        ? this.guesses.has(this.correctOption.cca2)
        : false;
    },
    lives: (state) => state.maxFails - state.fails,

    getOption: (state) => (cca2: string) =>
      state.options.find((o) => o.cca2 === cca2),
    isCorrect() {
      return (cca2: string) =>
        this.correctOption && this.correctOption.cca2 === cca2;
    },
    isNotCorrect() {
      return (cca2: string) =>
        this.correctOption && this.correctOption.cca2 !== cca2;
    },
    isGuessed() {
      return (cca2: string) => this.guesses.has(cca2);
    },

    isGameOver: (state) => state.fails >= state.maxFails,
    isRoundOver: (state) => state.round >= state.maxRounds,

    getIndex:
      (state) =>
        (option: GameOption): number =>
          state.options.indexOf(option),
  },

  actions: {
    async nextRound() {
      if (!this.isRoundOver && !this.isGameOver) {
        this.guesses = new Set();
        this.round++;
        this.options = await this.getRoundOptions();
        this.events.emit("next");
      }

      if (this.isRoundOver) {
        this.events.emit("roundOver");
      }
    },

    async startGame({
      fails = 0,
      maxFails = 3,
      round = 0,
      maxRounds = 20,
      types = {
        first: useSettingsStore().defaultGame[0],
        second: useSettingsStore().defaultGame[1],
      },
    }: Partial<Omit<GameStore, "options">>) {
      this.fails = fails;
      this.maxFails = maxFails;
      this.round = round;
      this.maxRounds = maxRounds;
      this.types = { ...types };
      this.roundId = await this.startNewRound();
      this.options = await this.getRoundOptions();

      this.events.emit("start");
    },

    async startNewRound() {
      const roundData = await $fetch<{ roundId: number | null }>("/game/startRound", { method: "POST" })

      return roundData.roundId
    },

    async getRoundOptions() {
      const roundData = await useApi().fetch<(db.Country & {tld: string})[]>("/game/options",{query: {
        roundId: this.roundId
      }})
      // const roundData = await $fetch("/api/game", { method: "POST", body: { roundId: this.roundId } });

      const options: GameOption[] = roundData!.map((r) => ({
        name: r.name,
        capital: r.capital,
        callCode: r.callingCode,
        cca2: r.cca2.toLowerCase(),
        cca3: r.cca3.toLowerCase(),
        tld: r.tld,
        correct: false,
      }));
      const rndOption = randomInt(0, options.length - 1);
      console.log(rndOption);
      options[rndOption]!.correct = true;
      return options;
    },

    addGuess(cca2: string) {
      this.$state.guesses.add(cca2);
    },

    guess(cca2: GameOption["cca2"]) {
      if (
        !useSettingsStore().autoNext &&
        this.correctGuessed &&
        this.isCorrect(cca2)
      ) {
        this.nextRound();
        return;
      }

      if (this.isGameOver || this.correctGuessed || this.isGuessed(cca2))
        return;

      this.$state.guesses.add(cca2);
      if (this.isCorrect(cca2)) {
        this.events.emit("correctGuess");

        if (useSettingsStore().autoNext) {
          setTimeout(() => this.nextRound(), 1_000);
        }
      } else {
        this.fails++;
        this.events.emit("wrongGuess")
      }
    },

    resetGame() {
      this.startGame({});
    },
  },
});