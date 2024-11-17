import type { Model } from "../core-types";

/**
 * An EmitterModel represents data sources that emit values over time, such as
 * websockets or event listeners.
 */
export type EmitterModel<T, P extends object | void> = {
  type: string;
  emitter: (emit: (value: T) => void, params: P) => void | (() => void);
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
      const emit = (value: T) => (atom.value = value);
      return model.emitter(emit, params);
    },
  };
}
