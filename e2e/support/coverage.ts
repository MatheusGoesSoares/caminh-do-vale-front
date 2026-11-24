import { test as base } from "@playwright/test";
import MCR, { type CoverageReportOptions } from "monocart-coverage-reports";

/**
 * Coverage of the screens exercised by the interface tests (npm run test:e2e:coverage, project "coverage").
 * Chrome reports which code ran; the dev server's source maps map it back to src/.
 */
export const coverageOptions: CoverageReportOptions = {
  name: "Cobertura dos testes de interface",
  outputDir: "./coverage-e2e",
  // "raw" keeps the V8 data, so it can be merged with the unit tests' coverage.
  reports: ["console-summary", "json-summary", "json", "v8", "raw"],
  // Only the app's own modules (the dev server serves each one at /src/...), not CSS or libraries.
  entryFilter: (entry) => entry.url.includes("/src/") && !entry.url.includes(".css"),
  sourceFilter: (sourcePath) => !sourcePath.includes("node_modules"),
  // Vite's source maps name only the file ("page.tsx", and there is one per screen): put back the
  // folder of the module it came from (distFile, e.g. "localhost-5180/src/features/trips/page.tsx").
  sourcePath: (filePath, info) => {
    const dist = (info as { distFile?: string } | undefined)?.distFile ?? "";
    if (filePath.includes("/") || !dist.includes("src/")) return filePath;
    return `${dist.slice(dist.indexOf("src/"), dist.lastIndexOf("/") + 1)}${filePath}`;
  },
};

/** Same `test` as Playwright's, collecting coverage in the "coverage" project. */
export const test = base.extend<{ coverage: void }>({
  coverage: [
    async ({ page, browserName }, use) => {
      const collect = test.info().project.name === "coverage" && browserName === "chromium";
      if (collect) await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      if (collect) await MCR(coverageOptions).add(await page.coverage.stopJSCoverage());
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
