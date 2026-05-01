import { test, expect, afterEach } from "bun:test";
import { model, useModel, deleteModel, refresh } from "..";
import { render, screen, waitFor } from "@testing-library/react";

const startTime = new Date("2024-01-01T00:00:00.000Z");

const MS = 50;

const Clock = model(() => {
  return [
    { value: startTime },
    refresh<Date>({
      interval: { ms: MS },
      run: (ctx) => {
        ctx.set((state) => {
          state.value = new Date(state.value.getTime() + MS);
        });
      },
    }),
  ];
});

afterEach(() => {
  deleteModel(Clock());
});

function ClockView() {
  const time = useModel(Clock());
  return <div data-testid="clock">{time.value.toISOString()}</div>;
}

test("refresh advances clock", async () => {
  render(<ClockView />);
  expect(screen.getByTestId("clock")).toHaveTextContent(
    startTime.toISOString(),
  );

  await waitFor(() => {
    const shown = screen.getByTestId("clock").textContent;
    expect(shown).not.toBe(startTime.toISOString());
    expect(Date.parse(shown!)).toEqual(
      new Date(startTime.getTime() + MS).getTime(),
    );
  });
});
