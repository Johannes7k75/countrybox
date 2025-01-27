import { fetch as bunFetch } from "bun"
import EventEmitter from "node:events";
import { readdirSync, statSync } from "node:fs"

export class Cache {

    private cache: Map<string, any> = new Map<string, any>()
    private isReady: boolean = false;
    private emitter = new EventEmitter()

    constructor() {
        this.init()
    }

    private async init() {
        const loadFiles = async (files: string[]) => {
            for await (const filePath of files) {
                const stat = statSync(filePath)

                if (stat.isDirectory()) {
                    await loadFiles(readdirSync(filePath).map(f => filePath + "/" + f))
                    return
                }

                if (stat.isFile()) {
                    const ending = filePath.split(".").at(-1)

                    if (ending) {
                        let data;
                        const file = Bun.file(filePath)
                        switch (ending) {
                            case "json":
                                data = await file.json()
                                break;
                            case "svg":
                                data = await file.text()
                                break;
                            default:
                                data = await file.arrayBuffer()
                        }

                        const key = filePath.split("/").at(-1) ?? filePath
                        this.cache.set(key, data)
                    }
                }
            }
        }
        const files = readdirSync(".cache").map(f => ".cache/" + f);

        await loadFiles(files)



        this.isReady = true;
        this.emitter.emit("ready")
    }

    private async waitUntilReady() {
        return new Promise((res) => {
            if (this.isReady === true) return res(true)
            this.emitter.once("ready", () => res(true))
        })
    }

    public put(key: string, data: any) {
        const type = key.split(".").at(-1)

        switch (type) {
            case "json":
                Bun.write(`.cache/json/${key}`, JSON.stringify(data))
                break
            case "svg":
                Bun.write(`.cache/svg/${key}`, data.toString())
                break;
            default:
                Bun.write(`.cache/${key}`, data)
                break
        }

        this.cache.set(key, data);
    }

    public async get(key: string) {
        await this.waitUntilReady()
        return this.cache.get(key)
    }


    public async fetch(input: string, init?: RequestInit) {
        await this.waitUntilReady()
        const key = input.split("/").at(-1) as string
        const type = key.split(".").at(-1)

        let data;

        switch (type) {
            case "json":
                data = await this.fetchJson(input, init)
                break
            case "svg":
                data = await this.fetchSvg(input, init)
                break
            default:
                data = await this.fetchDefault(input, init)
                break
        }

        return data;

    }

    private async fetchDefault(input: string, init?: RequestInit) {
        const key = input.split("/").at(-1) as string

        if (!this.cache.has(key)) {
            console.log("New fetch")
            const res = await bunFetch(input, init)
            this.cache.set(key, await res.arrayBuffer())

            Bun.write(`.cache/${key}`, this.cache.get(key))
        }

        return this.cache.get(key)
    }

    private async fetchSvg(input: string, init?: RequestInit) {
        const key = input.split("/").at(-1) as string

        if (!this.cache.has(key)) {
            console.log("Get new SVG")
            const res = await bunFetch(input, init)
            this.cache.set(key, await res.text())

            Bun.write(`.cache/svg/${key}`, this.cache.get(key))
        }

        return this.cache.get(key)
    }

    private async fetchJson(input: string, init?: RequestInit) {
        const key = input.split("/").at(-1) as string

        if (!this.cache.has(key)) {
            console.log("Get new JSON")
            const res = await bunFetch(input, init)
            this.cache.set(key, await res.json())

            Bun.write(`.cache/json/${key}`, JSON.stringify(this.cache.get(key)))
        }

        return this.cache.get(key)
    }
}