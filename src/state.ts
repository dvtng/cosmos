import { proxy, ref } from "valtio";
import type { Atom, Query } from "./core-types";

export type State = {
  nextSubscriberId: number;
  atoms: Record<string, Record<string, Atom>>;
};

export const state: State = proxy({
  nextSubscriberId: 0,
  atoms: {},
});

export function getNextSubscriberId() {
  return state.nextSubscriberId++;
}

export function getAtom<T, P extends object | void>(query: Query<T, P>) {
  if (!state.atoms[query.model.type]) {
    state.atoms[query.model.type] = {};
  }

  const namespace = state.atoms[query.model.type];

  if (!namespace[query.$key]) {
    namespace[query.$key] = {
      value: undefined,
      initialized: false,
      subscribers: ref(new Set<number>()),
    };
  }

  return namespace[query.$key] as Atom<T>;
}

export function subscribe<T, P extends object | void>(
  query: Query<T, P>,
  subscriberId: number
): Atom<T> {
  const atom = getAtom(query);

  atom.subscribers.add(subscriberId);

  if (!atom.initialized) {
    atom.initialized = true;
    const cleanup = query.model.init({ params: query.params, atom });
    atom.cleanup = () => {
      cleanup?.();
      atom.initialized = false;
    };
  }

  return atom;
}

export function unsubscribe<T, P extends object | void>(
  query: Query<T, P>,
  subscriberId: number
) {
  const atom = state.atoms[query.model.type]?.[query.$key];
  if (!atom) {
    return;
  }

  atom.subscribers.delete(subscriberId);

  // Cleanup if this is the last subscriber
  if (atom.subscribers.size === 0 && atom.cleanup) {
    const cleanup = atom.cleanup;
    delete atom.cleanup;

    // Schedule cleanup - in case there's a new subscriber soon
    const KEEP_ALIVE_MS = 1000;
    setTimeout(() => {
      if (atom.subscribers.size === 0) {
        cleanup();
      } else {
        atom.cleanup = cleanup;
      }
    }, KEEP_ALIVE_MS);
  }
}
