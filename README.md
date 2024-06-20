# cosmos

Proof of concept for a flexible data-fetching framework for React.

## Core concepts

Data sources are described using models:

```ts
const Weather = model({
  type: "Weather",
  refresh: { minutes: 5 },
  get({ latitude, longitude }) {
    return fetch(`https://weather.example.com/${latitude}/${latitude}`).then(
      (resp) => resp.json()
    );
  },
});
```

Models can then be queried inside components:

```tsx
function WeatherIcon({ latitude, longitude }) {
  const weather = useModel(Weather({ latitude, longitude }));

  return <img src={weather ? weather.iconUrl : placeholderIconUrl} />;
}
```

We can use suspense if preferred by passing `{ wait: true }`:

```tsx
function WeatherIcon({ latitude, longitude }) {
  const weather = useModel(Weather({ latitude, longitude }), { wait: true });

  return <img src={weather.iconUrl} />;
}
```

Models can also represent data sources that continuously emit data, such as
websockets or event listeners:

```ts
const MyLocation = model({
  type: "MyLocation",
  emitter(_, { emit }) {
    const id = navigator.geolocation.watchPosition((position) => {
      emit(position.coords);
    });
    return () => {
      clearWatch(id);
    };
  },
});
```

If we're frequently wanting the weather at the current location, we can combine
these two models into one:

```ts
const MyWeather = model({
  type: "MyWeather",
  derive(getModel) {
    const coords = getModel(MyLocation(), { wait: true });
    return getModel(Weather(coords));
  },
});

function MyWeatherIcon() {
  const myWeather = useModel(MyWeather(), { wait: true });

  return <img src={myWeather.iconUrl} />;
}
```

Cosmos automatically tracks the dependencies of MyWeather so that it updates
whenever either MyLocation or Weather updates.
