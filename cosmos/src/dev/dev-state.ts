import { useState, useCallback } from "react";

let _isOpen = false;
const listeners = new Set<() => void>();

export function useDevState() {
  const [isOpen, setIsOpen] = useState(_isOpen);

  const toggle = useCallback(() => {
    _isOpen = !_isOpen;
    setIsOpen(_isOpen);
    for (const listener of listeners) {
      listener();
    }
  }, []);

  const close = useCallback(() => {
    _isOpen = false;
    setIsOpen(false);
    for (const listener of listeners) {
      listener();
    }
  }, []);

  return { isOpen, toggle, close };
}
