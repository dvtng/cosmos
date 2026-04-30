import { test, expect } from "bun:test";
import { model, useModel, setModel, value } from "..";
import { render, screen, act } from "@testing-library/react";

const Counter = model(() => value(0));

function CounterView() {
  const counter = useModel(Counter());
  return <div>{counter.value}</div>;
}

test("useModel", () => {
  render(<CounterView />);
  expect(screen.getByText("0")).toBeInTheDocument();

  act(() => {
    setModel(Counter(), (state) => {
      state.value++;
    });
  });

  expect(screen.getByText("1")).toBeInTheDocument();
});
