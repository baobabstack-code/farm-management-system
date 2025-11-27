import { z } from "zod";
import { validateDashboardQueryParams } from "@/lib/validations/dashboard";

describe("validateDashboardQueryParams", () => {
  test("accepts includeInactive as string 'true' and returns boolean true", () => {
    const parsed = validateDashboardQueryParams({ includeInactive: "true" });
    expect(parsed.includeInactive).toBe(true);
  });

  test("accepts includeInactive as string 'false' and returns boolean false", () => {
    const parsed = validateDashboardQueryParams({ includeInactive: "false" });
    expect(parsed.includeInactive).toBe(false);
  });

  test("accepts includeInactive as boolean true and returns boolean true", () => {
    const parsed = validateDashboardQueryParams({ includeInactive: true });
    expect(parsed.includeInactive).toBe(true);
  });

  test("accepts missing includeInactive and returns undefined", () => {
    const parsed = validateDashboardQueryParams({});
    expect(parsed.includeInactive).toBeUndefined();
  });

  test("parses valid startDate and endDate strings", () => {
    const parsed = validateDashboardQueryParams({
      startDate: "2021-01-01T00:00:00.000Z",
      endDate: "2021-01-31T23:59:59.000Z",
    });
    expect(parsed.startDate).toBe("2021-01-01T00:00:00.000Z");
    expect(parsed.endDate).toBe("2021-01-31T23:59:59.000Z");
  });

  test("throws on invalid date string", () => {
    expect(() =>
      validateDashboardQueryParams({ startDate: "not-a-date" })
    ).toThrow(z.ZodError);
  });
});
