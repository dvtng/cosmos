```ts
const LocationName = model(
  args((coord: Coord) => [coord.lat.toFixed(4), coord.lon.toFixed(4)]),
  request(fetchLocationName),
  refresh(fetchLocationName, { minutes: 10 }),
  persist("LocationName"),
  { forget: { days: 30 } }
);

const LocationName = model(
  {
    name: "LocationName",
    args: (coord: Coord) => [coord.lat.toFixed(4), coord.lon.toFixed(4)],
  },
  (coord: Coord) => {
    return [
      request(() => fetchLocationName(coord)),
      refresh(() => fetchLocationName(coord), { minutes: 10 }),
      persist("LocationName"),
      { forget: { days: 30 } },
    ];
  }
);

const LocationName = model("LocationName", (coord: Coord) => {
  return [
    request(() => fetchLocationName(coord)),
    refresh(() => fetchLocationName(coord), { minutes: 10 }),
    persist("LocationName"),
    { forget: { days: 30 } },
  ];
});

useModel({
  name: "LocationName",
  args: [{ lat: 2, lon: 3 }],
  resolve: () => {
    return [request(() => fetchLocationName({ lat: 2, lon: 3 }))];
  },
});

const LocationName = model({
  args: (coord: Coord) => [coord.lat.toFixed(4), coord.lon.toFixed(4)],
});

const CounterRounded = model(
  computed((id: number) => {
    return get(Counter(id)).value;
  })
);

const Counter = model(
  value(() => 0),
  interval(
    (state) => {
      state.value++;
    },
    { seconds: 1 }
  )
);
```
