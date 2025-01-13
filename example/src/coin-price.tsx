import { model, request, useModel } from "@dvtng/cosmos/src/v2";
import NumberFlow from "@number-flow/react";

export const CoinPrice = model((coinId: string) => {
  return request(
    () =>
      fetch(`https://api.coinpaprika.com/v1/tickers/${coinId}`, {
        mode: "cors",
      })
        .then((res) => res.json())
        .then((data) => data.quotes.USD.price as number),
    {
      refresh: {
        seconds: 10,
      },
    }
  );
});

export function CoinPriceView({ coinId }: { coinId: string }) {
  const coinPrice = useModel(CoinPrice(coinId));

  return coinPrice.match({
    loading: () => <div>Loading...</div>,
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
