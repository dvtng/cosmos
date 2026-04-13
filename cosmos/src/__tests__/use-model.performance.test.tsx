import React from "react";
import { expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { model, useModel, value } from "..";
import { cosmos } from "../cosmos";

const ITEM_COUNT = 10_000;
const RENDER_RUNS = 100;

function createItems() {
  return Array.from({ length: ITEM_COUNT }, (_, index) => ({
    id: index,
    label: `item-${index}`,
    value: index,
  }));
}

function UseStateView() {
  const [items] = React.useState(() => createItems());
  const sum = items.reduce((total, item) => {
    return total + item.value;
  }, 0);

  return <div>{sum}</div>;
}

const Model = model("Model", () => {
  return value({
    items: createItems(),
  });
});

function UseModelView() {
  const { items } = useModel(Model()).value;
  const sum = items.reduce((total, item) => {
    return total + item.value;
  }, 0);

  return <div>{sum}</div>;
}

function renderManyTimes(
  component: React.ReactElement,
  onAfterRender?: () => void,
) {
  for (let index = 0; index < RENDER_RUNS; index++) {
    const { container, unmount } = render(component);
    void container.textContent;
    unmount();
    onAfterRender?.();
  }
}

test(`benchmark useModel vs useState`, () => {
  const useStateStart = performance.now();
  renderManyTimes(<UseStateView />);
  const useStateDuration = performance.now() - useStateStart;
  console.log(`useState x${RENDER_RUNS} took ${useStateDuration.toFixed(2)}ms`);

  const useModelStart = performance.now();
  renderManyTimes(<UseModelView />, () => {
    // Clear cache
    cosmos.spaces["Model"] = {};
  });
  const useModelDuration = performance.now() - useModelStart;
  console.log(`useModel x${RENDER_RUNS} took ${useModelDuration.toFixed(2)}ms`);

  const ratio = useModelDuration / useStateDuration;
  expect(ratio).toBeLessThan(1);
});
