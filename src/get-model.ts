import { ref } from "valtio";
import type { Query } from "./core-types";
import { getAtom, getNextSubscriberId, subscribe, unsubscribe } from "./state";
import { subscribeKey } from "valtio/utils";

/**
 * Resolve a model query as a promise.
 */
export function getModel<T, P extends object | void>(query: Query<T, P>) {
  const atom = getAtom(query);

  if (!atom.promise) {
    atom.promise = ref(
      atom.value !== undefined
        ? Promise.resolve(atom.value)
        : new Promise<T>((resolve) => {
            const subscriberId = getNextSubscriberId();

            const unsubscribeKey = subscribeKey(atom, "value", (value) => {
              unsubscribeKey();
              unsubscribe(query, subscriberId);
              resolve(value as T);
            });

            subscribe(query, subscriberId);
          })
    );
  }

  return atom.promise;
}
