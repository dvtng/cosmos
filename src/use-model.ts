import { useEffect } from "react";
import { getNextSubscriberId, getAtom, subscribe, unsubscribe } from "./state";
import { proxy, useSnapshot } from "valtio";
import type { UseModel } from "./core-types";
import { getModel } from "./get-model";

const placeholderAtom = proxy({ value: undefined });

export const useModel: UseModel = function (query, options = {}) {
  const atom = query ? getAtom(query) : null;

  // Handle suspense
  if (options.wait && query && atom?.value === undefined) {
    throw getModel(query);
  }

  useEffect(() => {
    if (!query) {
      return;
    }

    const subscriberId = getNextSubscriberId();
    subscribe(query, subscriberId);

    return () => {
      unsubscribe(query, subscriberId);
    };
    // Since query.$key is a seralized representation of the query,
    // we only need this as the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query?.$key]);

  const _atom = useSnapshot(atom ?? placeholderAtom);

  return _atom.value;
};
