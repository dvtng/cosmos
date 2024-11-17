import stableStringify from "safe-stable-stringify";
import type { Query } from "./core-types";
import type { GetterModel } from "./templates/getter-model";
import { fromGetterModel, isGetterModel } from "./templates/getter-model";
import type { DerivedModel } from "./templates/derived-model";
import { fromDerivedModel, isDerivedModel } from "./templates/derived-model";
import {
  fromEmitterModel,
  isEmitterModel,
  type EmitterModel,
} from "./templates/emitter-model";

export function model<T, P extends object | void = void>(
  m: GetterModel<T, P> | EmitterModel<T, P> | DerivedModel<T, P>
) {
  // TODO make it easier to add new model templates
  const genericModel = isGetterModel<T, P>(m)
    ? fromGetterModel(m)
    : isEmitterModel<T, P>(m)
    ? fromEmitterModel(m)
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
