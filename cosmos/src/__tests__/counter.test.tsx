import { test, expect } from "bun:test";
import { model, useModel, setModel, value, forget, deleteModel } from "..";
import { render, screen, act } from "@testing-library/react";
import { afterEach } from "bun:test";

const Counter = model(() => [value(0), forget()]);

afterEach(() => {
  deleteModel(Counter());
});

function CounterView() {
  const counter = useModel(Counter());
  return <div>{counter.value}</div>;
}

test("useModel", async () => {
  const { unmount } = render(<CounterView />);
  expect(screen.getByText("0")).toBeInTheDocument();

  // Increment the counter
  act(() => {
    setModel(Counter(), (state) => {
      state.value++;
    });
  });

  // Expect the counter to be 1
  expect(screen.getByText("1")).toBeInTheDocument();

  // Unmount the component, and wait for the keep-alive period to expire
  unmount();
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Render the component again, and expect the counter to be reset to 0
  render(<CounterView />);
  expect(screen.getByText("0")).toBeInTheDocument();
});
