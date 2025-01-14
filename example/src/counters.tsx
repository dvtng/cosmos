import { compute, getModel, model, useModel } from "@dvtng/cosmos/src/v2";
import { AppState } from "./app-state";
import { Counter } from "./counter";
import { CounterView } from "./counter";
import { Fragment } from "react/jsx-runtime";
import NumberFlow from "@number-flow/react";

const CounterTotal = model("CounterTotal", () => {
  return compute((get) => {
    return get(AppState()).value.counters.reduce((acc, id) => {
      return acc + get(Counter(id)).value;
    }, 0);
  });
});

const RoundedCounterTotal = model("RoundedCounterTotal", (nearest: number) => {
  return compute((get) => {
    return Math.round(get(CounterTotal()).value / nearest) * nearest;
  });
});

export function Counters() {
  const appState = useModel(AppState());

  return (
    <div className="panel">
      <div className="flex items-center justify-between">
        <h2>Counters ({appState.value.counters.length})</h2>
        <button
          className="btn"
          onClick={() => {
            const appState = getModel(AppState());
            appState.value.counters.push(appState.value.nextCounterId++);
          }}
        >
          Add Counter
        </button>
      </div>
      {appState.value.counters.length > 0 && <CountersTable />}
    </div>
  );
}

function CountersTable() {
  const appState = useModel(AppState());
  const counterTotal = useModel(CounterTotal());
  const roundedCounterTotal = useModel(RoundedCounterTotal(10));

  return (
    <div className="grid grid-cols-[auto_1fr] *:p-3">
      <div className="contents *:p-3 *:border-b font-bold">
        <span>Total</span>
        <span className="text-right">
          <NumberFlow value={counterTotal.value} />
        </span>
        <span>Rounded (nearest 10)</span>
        <span className="text-right">
          <NumberFlow value={roundedCounterTotal.value} />
        </span>
      </div>
      {appState.value.counters.map((id) => (
        <Fragment key={id}>
          <span>
            Counter {id}{" "}
            <button
              className="link"
              onClick={() => {
                const appState = getModel(AppState());
                appState.value.counters = appState.value.counters.filter(
                  (_id) => _id !== id
                );
              }}
            >
              Remove
            </button>
          </span>
          <span className="text-right">
            <CounterView id={id} />
          </span>
        </Fragment>
      ))}
    </div>
  );
}
