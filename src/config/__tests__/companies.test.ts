import { describe, expect, it } from "vitest";
import { companyForPlate, serviceCompanies } from "../companies";

describe("companyForPlate", () => {
  it("uses the listed owner for known plates, ignoring case and dashes", () => {
    expect(companyForPlate("qwe-1a23")?.id).toBe("transvale");
    expect(companyForPlate("RTY2B34")?.id).toBe("rota-sertaneja");
  });

  it("always maps an unknown plate to the same company", () => {
    const first = companyForPlate("ABC1D23");
    expect(first).toBeDefined();
    expect(serviceCompanies).toContain(first);
    expect(companyForPlate("ABC1D23")).toBe(first);
  });

  it("returns nothing without a plate", () => {
    expect(companyForPlate(undefined)).toBeUndefined();
  });
});
