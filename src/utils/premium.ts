import { AuthSession } from "@/src/types/auth";

// Ported 1:1 from src/services/apiClient.js (Web) — hasPremiumAccess().
// Do not add role-based short-circuits here: Web derives this purely from
// subscription signals, so admin/staff sessions are NOT implicitly premium.
export function hasPremiumAccess(session?: AuthSession | null) {
  const planName = String(session?.planName ?? session?.subscriptionPlan ?? session?.plan ?? "").toLowerCase();
  const subscriptionStatus = String(session?.subscriptionStatus ?? session?.subscription?.status ?? "").toLowerCase();

  return Boolean(
    session?.isPremium ||
      session?.isSubscribed ||
      session?.hasPremiumAccess ||
      planName.includes("premium") ||
      planName.includes("medimate+") ||
      subscriptionStatus === "active",
  );
}

