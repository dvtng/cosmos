import { test, expect } from "bun:test";
import { model, useModel, setModel } from "..";
import { render, screen, act } from "@testing-library/react";

const Counter = model(() => {
  return {
    value: 0,
  };
});

test("useModel", () => {
  const spec = Counter();

  function CounterView() {
    const counter = useModel(spec);
    return <div>{counter.value}</div>;
  }

  render(<CounterView />);
  expect(screen.getByText("0")).toBeInTheDocument();

  act(() => {
    setModel(spec, (draft) => {
      draft.value++;
    });
  });

  expect(screen.getByText("1")).toBeInTheDocument();
});
