import { isError, isLoading, type Ready } from "./later";

export type Cases<T, TValue, TLoading, TError> = {
  value?: (value: Ready<T>) => TValue;
  loading?: () => TLoading;
  error?: (error: Error) => TError;
};

export type Mapper<T, TDefaultValue, TDefaultLoading, TDefaultError> = <
  TValue = TDefaultValue,
  TLoading = TDefaultLoading,
  TError = TDefaultError
>(
  cases: Cases<T, TValue, TLoading, TError>
) => TValue | TLoading | TError;

export function createMapper<T, TDefaultValue, TDefaultLoading, TDefaultError>(
  getValue: () => T,
  defaults: Required<Cases<T, TDefaultValue, TDefaultLoading, TDefaultError>>
): Mapper<T, TDefaultValue, TDefaultLoading, TDefaultError> {
  return (<TValue, TLoading, TError>(
    cases: Cases<T, TValue, TLoading, TError>
  ) => {
    const value = getValue();

    if (isError(value)) {
      return (cases.error ?? defaults.error)(value);
    }

    if (isLoading(value)) {
      return (cases.loading ?? defaults.loading)();
    }

    return (cases.value ?? defaults.value)(value as Ready<T>);
  }) as Mapper<T, TDefaultValue, TDefaultLoading, TDefaultError>;
}
