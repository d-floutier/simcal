import { describe, expect, it } from "vitest";
import { jourCalendaire } from "@/core";

describe("jourCalendaire", () => {
  it("donne la date de calendrier locale dans le fuseau de l'utilisateur", () => {
    expect(jourCalendaire(new Date("2026-03-10T12:00:00Z"), "Europe/Paris")).toBe("2026-03-10");
  });

  it("compte un dîner tardif pour le bon jour", () => {
    // 23 h 30 à Paris l'hiver = 22 h 30 UTC, toujours le 10
    expect(jourCalendaire(new Date("2026-01-10T22:30:00Z"), "Europe/Paris")).toBe("2026-01-10");
    // 0 h 30 à Paris = 23 h 30 UTC la veille : c'est déjà le 11
    expect(jourCalendaire(new Date("2026-01-10T23:30:00Z"), "Europe/Paris")).toBe("2026-01-11");
  });

  it("suit un fuseau à l'ouest de UTC", () => {
    expect(jourCalendaire(new Date("2026-01-11T03:00:00Z"), "America/New_York")).toBe("2026-01-10");
  });
});
