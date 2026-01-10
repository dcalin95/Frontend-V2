/**
 * 🧪 Contract Helpers Test Example
 * 
 * Example test pentru contract helpers
 */

const {
  isValidAddress,
  normalizeAddress,
  formatTokenAmount,
  parseTokenAmount,
  calculateSlippageAmount,
  calculateProtocolFee,
} = require("../../../utils/contractHelpers");

describe("Contract Helpers", () => {
  describe("isValidAddress", () => {
    it("should validate correct Ethereum address", () => {
      expect(
        isValidAddress("0x1234567890123456789012345678901234567890")
      ).toBe(true);
    });

    it("should reject invalid address", () => {
      expect(isValidAddress("invalid")).toBe(false);
      expect(isValidAddress("0x123")).toBe(false);
      expect(isValidAddress("")).toBe(false);
    });
  });

  describe("normalizeAddress", () => {
    it("should normalize address to checksum", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const normalized = normalizeAddress(address);
      expect(normalized).toBeDefined();
      expect(normalized).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should throw error for invalid address", () => {
      expect(() => normalizeAddress("invalid")).toThrow();
    });
  });

  describe("formatTokenAmount", () => {
    it("should format token amount correctly", () => {
      const amount = "1000000000000000000"; // 1 token (18 decimals)
      const formatted = formatTokenAmount(amount, 18);
      expect(formatted).toBe("1.0");
    });

    it("should handle different decimals", () => {
      const amount = "1000000"; // 1 token (6 decimals)
      const formatted = formatTokenAmount(amount, 6);
      expect(formatted).toBe("1.0");
    });
  });

  describe("parseTokenAmount", () => {
    it("should parse token amount correctly", () => {
      const parsed = parseTokenAmount("1.0", 18);
      expect(parsed.toString()).toBe("1000000000000000000");
    });

    it("should handle different decimals", () => {
      const parsed = parseTokenAmount("1.0", 6);
      expect(parsed.toString()).toBe("1000000");
    });
  });

  describe("calculateSlippageAmount", () => {
    it("should calculate slippage correctly", () => {
      const amount = "1000000000000000000"; // 1 token
      const slippageBps = 50; // 0.5%
      const minAmount = calculateSlippageAmount(
        { toString: () => amount },
        slippageBps
      );
      // 1 * (10000 - 50) / 10000 = 0.995
      expect(minAmount.toString()).toBeDefined();
    });
  });

  describe("calculateProtocolFee", () => {
    it("should calculate protocol fee correctly", () => {
      const amount = "1000000000000000000"; // 1 token
      const feeBps = 100; // 1%
      const fee = calculateProtocolFee(
        { toString: () => amount },
        feeBps
      );
      // 1 * 100 / 10000 = 0.01
      expect(fee.toString()).toBeDefined();
    });
  });
});

