export class EventEmitter<
  E extends Record<string | symbol, any[]> = Record<string | symbol, any[]>
> {
  // Internal storage for event listeners.
  private listeners = new Map<string | symbol, Array<(...args: any[]) => void>>();

  // Emit method with overloads.
  emit<Event extends keyof E>(event: Event, ...args: E[Event]): boolean;
  emit<Event extends string | symbol>(event: Exclude<Event, keyof E>, ...args: any[]): boolean;
  emit(event: string | symbol, ...args: any[]): boolean {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.length === 0) return false;
    // Use a copy of the array in case listeners are removed during iteration.
    for (const handler of handlers.slice()) {
      handler(...args);
    }
    return true;
  }

  // on method with overloads.
  on<Event extends keyof E>(event: Event, listener: (...args: E[Event]) => void): this;
  on<Event extends string | symbol>(event: Exclude<Event, keyof E>, listener: (...args: any[]) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    console.log("This", this)
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.push(listener);
    } else {
      this.listeners.set(event, [listener]);
    }
    return this;
  }

  // once method with overloads.
  once<Event extends keyof E>(event: Event, listener: (...args: E[Event]) => void): this;
  once<Event extends string | symbol>(event: Exclude<Event, keyof E>, listener: (...args: any[]) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      listener(...args);
    };
    this.on(event, wrapper);
    return this;
  }

  // off method with overloads.
  off<Event extends keyof E>(event: Event, listener: (...args: E[Event]) => void): this;
  off<Event extends string | symbol>(event: Exclude<Event, keyof E>, listener: (...args: any[]) => void): this;
  off(event: string | symbol, listener: (...args: any[]) => void): this {
    const handlers = this.listeners.get(event);
    if (!handlers) return this;
    const index = handlers.indexOf(listener);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    if (handlers.length === 0) {
      this.listeners.delete(event);
    }
    return this;
  }
}