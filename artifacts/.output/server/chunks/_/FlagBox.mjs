import { e as useDrizzle, f as tables } from './nitro.mjs';
import { eq } from 'drizzle-orm';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class FlagBox {
  constructor(flagBoxes2) {
    __publicField(this, "boxes");
    __publicField(this, "boxMap", /* @__PURE__ */ new Map());
    __publicField(this, "phases", [1, 3, 7, 14, 28, 56]);
    this.boxes = [];
    this.boxes.toString = () => {
      return `[${this.boxes.map((b) => b.toString()).join(", ")}]`;
    };
    for (const phase of this.phases) {
      const box = new Box(phase);
      this.boxes.push(box);
      this.boxMap.set(phase, box);
    }
    if (flagBoxes2) {
      for (let i = 0; i < flagBoxes2.length; i++) {
        const flagBox = flagBoxes2[i];
        const phase = this.phases[i];
        const box = this.boxMap.get(phase);
        flagBox.forEach((flagId) => box == null ? void 0 : box.addFlagId(flagId));
      }
    }
  }
  getBoxByFlagId(flagId) {
    return this.boxes.filter((box) => box.hasFlagId(flagId))[0];
  }
  getPhase(phase) {
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
  train(flagId, success) {
    const box = this.getBoxByFlagId(flagId);
    if (success) {
      const nextPhase = this.getPhase(box.getPhase()).next().value;
      this.swap(box.getPhase(), nextPhase, flagId);
    } else {
      const lastPhase = this.getPhase(box.getPhase()).last().value;
      this.swap(box.getPhase(), lastPhase, flagId);
    }
  }
  swap(boxId1, boxId2, flagId) {
    const box1 = this.boxMap.get(boxId1), box2 = this.boxMap.get(boxId2);
    if (box1 == null ? void 0 : box1.removeFlagId(flagId)) {
      box2 == null ? void 0 : box2.addFlagId(flagId);
    }
  }
  add(flagId) {
    var _a;
    (_a = this.boxMap.get(this.phases[0])) == null ? void 0 : _a.addFlagId(flagId);
  }
  toString() {
    return this.boxes.toString();
  }
  json() {
    return this.phases.map((phase) => {
      var _a;
      return (_a = this.boxMap.get(phase)) == null ? void 0 : _a.json();
    });
  }
}
class Box {
  constructor(phase) {
    this.phase = phase;
    __publicField(this, "flagIds", /* @__PURE__ */ new Set());
  }
  getPhase() {
    return this.phase;
  }
  hasFlagId(id) {
    return this.flagIds.has(id);
  }
  removeFlagId(id) {
    if (!this.hasFlagId(id)) return false;
    this.flagIds.delete(id);
    return true;
  }
  addFlagId(id) {
    this.flagIds.add(id);
  }
  toString() {
    return `Box(${this.getPhase()}) [${Array.from(this.flagIds.values())}]`;
  }
  json() {
    return {
      phase: this.getPhase(),
      flagIds: Array.from(this.flagIds.values())
    };
  }
}
const flagBoxes = /* @__PURE__ */ new Map();
async function getFlagBox(userId) {
  const boxes = await useDrizzle().select({
    flagId: tables.Countries.cca3,
    phase: tables.Boxes.phase,
    id: tables.Boxes.id,
    userId: tables.Boxes.userId
  }).from(tables.Boxes).where(eq(tables.Boxes.userId, userId)).innerJoin(tables.Countries, eq(tables.Countries.id, tables.Boxes.countryId));
  const groupedBoxes = Object.groupBy(boxes, (box) => box.phase);
  flagBoxes.set(userId, new FlagBox(Object.keys(groupedBoxes).map((key) => [groupedBoxes[key][0].flagId])));
  return flagBoxes.get(userId);
}

export { getFlagBox as g };
//# sourceMappingURL=FlagBox.mjs.map
