import { Clock } from "./clock";
import { CounterView } from "./counter";

export function App() {
  return (
    <div className="space-y-4 p-8">
      <div>
        Clock: <Clock />
      </div>
      <div>
        Counter: <CounterView />
      </div>
    </div>
  );
}
