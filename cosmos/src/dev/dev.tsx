import {
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cosmos } from "../cosmos";
import { ModelView } from "./model-view";
import { useDevState } from "./dev-state";

/** Mirrors `react-dom`'s `createPortal` so this file does not depend on `react-dom` types. */
type CreatePortal = (
  children: ReactNode,
  container: Element | DocumentFragment,
  key?: string | null,
) => ReactNode;

function useOptionalCreatePortal(): CreatePortal | null {
  const [createPortal, setCreatePortal] = useState<
    CreatePortal | null | undefined
  >(undefined);

  useLayoutEffect(() => {
    let cancelled = false;
    import("react-dom")
      .then((m) => {
        // Must wrap: passing a function to setState is interpreted as an updater,
        // not as storing that function as state (would call createPortal(prevState, …)).
        if (!cancelled) setCreatePortal(() => m.createPortal);
      })
      .catch(() => {
        if (!cancelled) setCreatePortal(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!createPortal) {
    return null;
  }
  return createPortal;
}

/** Stable empty snapshot for `getServerSnapshot` and empty client state. */
const EMPTY_KEYS: string[] = [];

let cachedCosmosKeysFingerprint = "";
let cachedCosmosKeys: string[] = EMPTY_KEYS;

function getCosmosModelKeysSnapshot(): string[] {
  const keys = Object.keys(cosmos.spaces);
  const fingerprint = keys.slice().sort().join("\0");
  if (fingerprint !== cachedCosmosKeysFingerprint) {
    cachedCosmosKeysFingerprint = fingerprint;
    cachedCosmosKeys = keys.length === 0 ? EMPTY_KEYS : keys;
  }
  return cachedCosmosKeys;
}

function useCosmosKeys() {
  return useSyncExternalStore(
    () => () => {},
    getCosmosModelKeysSnapshot,
    () => EMPTY_KEYS,
  );
}

export function CosmosDev() {
  const keys = useCosmosKeys();
  const { isOpen, toggle, close } = useDevState();

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
        onClick={toggle}
      >
        Cosmos
      </button>

      {isOpen && (
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
            <button onClick={close}>Close</button>
          </div>
          {keys.map((key) => (
            <ModelView key={key} modelKey={key} />
          ))}
        </div>
      )}
    </div>
  );

  const createPortal = useOptionalCreatePortal();
  if (!createPortal) {
    return content;
  }
  return createPortal(content, document.body);
}
