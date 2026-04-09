import { type TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

export {};
declare module "bun:test" {
  interface Matchers<T> extends TestingLibraryMatchers<any, T> {}
}
