import { AuthSession } from "@/src/types/auth";
import { normalizeRoles } from "./roles";

export function hasPremiumAccess(session?: AuthSession | null) {
  const planName = String(session?.planName ?? session?.subscriptionPlan ?? session?.plan ?? "").toLowerCase();
  const subscriptionStatus = String(session?.subscriptionStatus ?? session?.subscription?.status ?? "").toLowerCase();
  const roles = normalizeRoles(session?.roles);

  return Boolean(
    session?.isPremium ||
      session?.isSubscribed ||
      session?.hasPremiumAccess ||
      planName.includes("premium") ||
      planName.includes("medimate+") ||
      subscriptionStatus === "active" ||
      roles.includes("admin") ||
      roles.includes("staff"),
  );
}

