let nextSubscriberId = 0;

export function getNextSubscriberId() {
  return nextSubscriberId++;
}
