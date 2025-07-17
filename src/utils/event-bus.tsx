import mitt, { type Emitter } from 'mitt';
import { useEffect } from 'react';

export const createEventBus = <T extends Record<string, any>>() => {
  const bus = mitt<T>();
  return bus;
};

export function createEventBusHook<T extends Record<string, any>>(bus: Emitter<T>) {
  return function useEventBus<K extends keyof T>(event: K, handler: (payload: T[K]) => void) {
    useEffect(() => {
      bus.on(event, handler);
      return () => {
        bus.off(event, handler);
      };
    }, [event, handler]);
  };
}
