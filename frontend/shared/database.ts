export type Country = {
    name: string,
    capital: string,
    unMember: boolean,
    region: string,
    subregion: string,
    cca3: string,
    cca2: string,
    callingCode: string
}

export type User = {
    id: number,
    email: string,
    password: string,
    roles: Record<string, any>
}

export type GeoJson = {
    countryCode: string,
    geoJson: Record<string, any>
}

export type Game = {
    id: number,
    userId: number,
    firstType: string,
    secondType: string,
    round: number,
    rounds: number,
    startedAt: number,
    finishedAt: number
}

export type GuessedFlag = {
    id: number,
    gameId: number,
    userId: number,
    correct: boolean,
    guessedAt: boolean
}

export type Tld = {
    id: number,
    tld: string,
    countryCode: string
}

export type Box = {
    id: number,
    userId: number,
    countryCode: string,
    trainedAt: number,
    phase: number
}