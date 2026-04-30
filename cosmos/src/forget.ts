import type { Trait } from "./core";
import { deleteModel } from "./delete-model";

export function forget<T>(): Trait<T> {
  return {
    onStart: ({ meta }) => {
      return () => {
        deleteModel({
          name: meta.name,
          args: meta.args,
          resolve: () => {
            throw new Error("Not implemented");
          },
        });
      };
    },
  };
}
