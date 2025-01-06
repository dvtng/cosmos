import { Suspense } from "react";
import { Clock } from "./clock";
import { CounterOnFocusView } from "./counter-on-focus";
import { Counters } from "./counters";
import { CoinPriceView } from "./coin-price";
import { ErrorBoundary } from "./error-boundary";
import { CosmosDev } from "@dvtng/cosmos/src/v2/dev";

export function App() {
  return (
    <div className="space-y-4 p-8">
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="panel">
            <h2>Clock</h2>
            <Clock />
          </div>
          <Counters />
          <div className="panel">
            <h2>Counter on focus</h2>
            <CounterOnFocusView />
          </div>
          <div className="panel">
            <h2>BTC price</h2>
            <CoinPriceView coinId="btc-bitcoin" />
          </div>
        </Suspense>
      </ErrorBoundary>
      <CosmosDev />
    </div>
  );
}
