import { proxy } from "valtio";

export const devState = proxy({
  isOpen: false,
});
