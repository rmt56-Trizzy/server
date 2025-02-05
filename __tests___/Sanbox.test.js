import { expect, it, describe } from "@jest/globals";

describe("Sanbox Tests", () => {
  describe("sandbox only", () => {
    it("sandbox testing", async () => {
      expect(1).toBe(1);
    });
  });
});
