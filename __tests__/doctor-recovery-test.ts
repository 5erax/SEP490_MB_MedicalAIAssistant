import { ApiError } from "@/src/api/client";
import { getDoctorRecoveryErrorMessage, getDoctorRequestActions } from "@/src/utils/doctorRecovery";

describe("Doctor recovery state/action mapping", () => {
  it("allows only claim for an open request", () => {
    expect(getDoctorRequestActions("waitingForDoctor", false)).toEqual(["accept"]);
  });

  it("requires review before plan editing", () => {
    expect(getDoctorRequestActions("assigned", false)).toEqual(["startReview", "release", "reject"]);
    expect(getDoctorRequestActions("inReview", false)).toContain("openPlan");
  });

  it("keeps published plans viewable but removes destructive request actions", () => {
    expect(getDoctorRequestActions("published", true)).toEqual(["openPlan"]);
  });

  it("maps conflict without exposing backend detail", () => {
    const error = new ApiError("Database conflict", 409, { code: "RECOVERY_PLAN_REQUEST_ALREADY_CLAIMED" });
    expect(getDoctorRecoveryErrorMessage(error)).toContain("bác sĩ khác");
    expect(getDoctorRecoveryErrorMessage(error)).not.toContain("Database");
  });
});
