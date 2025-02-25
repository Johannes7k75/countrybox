type FlagBoxType = string[];

class FlagBox {
  public boxes: Box<(typeof this.phases)[number]>[];
  public boxMap: Map<number, Box<(typeof this.phases)[number]>> = new Map();
  public phases = [1, 3, 7, 14, 28, 56] as const;

  constructor(
    flagBoxes?: [
      FlagBoxType,
      FlagBoxType,
      FlagBoxType,
      FlagBoxType,
      FlagBoxType,
      FlagBoxType,
    ],
  ) {
    this.boxes = [];
    this.boxes.toString = () => {
      return `[${this.boxes.map((b) => b.toString()).join(", ")}]`;
    };

    for (const phase of this.phases) {
      const box = new Box(phase);
      this.boxes.push(box);
      this.boxMap.set(phase, box);
    }

    if (flagBoxes) {
      for (let i = 0; i < flagBoxes.length; i++) {
        const flagBox = flagBoxes[i];
        const phase = this.phases[i];

        const box = this.boxMap.get(phase);

        flagBox.forEach((flagId) => box?.addFlagId(flagId));
      }
    }
  }

  public getBoxByFlagId(flagId: string) {
    return this.boxes.filter((box) => box.hasFlagId(flagId))[0];
  }

  public getPhase<T extends (typeof this.phases)[number]>(phase: T) {
    const index = this.phases.indexOf(phase);
    const nextIndex = index >= this.phases.length - 1 ? index : index + 1;
    const lastIndex = index <= 0 ? index : index - 1;

    const phases = this.phases;

    return {
      last: () => this.getPhase(phases[lastIndex]),
      next: () => this.getPhase(phases[nextIndex]),
      value: phases[index],
    };
  }

  public train(flagId: string, success: boolean) {
    const box = this.getBoxByFlagId(flagId);

    if (success) {
      const nextPhase = this.getPhase(box.getPhase()).next().value;
      this.swap(box.getPhase(), nextPhase, flagId);
    } else {
      const lastPhase = this.getPhase(box.getPhase()).last().value;
      this.swap(box.getPhase(), lastPhase, flagId);
    }
  }

  public swap<T extends (typeof this.phases)[number]>(
    boxId1: T,
    boxId2: T,
    flagId: string,
  ) {
    const box1 = this.boxMap.get(boxId1),
      box2 = this.boxMap.get(boxId2);

    if (box1?.removeFlagId(flagId)) {
      box2?.addFlagId(flagId);
    }
  }

  public add(flagId: string) {
    this.boxMap.get(this.phases[0])?.addFlagId(flagId);
  }

  public toString() {
    return this.boxes.toString();
  }

  public json() {
    return this.phases.map((phase) => this.boxMap.get(phase)?.json());
  }
}

class Box<T extends number> {
  private flagIds: Set<string> = new Set();
  constructor(private phase: T) {}

  public getPhase() {
    return this.phase;
  }

  public hasFlagId(id: string) {
    return this.flagIds.has(id);
  }

  public removeFlagId(id: string): boolean {
    if (!this.hasFlagId(id)) return false;
    this.flagIds.delete(id);
    return true;
  }

  public addFlagId(id: string) {
    this.flagIds.add(id);
  }

  public toString() {
    return `Box(${this.getPhase()}) [${Array.from(this.flagIds.values())}]`;
  }

  public json() {
    return {
      phase: this.getPhase(),
      flagIds: Array.from(this.flagIds.values()),
    };
  }
}

const flagBoxes = new Map<number, FlagBox>();

export async function getFlagBox(userId: number) {
  // if (!flagBoxes.has(userId)) {
  const boxes = await useDrizzle()
    .select({
      flagId: tables.Countries.cca3,
      phase: tables.Boxes.phase,
      id: tables.Boxes.id,
      userId: tables.Boxes.userId,
    })
    .from(tables.Boxes)
    .where(eq(tables.Boxes.userId, userId))
    .innerJoin(
      tables.Countries,
      eq(tables.Countries.id, tables.Boxes.countryId),
    );
  const groupedBoxes = Object.groupBy(boxes, (box) => box.phase);

  flagBoxes.set(
    userId,
    new FlagBox(
      Object.keys(groupedBoxes).map((key) => [
        groupedBoxes[key as keyof typeof groupedBoxes]![0].flagId,
      ]),
    ),
  );
  // }

  return flagBoxes.get(userId);
}
