import { canReconcilePayment, getReconcileErrorMessage } from "@/src/utils/paymentPresentation";
import { hasPremiumAccess } from "@/src/utils/premium";
import { getResultStatusPresentation } from "@/src/utils/labTestPresentation";

describe("Business risk resolvers", () => {
  it("does not grant Premium from an elevated role", () => {
    expect(hasPremiumAccess({ accessToken: "token", roles: ["Admin"] })).toBe(false);
    expect(hasPremiumAccess({ accessToken: "token", subscriptionStatus: "active" })).toBe(true);
  });

  it("reconciles only pending PayOS transactions with an order reference", () => {
    expect(canReconcilePayment({ id: "1", status: "pending", provider: "payos", transactionReference: "123" })).toBe(true);
    expect(canReconcilePayment({ id: "1", status: "paid", provider: "payos", transactionReference: "123" })).toBe(false);
    expect(getReconcileErrorMessage({ status: 409 })).toContain("không khớp");
  });

  it("fails safely for an unknown lab status", () => {
    expect(getResultStatusPresentation("unexpected" as never)).toEqual({ label: "Chưa xác định", tone: "neutral" });
  });
});
