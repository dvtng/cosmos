import React from "react";
import { test, expect } from "bun:test";
import { model, useModel } from "..";
import { setSmartTimeout } from "../set-smart-timeout";
import { render, screen } from "@testing-library/react";

const Counter = model(() => {
  return {
    value: 0,
    onStart(state) {
      return setSmartTimeout(() => {
        state.value++;
      }, 1000);
    },
  };
});

test("useModel", () => {
  function CounterView() {
    const counter = useModel(Counter());
    return <div>{counter.value}</div>;
  }

  render(<CounterView />);
  expect(screen.getByText("0")).toBeInTheDocument();
});
