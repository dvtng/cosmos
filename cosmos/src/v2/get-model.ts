import type { Spec, State } from "./core";
import { getPromise, initSpace } from "./cosmos";
import type { Ready } from "./later";

export type GetModelResult<T> = State<T> & PromiseShape<State<Ready<T>>>;

type PromiseShape<T> = {
  then: Promise<T>["then"];
  catch: Promise<T>["catch"];
  finally: Promise<T>["finally"];
};

export function getModel<T>(spec: Spec<T>): GetModelResult<T> {
  const space = initSpace(spec);
  return {
    ...space.state,
    get then() {
      return getPromise(spec).then;
    },
    get catch() {
      return getPromise(spec).catch;
    },
    get finally() {
      return getPromise(spec).finally;
    },
  };
}
