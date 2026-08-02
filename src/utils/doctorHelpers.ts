// Ported 1:1 from src/pages/NearbyClinicPage.jsx (Web) — doctor display
// helpers used by the facility-scoped doctor list/detail (Web has no
// standalone doctor browsing outside a facility context).
import { Doctor } from "@/src/types/doctor";
import { normalizeSearchText } from "@/src/utils/facilityNormalize";

export function getDoctorImageUrl(doctor: Doctor) {
  return doctor?.imageUrl || doctor?.avatarUrl || doctor?.photoUrl || "";
}

export function getDoctorName(doctor: Doctor) {
  return doctor?.fullName || "Bác sĩ chưa cập nhật tên";
}

export function getDoctorSpecialty(doctor: Doctor) {
  return doctor?.departmentName || doctor?.specialty || "Chưa cập nhật chuyên khoa";
}

const ROLE_LABELS: Record<string, string> = {
  doctor: "Bác sĩ",
  deputyhead: "Phó khoa",
  head: "Trưởng khoa",
  leadingexpert: "Chuyên gia đầu ngành",
  consultant: "Cố vấn chuyên môn",
};

export function getDoctorRoleLabel(doctor: Doctor) {
  const role = doctor?.departmentRoleName || doctor?.departmentRole || "";
  const normalizedRole = normalizeSearchText(role);
  return ROLE_LABELS[normalizedRole] || role;
}
