# cosmos

Proof of concept for a flexible data-fetching framework for React.

## Core concepts

Data sources are described using models:

```ts
const Weather = model({
  type: "Weather",
  refresh: { minutes: 5 },
  get({ lat, long }) {
    return fetch(`https://weather.example.com/${lat}/${long}`).then((resp) =>
      resp.json()
    );
  },
});
```

Models can then be queried inside components:

```tsx
function WeatherIcon({ lat, long }) {
  const weather = useModel(Weather({ lat, long }));

  return <img src={weather ? weather.iconUrl : placeholderIconUrl} />;
}
```

We can use suspense if preferred by passing `{ wait: true }`:

```tsx
function WeatherIcon({ lat, long }) {
  const weather = useModel(Weather({ lat, long }), { wait: true });

  return <img src={weather.iconUrl} />;
}
```
