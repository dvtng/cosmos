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
  const [weather] = useModel(Weather({ latitude, longitude }));

  return <img src={weather ? weather.iconUrl : placeholderIconUrl} />;
}
```

We can use suspense if preferred using `waitFor`:

```tsx
function WeatherIcon({ latitude, longitude }) {
  const [weather] = waitFor(useModel(Weather({ latitude, longitude })));

  return <img src={weather.iconUrl} />;
}
```

Models can also represent data sources that continuously emit data, such as
websockets or event listeners:

```ts
const MyLocation = model({
  type: "MyLocation",
  emitter(emit) {
    const id = navigator.geolocation.watchPosition((position) => {
      emit(position.coords);
    });
    // Stop watching when this model is no longer used
    return () => {
      clearWatch(id);
    };
  },
});
```

If we frequently need to get the weather at the current location, we can combine
these two models into one:

```ts
const MyWeather = model({
  type: "MyWeather",
  derive(getModel) {
    const [coords] = waitFor(getModel(MyLocation()));
    return getModel(Weather(coords));
  },
});

function MyWeatherIcon() {
  const [myWeather] = waitFor(useModel(MyWeather()));

  return <img src={myWeather.iconUrl} />;
}
```

Cosmos automatically tracks the dependencies of MyWeather so that it updates
whenever either MyLocation or Weather updates.

It also tracks usages of each model so that they are initialized once when used
by a component, and then cleaned up when no longer needed.
