import type { Model } from "../core-types";

/**
 * An EmitterModel represents data sources that emit values over time, such as
 * websockets or event listeners.
 */
export type EmitterModel<T, P extends object | void> = {
  type: string;
  emitter: (params: P, tools: Tools<T>) => () => void;
};

type Tools<T> = {
  emit(value: T): void;
};

export function isEmitterModel<T, P extends object | void>(
  model: any
): model is EmitterModel<T, P> {
  return "emitter" in model;
}

export function fromEmitterModel<T, P extends object | void>(
  model: EmitterModel<T, P>
): Model<T, P> {
  return {
    type: model.type,
    init({ params, atom }) {
      // Emitter models are trivially simple because generic models are
      // essentially the same thing.
      return model.emitter(params, { emit: (value) => (atom.value = value) });
    },
  };
}
