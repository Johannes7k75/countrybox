class FlagBox {

    public boxes: Box<typeof this.phases[number]>[];
    public boxMap: Map<number, Box<typeof this.phases[number]>> = new Map();
    public phases = [1, 3, 7, 14, 28, 56] as const

    constructor() {
        this.boxes = []
        this.boxes.toString = ()=>{
            return `[${this.boxes.map(b=>b.toString()).join(", ")}]`
        }


        for (const phase of this.phases) {
            const box = new Box(phase)
            this.boxes.push(box)
            this.boxMap.set(phase, box)
        }
    }

    public getBoxByFlagId(flagId: string) {
        return this.boxes.filter((box) => box.hasFlagId(flagId))[0]
    }

    public getPhase<T extends typeof this.phases[number]>(phase: T) {
        const index = this.phases.indexOf(phase);
        const nextIndex = index >= this.phases.length - 1 ? index : index + 1;
        const lastIndex = index <= 0 ? index : index - 1;

        const phases = this.phases;

        return {
            last: () => this.getPhase(phases[lastIndex]),
            next: () => this.getPhase(phases[nextIndex]), 
            value: phases[index]
        };
    }



    public train(flagId: string, success: boolean) {
        const box = this.getBoxByFlagId(flagId)

        if (success) {
            const nextPhase = this.getPhase(box.getPhase()).next().value
            this.swap(box.getPhase(), nextPhase, flagId)
        } else {
            const lastPhase = this.getPhase(box.getPhase()).last().value
            this.swap(box.getPhase(), lastPhase, flagId)
        }
    }

    public swap<T extends typeof this.phases[number]>(boxId1: T, boxId2: T, flagId: string) {
        const box1 = this.boxMap.get(boxId1), box2 = this.boxMap.get(boxId2);

        if (box1?.removeFlagId(flagId)) {
            box2?.addFlagId(flagId)
        }
    }

    public add(flagId: string) {
        this.boxMap.get(this.phases[0])?.addFlagId(flagId)
    }

}

class Box<T extends number> {
    private flagIds: Set<string> = new Set()
    constructor(private phase: T) { }

    public getPhase() {
        return this.phase;
    }

    public hasFlagId(id: string) {
        return this.flagIds.has(id)
    }

    public removeFlagId(id: string): boolean {
        if (!this.hasFlagId(id)) return false
        this.flagIds.delete(id)
        return true
    }

    public addFlagId(id: string) {
        this.flagIds.add(id)
    }

    public toString() {
        return `Box(${this.getPhase()}) [${Array.from(this.flagIds.values())}]`
    }
}

function log() {
    console.log(flagBox.boxes.toString())
}

const flagBox = new FlagBox()