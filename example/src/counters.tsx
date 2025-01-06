import { compute, model, setModel, useModel } from "@dvtng/cosmos/src/v2";
import { AppState } from "./app-state";
import { Counter } from "./counter";
import { CounterView } from "./counter";
import { Fragment } from "react/jsx-runtime";
import NumberFlow from "@number-flow/react";

const CounterTotal = model(() => {
  return compute((get) => {
    return get(AppState()).value.counters.reduce((acc, id) => {
      return acc + get(Counter(id)).value;
    }, 0);
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
            setModel(AppState(), (state) => {
              const id = state.value.nextCounterId++;
              state.value.counters.push(id);
            });
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

  return (
    <div className="grid grid-cols-[auto_1fr] *:p-3">
      <div className="contents *:p-3 *:border-b font-bold">
        <span>Total</span>
        <span className="text-right">
          <NumberFlow value={counterTotal.value} />
        </span>
      </div>
      {appState.value.counters.map((id) => (
        <Fragment key={id}>
          <span>
            Counter {id}{" "}
            <button
              className="link"
              onClick={() => {
                setModel(AppState(), (state) => {
                  state.value.counters = state.value.counters.filter(
                    (_id) => _id !== id
                  );
                });
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
