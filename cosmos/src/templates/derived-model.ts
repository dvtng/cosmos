import { watch } from "valtio/utils";
import type { Model, Query, UseModel } from "../core-types";
import { getAtom, getNextSubscriberId, subscribe, unsubscribe } from "../state";

/**
 * A DerivedModel synchronously computes its value based on other models.
 * To do this, it is provided a getModel function that behaves similarly to
 * useModel.
 */
export type DerivedModel<T, P extends object | void> = {
  type?: string;
  derive: (getModel: UseModel, params: P) => T | undefined;
};

export function isDerivedModel<T, P extends object | void>(
  model: any
): model is DerivedModel<T, P> {
  return "derive" in model;
}

let nextDerivedModelId = 0;

export function fromDerivedModel<T, P extends object | void>(
  model: DerivedModel<T, P>
): Model<T, P> {
  const type = model.type ?? `$Derived-${nextDerivedModelId++}`;

  return {
    type,
    init({ params, atom }) {
      const subscriberId = getNextSubscriberId();

      let queries: Record<string, Query<any, any>> = {};

      const unwatch = watch((get) => {
        const nextQueries: Record<string, Query<any, any>> = {};

        const getModel: UseModel = function (query) {
          const atom = getAtom(query);
          subscribe(query, subscriberId);
          nextQueries[query.$key] = query;

          // Tell valtio to track the dependency
          get(atom);

          return [atom.value, atom, query];
        };

        try {
          const value = model.derive(getModel, params);
          atom.value = value;
        } catch (e) {
          if (e instanceof Promise) {
            // Ignore, since this model will re-run when there is a value
          } else {
            throw e;
          }
        }

        // Unsubscribe from old queries
        for (const key in queries) {
          if (!nextQueries[key]) {
            unsubscribe(queries[key], subscriberId);
          }
        }
        queries = nextQueries;
      });

      return function cleanup() {
        unwatch();
        for (const key in queries) {
          unsubscribe(queries[key], subscriberId);
        }
      };
    },
  };
}
