import { model, persist, request, useModel } from "@dvtng/cosmos/src/v2";
import NumberFlow from "@number-flow/react";

export const CoinPrice = model("CoinPrice", (coinId: string) => {
  return [
    request(() => fetchCoinPrice(coinId), { refresh: { seconds: 10 } }),
    persist("CoinPrice"),
  ];
});

function fetchCoinPrice(coinId: string) {
  return fetch(`https://api.coinpaprika.com/v1/tickers/${coinId}`, {
    mode: "cors",
  })
    .then((res) => res.json())
    .then((data) => data.quotes.USD.price as number);
}

export function CoinPriceView({ coinId }: { coinId: string }) {
  const coinPrice = useModel(CoinPrice(coinId));

  return coinPrice.map({
    loading: () => <div>Loading...</div>,
    error: (error) => <div className="text-red-500">{error.message}</div>,
    value: (value) => (
      <NumberFlow
        value={value}
        format={{
          style: "currency",
          currency: "USD",
        }}
      />
    ),
  });
}
