const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";

const noop = () => {};

export function addWindowListener(event: string, handler: () => void) {
  if (!hasWindow) {
    return noop;
  }

  window.addEventListener(event, handler);
  return () => {
    window.removeEventListener(event, handler);
  };
}

export function addDocumentListener(event: string, handler: () => void) {
  if (!hasDocument) {
    return noop;
  }

  document.addEventListener(event, handler);
  return () => {
    document.removeEventListener(event, handler);
  };
}
