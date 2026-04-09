import React from "react";
import { expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { model, useModel, value } from "..";
import { cosmos } from "../cosmos";

const ITEM_COUNT = 10_000;
const RENDER_RUNS = 25;

function createItems() {
  return Array.from({ length: ITEM_COUNT }, (_, index) => ({
    id: index,
    label: `item-${index}`,
    value: index,
  }));
}

function SimpleView() {
  const [items] = React.useState(() => createItems());
  const sum = items.reduce((total, item) => {
    return total + item.value;
  }, 0);

  return (
    <div>
      {items[0]?.label}:{items[ITEM_COUNT - 1]?.label}

      {sum}
    </div>
  );
}

const Model = model("Model", () => {
  return value({
    items: createItems(),
  });
});

function ModelView() {
  const { items } = useModel(Model()).value;
  const sum = items.reduce((total, item) => {
    return total + item.value;
  }, 0);

  return (
    <div>
      {items[0]?.label}:{items[ITEM_COUNT - 1]?.label}

      {sum}
    </div>
  );
}

function renderManyTimes(component: React.ReactElement, onAfterRender?: () => void) {
  for (let index = 0; index < RENDER_RUNS; index++) {
    const { container, unmount } = render(component);
    void container.textContent;
    unmount();
    onAfterRender?.();
  }
}

test(`benchmark model render vs simple render`, () => {
  const simpleStart = performance.now();
  renderManyTimes(<SimpleView />);
  const simpleDuration = performance.now() - simpleStart;
  console.log(`simple render x${RENDER_RUNS} took ${simpleDuration.toFixed(2)}ms`);

  const modelStart = performance.now();
  renderManyTimes(<ModelView />, () => {
    // Clear cache
    cosmos.spaces["Model"] = {};
  });
  const modelDuration = performance.now() - modelStart;
  console.log(`model render x${RENDER_RUNS} took ${modelDuration.toFixed(2)}ms`);

  const ratio = modelDuration / simpleDuration;
  console.log(`model render is ${ratio.toFixed(2)}x slower than simple render`);
  expect(ratio).toBeLessThan(65);
});

