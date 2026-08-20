import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { AdminWorkspace } from "@/src/components/admin/AdminWorkspace";
import { adminService } from "@/src/services/adminService";
import { doctorManagementApi } from "@/src/services/doctorService";
import { medicalDepartmentsService, usersService } from "@/src/services/domainServices";
import { medicalFacilitiesApi } from "@/src/services/facilityService";

jest.mock("@/src/hooks/useLogout", () => ({ useLogout: () => ({ logout: jest.fn(), loggingOut: false }) }));
jest.mock("@/src/services/adminService", () => ({ adminService: { list: jest.fn() } }));
jest.mock("@/src/services/doctorService", () => ({ doctorManagementApi: { list: jest.fn() } }));
jest.mock("@/src/services/domainServices", () => ({
  usersService: { list: jest.fn() },
  medicalDepartmentsService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));
jest.mock("@/src/services/facilityService", () => ({ medicalFacilitiesApi: { list: jest.fn() } }));

const users = usersService as jest.Mocked<typeof usersService>;
const doctors = doctorManagementApi as jest.Mocked<typeof doctorManagementApi>;
const facilities = medicalFacilitiesApi as jest.Mocked<typeof medicalFacilitiesApi>;
const departments = medicalDepartmentsService as jest.Mocked<typeof medicalDepartmentsService>;
const catalogs = adminService as jest.Mocked<typeof adminService>;

function arrangeSuccess() {
  users.list.mockResolvedValue({ data: { items: [{ id: "u1", displayName: "Quản trị viên", email: "admin@example.com" }], totalCount: 1 } });
  doctors.list.mockResolvedValue({ data: { items: [], totalCount: 0 } });
  facilities.list.mockResolvedValue({ data: { items: [], totalCount: 0 } });
  departments.list.mockResolvedValue({ data: [{ id: "d1", departmentName: "Nội tổng quát", chapterCode: "I" }] });
  catalogs.list.mockResolvedValue({ data: [] });
}

describe("AdminWorkspace", () => {
  beforeEach(() => { jest.clearAllMocks(); arrangeSuccess(); });

  it("renders protected API overview data", async () => {
    const screen = render(<AdminWorkspace />);
    expect(await screen.findByText("Quản trị viên")).toBeTruthy();
    expect(screen.getByText("Nội tổng quát")).toBeTruthy();
  });

  it("validates and submits the representative department CRUD form", async () => {
    departments.create.mockResolvedValue({ success: true });
    const screen = render(<AdminWorkspace />);
    await screen.findByText("Nội tổng quát");
    fireEvent.press(screen.getByText("Thêm"));
    await screen.findByText("Thêm chuyên khoa");
    const submit = screen.getByRole("button", { name: "Lưu chuyên khoa" });
    expect(submit.props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText("Tên chuyên khoa"), "Tim mạch");
    fireEvent.press(screen.getByText("Lưu chuyên khoa"));
    await waitFor(() => expect(departments.create).toHaveBeenCalledWith({ departmentName: "Tim mạch", description: null, chapterCode: null }));
  });

  it("shows a server rejection without reporting success", async () => {
    departments.create.mockRejectedValue(new Error("Tên chuyên khoa đã tồn tại"));
    const screen = render(<AdminWorkspace />);
    await screen.findByText("Nội tổng quát");
    fireEvent.press(screen.getByText("Thêm"));
    await screen.findByText("Thêm chuyên khoa");
    fireEvent.changeText(screen.getByLabelText("Tên chuyên khoa"), "Nội tổng quát");
    fireEvent.press(screen.getByText("Lưu chuyên khoa"));
    expect(await screen.findByText("Tên chuyên khoa đã tồn tại")).toBeTruthy();
  });
});
