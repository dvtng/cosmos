import { useSnapshot } from "valtio";
import { cosmos } from "../cosmos";
import { ModelView } from "./model-view";
import { createPortal } from "react-dom";
import { devState } from "./dev-state";

export function CosmosDev() {
  const $state = useSnapshot(cosmos);
  const $devState = useSnapshot(devState);
  const keys = Object.keys($state.states);

  const content = (
    <div
      style={{
        background: "black",
        color: "white",
        isolation: "isolate",
        fontFamily: "monospace",
        fontSize: 14,
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 1000,
      }}
    >
      <button
        style={{
          border: "1px solid white",
          color: "white",
          cursor: "pointer",
          padding: 10,
        }}
        onClick={() => (devState.isOpen = !devState.isOpen)}
      >
        Cosmos
      </button>

      {$devState.isOpen && (
        <div
          style={{
            background: "black",
            border: "1px solid white",
            maxHeight: "calc(100dvh - 16px)",
            overflowY: "auto",
            padding: 10,
            position: "absolute",
            top: 0,
            right: 0,
            width: "300px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => (devState.isOpen = false)}>Close</button>
          </div>
          {keys.map((key) => (
            <ModelView key={key} modelKey={key} />
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
