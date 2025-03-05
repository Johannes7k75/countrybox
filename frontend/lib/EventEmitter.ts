// @ts-ignore

type CustomeEvents = { [Key in string & {} | symbol]: (...args: any[]) => void }

interface TypedEmitter<E extends CustomeEvents, Events = E & CustomeEvents> {
  listenersMap: Map<keyof Events, (()=>void)[]> 
  
  addListener<E extends keyof Events> (event: E, listener: Events[E]): this
  on<E extends keyof Events> (event: E, listener: Events[E]): this
  once<E extends keyof Events> (event: E, listener: Events[E]): this
  prependListener<E extends keyof Events> (event: E, listener: Events[E]): this
  prependOnceListener<E extends keyof Events> (event: E, listener: Events[E]): this
  
  off<E extends keyof Events>(event: E, listener: Events[E]): this
  removeAllListeners<E extends keyof Events> (event?: E): this
  removeListener<E extends keyof Events> (event: E, listener: Events[E]): this
  
  emit<E extends keyof Events> (event: E, ...args: Parameters<Events[E]>): boolean
  // The sloppy `eventNames()` return type is to mitigate type incompatibilities - see #5
  eventNames (): (keyof Events | string | symbol)[]
  rawListeners<E extends keyof Events> (event: E): Events[E][]
  listeners<E extends keyof Events> (event: E): Events[E][]
  listenerCount<E extends keyof Events> (event: E): number
  
  getMaxListeners (): number
  setMaxListeners (maxListeners: number): this
}


export default class EventEmitter<E extends CustomeEvents, Events = E & CustomeEvents> implements TypedEmitter<E, Events> {
  private maxListeners: number = 10;
  public listenersMap: Map<keyof Events, (() => void)[]> = new Map();

  addListener<K extends keyof Events>(event: K, listener: Events[K]): this {
    return this.on(event, listener);
  }

  on<K extends keyof Events>(event: K, listener: Events[K]): this {
    const listeners = this.listenersMap.get(event) || [];
    listeners.push(listener as (...args: any[]) => void);
    this.listenersMap.set(event, listeners);
    return this;
  }

  once<K extends keyof Events>(event: K, listener: Events[K]): this {
    const onceListener = ((...args: Parameters<Events[K]>) => {
      listener(...args);
      this.off(event, onceListener as Events[K]);
    }) as Events[K];
    return this.on(event, onceListener);
  }

  prependListener<K extends keyof Events>(event: K, listener: Events[K]): this {
    const listeners = this.listenersMap.get(event) || [];
    listeners.unshift(listener);
    this.listenersMap.set(event, listeners);
    return this;
  }

  prependOnceListener<K extends keyof Events>(event: K, listener: Events[K]): this {
    const onceListener = ((...args: Parameters<Events[K]>) => {
      listener(...args);
      this.off(event, onceListener as Events[K]);
    }) as Events[K];
    return this.prependListener(event, onceListener);
  }

  off<K extends keyof Events>(event: K, listener: Events[K]): this {
    const listeners = this.listenersMap.get(event) || [];
    const filteredListeners = listeners.filter(l => l !== listener);
    this.listenersMap.set(event, filteredListeners);
    return this;
  }

  removeAllListeners<K extends keyof Events>(event?: K): this {
    if (event) {
      this.listenersMap.delete(event);
    } else {
      this.listenersMap.clear();
    }
    return this;
  }

  removeListener<K extends keyof Events>(event: K, listener: Events[K]): this {
    return this.off(event, listener);
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): boolean {
    const listeners = this.listenersMap.get(event) || [];
    listeners.forEach(listener => listener(...args));
    return listeners.length > 0;
  }

  eventNames(): (keyof Events | string | symbol)[] {
    return Array.from(this.listenersMap.keys());
  }

  rawListeners<K extends keyof Events>(event: K): Events[K][] {
    return this.listenersMap.get(event) || [];
  }

  listeners<K extends keyof Events>(event: K): Events[K][] {
    return this.rawListeners(event);
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listenersMap.get(event)?.length || 0;
  }

  getMaxListeners(): number {
    return this.maxListeners;
  }

  setMaxListeners(maxListeners: number): this {
    this.maxListeners = maxListeners;
    return this;
  }
}