import stableStringify from "safe-stable-stringify";
import type { Query } from "./core-types";
import type { GetterModel } from "./getter-model";
import { fromGetterModel, isGetterModel } from "./getter-model";
import type { DerivedModel } from "./derived-model";
import { fromDerivedModel, isDerivedModel } from "./derived-model";

export function model<T, P extends object | void = void>(
  m: GetterModel<T, P> | DerivedModel<T, P>
) {
  // TODO make it easier to add new model templates
  const genericModel = isGetterModel<T, P>(m)
    ? fromGetterModel(m)
    : isDerivedModel<T, P>(m)
    ? fromDerivedModel(m)
    : (null as never);

  return function buildQuery(params: P): Query<T, P> {
    return {
      $key: `${genericModel.type}(${serializeParams(params)})`,
      model: genericModel,
      params,
    };
  };
}

function serializeParams<P extends object | void>(params: P) {
  if (params == null) {
    return "";
  }
  return stableStringify(params);
}
