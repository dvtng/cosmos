import stableStringify from "safe-stable-stringify";

const serializedArgsSymbol = Symbol("serializedArgs");

export function serializeArgs<TArgs extends any[]>(args: TArgs) {
  const _args = args as { [serializedArgsSymbol]?: string };
  if (!_args[serializedArgsSymbol]) {
    _args[serializedArgsSymbol] = stableStringify(args);
  }
  return _args[serializedArgsSymbol]!;
}
