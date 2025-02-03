import { proxy, ref } from "valtio";
import type { Atom, Query, QueryType } from "./core-types";
import { subscribeKey } from "valtio/utils";

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

export function getAtom<Q extends Query<any, any>>(query: Q) {
  if (!state.atoms[query.model.type]) {
    state.atoms[query.model.type] = proxy({});
  }

  const namespace = state.atoms[query.model.type];

  if (!namespace[query.$key]) {
    namespace[query.$key] = proxy({
      value: undefined,
      initialized: false,
      subscribers: ref(new Set<number>()),
    });
  }

  return namespace[query.$key] as Atom<QueryType<Q>>;
}

export function checkAtom<Q extends Query>(
  query: Q
): Atom<QueryType<Q>> | undefined {
  return state.atoms[query.model.type]?.[query.$key] as
    | Atom<QueryType<Q>>
    | undefined;
}

export function reset<P extends object | void>(query: Query<any, P>) {
  const atom = state.atoms[query.model.type]?.[query.$key];
  if (!atom) {
    return;
  }

  atom.cleanup?.();
  atom.value = undefined;
  atom.promise = undefined;
  atom.initialized = false;
  atom.expiry = undefined;
  if (atom.subscribers.size > 0) {
    initialize(query);
  }
}

export function initialize<T, P extends object | void>(query: Query<T, P>) {
  const atom = getAtom(query);
  if (!atom.initialized) {
    atom.initialized = true;

    const cleanup = query.model.init({ params: query.params, atom });
    atom.cleanup = () => {
      cleanup?.();
      atom.initialized = false;
    };
  }
}

export function getPromise<Q extends Query>(query: Q) {
  const atom = getAtom(query);

  if (!atom.promise) {
    atom.promise = new Promise<Atom<QueryType<Q>>>((resolve) => {
      const subscriberId = getNextSubscriberId();
      const unsubscribeKey = subscribeKey(atom, "value", () => {
        unsubscribeKey();
        unsubscribe(query, subscriberId);
        resolve(atom as Atom<QueryType<Q>>);
      });
      subscribe(query, subscriberId);
    });
  }

  return atom.promise;
}

export function subscribe<Q extends Query>(query: Q, subscriberId: number) {
  const atom = getAtom(query);
  atom.subscribers.add(subscriberId);
  initialize(query);
}

export function unsubscribe(query: Query<any, any>, subscriberId: number) {
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
