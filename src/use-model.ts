import { useLayoutEffect } from "react";
import {
  getNextSubscriberId,
  getAtom,
  subscribe,
  unsubscribe,
  initialize,
} from "./state";
import { useSnapshot } from "valtio";
import type { Atom, Query, QueryType, UseModel } from "./core-types";

export const useModel: UseModel = function <Q extends Query>(query: Q) {
  const atom = getAtom(query);

  // Initialize in the render phase to ensure sync models (e.g. derived models
  // with already cached data) are ready on first render.
  initialize(query);

  useLayoutEffect(() => {
    const subscriberId = getNextSubscriberId();
    subscribe(query, subscriberId);

    return () => {
      unsubscribe(query, subscriberId);
    };
    // Since query.$key is a seralized representation of the query,
    // we only need this as the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query?.$key]);

  const _atom = useSnapshot(atom) as Atom<QueryType<Q>>;

  return [_atom.value, atom, query];
};
