import { useSnapshot } from "valtio";
import { state } from "../state";
import { QueryView } from "./query-view";

export function ModelView({ modelKey }: { modelKey: string }) {
  const $state = useSnapshot(state);
  const queries = $state.queries[modelKey];

  if (!queries) return null;

  const modelQueries = Object.keys(queries);

  if (modelQueries.length === 0) return null;

  return (
    <div>
      <div style={{ borderBottom: "1px solid #ccc" }}>{modelKey}</div>
      {modelQueries.map((queryKey) => (
        <QueryView key={queryKey} queryKey={queryKey} />
      ))}
    </div>
  );
}
