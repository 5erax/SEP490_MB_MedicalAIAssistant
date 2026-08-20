import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { DoctorRecoveryWorkspace } from "@/src/components/doctor/DoctorRecoveryWorkspace";
import { doctorRecoveryService } from "@/src/services/doctorRecoveryService";

jest.mock("@/src/hooks/useLogout", () => ({ useLogout: () => ({ logout: jest.fn(), loggingOut: false }) }));
jest.mock("@/src/services/doctorRecoveryService", () => ({
  doctorRecoveryService: {
    listOpen: jest.fn(),
    listMine: jest.fn(),
    feedbackAnalytics: jest.fn(),
    get: jest.fn(),
    getClinicalContext: jest.fn(),
    accept: jest.fn(),
    startReview: jest.fn(),
    release: jest.fn(),
    reject: jest.fn(),
  },
}));

const api = doctorRecoveryService as jest.Mocked<typeof doctorRecoveryService>;

describe("DoctorRecoveryWorkspace", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.feedbackAnalytics.mockResolvedValue({ data: undefined });
  });

  it("renders loading then an empty queue", async () => {
    api.listOpen.mockResolvedValue({ data: { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0 } });
    const screen = render(<DoctorRecoveryWorkspace />);
    expect(screen.getByText("Đang tải yêu cầu...")).toBeTruthy();
    expect(await screen.findByText("Chưa có yêu cầu đang chờ")).toBeTruthy();
  });

  it("renders API data and submits the real accept action boundary", async () => {
    api.listOpen.mockResolvedValue({ data: { items: [{ id: "request-1", diseaseGroup: "respiratory", status: "waitingForDoctor", requestedAt: "2026-08-20T00:00:00Z" }], pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1 } });
    api.accept.mockResolvedValue({ success: true });
    const screen = render(<DoctorRecoveryWorkspace />);
    const accept = await screen.findByText("Nhận yêu cầu");
    fireEvent.press(accept);
    await waitFor(() => expect(api.accept).toHaveBeenCalledWith("request-1"));
  });

  it("shows a safe API error state", async () => {
    api.listOpen.mockRejectedValue(new Error("Không thể kết nối dịch vụ"));
    const screen = render(<DoctorRecoveryWorkspace />);
    expect(await screen.findByText("Không thể kết nối dịch vụ")).toBeTruthy();
  });
});
