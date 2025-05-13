# cosmos

A flexible data-fetching and state management framework for React applications.

## Core Concepts

### Models

Models are the fundamental building blocks of cosmos. They represent data sources and their behaviors:

```ts
const Weather = model({
  name: "Weather",
  args: (latitude: number, longitude: number) => [latitude, longitude],
  resolve: (latitude: number, longitude: number) => ({
    value: fetch(`https://weather.example.com/${latitude}/${longitude}`).then(
      (resp) => resp.json()
    ),
    // Optional behaviors
    forget: { minutes: 5 }, // Cache duration
    onLoad: (state, meta) => {
      console.log(`Weather loaded for ${meta.name}`);
    },
    onStart: (state, meta) => {
      // Setup code
      return () => {
        // Cleanup code
      };
    },
  }),
});
```

### Using Models in Components

Models can be used in React components using the `useModel` hook:

```tsx
function WeatherIcon({ latitude, longitude }) {
  const { value: weather } = useModel(Weather(latitude, longitude));

  if (weather.loading) {
    return <LoadingSpinner />;
  }

  if (weather.error) {
    return <ErrorDisplay error={weather.error} />;
  }

  return <img src={weather.value.iconUrl} />;
}
```

### Derived Models

Models can be composed to create derived models that automatically update when their dependencies change:

```ts
const MyLocation = model({
  name: "MyLocation",
  args: () => [],
  resolve: () => ({
    value: new Promise((resolve) => {
      const id = navigator.geolocation.watchPosition((position) => {
        resolve(position.coords);
      });
      return () => navigator.geolocation.clearWatch(id);
    }),
  }),
});

const MyWeather = model({
  name: "MyWeather",
  args: () => [],
  resolve: async () => {
    const location = await MyLocation();
    return Weather(location.latitude, location.longitude);
  },
});
```

### Features

- **Automatic Dependency Tracking**: Models automatically track their dependencies and update when dependencies change
- **Resource Management**: Models are initialized when used and cleaned up when no longer needed
- **Caching**: Built-in support for caching with configurable durations
- **Lifecycle Hooks**: `onLoad`, `onStart`, `onWrite`, and `onDelete` hooks for fine-grained control
- **Type Safety**: Full TypeScript support
- **Suspense Support**: Compatible with React Suspense for loading states

## Installation

```bash
npm install @dvtng/cosmos
```
