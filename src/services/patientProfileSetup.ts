// Ported from src/services/patientProfileSetup.js (Web) — savePatientProfileSetup().
import { authService } from "@/src/services/authService";
import { findPatientProfileByUserId, patientProfilesApi } from "@/src/services/patientProfileService";
import { normalizePersonalProfile, normalizePhoneProfile, PersonalProfileForm } from "@/src/utils/profileValidation";
import { ChronicDisease } from "@/src/types/patientProfile";

export { findPatientProfileByUserId };

function numberOrNull(value: string) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export type PatientProfileSetupForm = PersonalProfileForm & {
  bloodType: string;
  height: string;
  weight: string;
  allergyNote: string;
  chronicDiseases: ChronicDisease[];
};

export async function savePatientProfileSetup({
  userId,
  existingProfileId,
  form,
}: {
  userId: string;
  existingProfileId?: string | null;
  form: PatientProfileSetupForm;
}) {
  await authService.updateMe(normalizePersonalProfile(form));
  await authService.updatePhone(normalizePhoneProfile(form));

  const chronicDiseases = form.chronicDiseases
    .map((disease) => ({
      diseaseName: String(disease.diseaseName ?? "").trim(),
      from: disease.from || null,
      to: disease.to || null,
      note: String(disease.note ?? "").trim() || null,
    }))
    .filter((disease) => disease.diseaseName);

  const patientPayload = {
    bloodType: form.bloodType || null,
    height: numberOrNull(form.height),
    weight: numberOrNull(form.weight),
    allergyNote: form.allergyNote.trim() || null,
    chronicDiseases,
  };

  if (existingProfileId) {
    return patientProfilesApi.update(existingProfileId, patientPayload);
  }

  return patientProfilesApi.create({ ...patientPayload, userId });
}
