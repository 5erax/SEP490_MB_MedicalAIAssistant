import { normalizeAuthSession } from "@/src/services/authService";

describe("normalizeAuthSession", () => {
  it("keeps the server identity and computes first-login setup state", () => {
    const session = normalizeAuthSession({
      success: true,
      data: {
        accessToken: "header.payload.signature",
        email: "patient@example.com",
        roles: ["Patient"],
        firstLogin: true,
        isProfileCompleted: false,
      },
    });

    expect(session).toMatchObject({
      email: "patient@example.com",
      firstLogin: true,
      isFirstLogin: true,
      isProfileCompleted: false,
    });
  });

  it("never creates an authenticated session without an access token", () => {
    expect(normalizeAuthSession({ success: true, data: {} as never })).toBeNull();
  });
});

