import { existsSync } from "node:fs";
import MCR from "monocart-coverage-reports";
import { coverageOptions } from "./coverage";

/** After all tests: merges what each test collected into coverage-e2e/ (only the "coverage" project collects). */
export default async function globalTeardown() {
  if (existsSync(`${coverageOptions.outputDir}/.cache`)) await MCR(coverageOptions).generate();
}
