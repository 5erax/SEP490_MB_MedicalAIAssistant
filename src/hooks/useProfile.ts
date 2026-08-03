// Ported from the load/save handlers in Web's UserProfilePage.jsx: three
// independently-loaded sections (personal, medical, subscription) each with
// their own loading/error state, so a failure in one doesn't block the
// others (Web's sectionLoadState pattern).
import { useCallback, useEffect, useState } from "react";

import { authService } from "@/src/services/authService";
import { patientProfilesApi } from "@/src/services/patientProfileService";
import { userSubscriptionsApi } from "@/src/services/subscriptionService";
import { ChronicDisease, PatientProfile } from "@/src/types/patientProfile";
import { UserSubscription } from "@/src/types/subscription";
import { UserProfile } from "@/src/types/user";
import {
  MedicalProfileErrors,
  MedicalProfileForm,
  normalizePersonalProfile,
  PersonalProfileErrors,
  PersonalProfileForm,
  validateMedicalProfile,
  validatePersonalProfile,
} from "@/src/utils/profileValidation";

type SectionState = "loading" | "ready" | "error";

const EMPTY_PERSONAL_FORM: PersonalProfileForm = {
  displayName: "",
  gender: "1",
  dateOfBirth: "",
  phoneNumber: "",
  address: "",
};

const EMPTY_MEDICAL_FORM: MedicalProfileForm = {
  bloodType: "",
  height: "",
  weight: "",
  allergyNote: "",
  chronicDiseases: [],
};

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMedicalForm(profile: PatientProfile | null): MedicalProfileForm {
  if (!profile) return EMPTY_MEDICAL_FORM;
  return {
    bloodType: profile.bloodType ? String(profile.bloodType) : "",
    height: profile.height !== null && profile.height !== undefined ? String(profile.height) : "",
    weight: profile.weight !== null && profile.weight !== undefined ? String(profile.weight) : "",
    allergyNote: profile.allergyNote || "",
    chronicDiseases: (profile.chronicDiseases ?? []).map((disease) => ({
      localId: makeLocalId(),
      diseaseName: disease.diseaseName || "",
      from: disease.from ? String(disease.from).slice(0, 10) : "",
      to: disease.to ? String(disease.to).slice(0, 10) : "",
      note: disease.note || "",
    })),
  };
}

export function useProfile() {
  const [email, setEmail] = useState("");
  const [personalForm, setPersonalForm] = useState<PersonalProfileForm>(EMPTY_PERSONAL_FORM);
  const [personalState, setPersonalState] = useState<SectionState>("loading");
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalErrors, setPersonalErrors] = useState<PersonalProfileErrors>({});
  const [personalSaveError, setPersonalSaveError] = useState("");

  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [medicalForm, setMedicalForm] = useState<MedicalProfileForm>(EMPTY_MEDICAL_FORM);
  const [medicalState, setMedicalState] = useState<SectionState>("loading");
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);
  const [medicalErrors, setMedicalErrors] = useState<MedicalProfileErrors>({});
  const [medicalSaveError, setMedicalSaveError] = useState("");

  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<SectionState>("loading");

  const load = useCallback(async () => {
    setPersonalState("loading");
    setMedicalState("loading");
    setSubscriptionState("loading");

    const [userResult, profilesResult, subscriptionResult] = await Promise.allSettled([
      authService.me(),
      patientProfilesApi.list(1, 100),
      userSubscriptionsApi.me(),
    ]);

    let resolvedUserId = "";
    if (userResult.status === "fulfilled") {
      const user = (userResult.value as { data?: UserProfile }).data;
      resolvedUserId = String(user?.userId || user?.id || "");
      setEmail(user?.email || "");
      setPersonalForm({
        displayName: user?.displayName || user?.name || "",
        gender: String(user?.gender ?? "1"),
        dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
        phoneNumber: user?.phoneNumber || "",
        address: user?.address || "",
      });
      setPersonalState("ready");
    } else {
      setPersonalState("error");
    }

    if (profilesResult.status === "fulfilled" && userResult.status === "fulfilled") {
      const data = (profilesResult.value as { data?: { items?: PatientProfile[] } | PatientProfile[] }).data;
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      const foundProfile = items.find((item) => String(item.userId).toLowerCase() === resolvedUserId.toLowerCase()) ?? null;
      setExistingProfileId(foundProfile?.id ?? null);
      setMedicalForm(toMedicalForm(foundProfile));
      setMedicalState("ready");
    } else {
      setMedicalState("error");
    }

    if (subscriptionResult.status === "fulfilled") {
      const subscriptions = ((subscriptionResult.value as { data?: UserSubscription[] }).data ?? []) as UserSubscription[];
      const active = subscriptions.find((item) => String(item.statusName).toLowerCase() === "active");
      setSubscription(active ?? subscriptions[0] ?? null);
      setSubscriptionState("ready");
    } else {
      setSubscriptionState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEditingPersonal() {
    setPersonalErrors({});
    setPersonalSaveError("");
    setIsEditingPersonal(true);
  }

  function cancelEditingPersonal() {
    setPersonalErrors({});
    setPersonalSaveError("");
    setIsEditingPersonal(false);
    load();
  }

  function updatePersonalField<K extends keyof PersonalProfileForm>(key: K, value: PersonalProfileForm[K]) {
    setPersonalForm((current) => ({ ...current, [key]: value }));
  }

  async function savePersonal(userId: string) {
    const errors = validatePersonalProfile(personalForm);
    if (Object.keys(errors).length > 0) {
      setPersonalErrors(errors);
      return "invalid" as const;
    }

    setSavingPersonal(true);
    setPersonalSaveError("");
    try {
      await authService.updateUser(userId, normalizePersonalProfile(personalForm));
      setIsEditingPersonal(false);
      setPersonalErrors({});
      return "success" as const;
    } catch (error) {
      setPersonalSaveError((error as Error)?.message || "Không thể lưu thông tin cá nhân. Vui lòng thử lại.");
      return "error" as const;
    } finally {
      setSavingPersonal(false);
    }
  }

  function startEditingMedical() {
    setMedicalErrors({});
    setMedicalSaveError("");
    setIsEditingMedical(true);
  }

  function cancelEditingMedical() {
    setMedicalErrors({});
    setMedicalSaveError("");
    setIsEditingMedical(false);
    load();
  }

  function updateMedicalField<K extends keyof MedicalProfileForm>(key: K, value: MedicalProfileForm[K]) {
    setMedicalForm((current) => ({ ...current, [key]: value }));
  }

  function addChronicDisease() {
    setMedicalForm((current) => ({
      ...current,
      chronicDiseases: [...current.chronicDiseases, { localId: makeLocalId(), diseaseName: "", from: "", to: "", note: "" }],
    }));
  }

  function removeChronicDisease(localId: string) {
    setMedicalForm((current) => ({
      ...current,
      chronicDiseases: current.chronicDiseases.filter((disease) => disease.localId !== localId),
    }));
  }

  function updateChronicDisease(localId: string, key: keyof Omit<ChronicDisease, "localId">, value: string) {
    setMedicalForm((current) => ({
      ...current,
      chronicDiseases: current.chronicDiseases.map((disease) => (disease.localId === localId ? { ...disease, [key]: value } : disease)),
    }));
  }

  async function saveMedical(userId: string) {
    const errors = validateMedicalProfile(medicalForm);
    if (Object.keys(errors).length > 0) {
      setMedicalErrors(errors);
      return "invalid" as const;
    }

    setSavingMedical(true);
    setMedicalSaveError("");
    try {
      const payload = {
        bloodType: medicalForm.bloodType || null,
        height: medicalForm.height ? Number(medicalForm.height) : null,
        weight: medicalForm.weight ? Number(medicalForm.weight) : null,
        allergyNote: medicalForm.allergyNote.trim() || null,
        chronicDiseases: medicalForm.chronicDiseases
          .filter((disease) => disease.diseaseName.trim())
          .map((disease) => ({
            diseaseName: disease.diseaseName.trim(),
            from: disease.from || null,
            to: disease.to || null,
            note: disease.note.trim() || null,
          })),
      };

      const response = existingProfileId
        ? await patientProfilesApi.update(existingProfileId, payload)
        : await patientProfilesApi.create({ ...payload, userId });
      const saved = (response as { data?: PatientProfile }).data;
      if (saved?.id) setExistingProfileId(saved.id);

      setIsEditingMedical(false);
      setMedicalErrors({});
      return "success" as const;
    } catch (error) {
      setMedicalSaveError((error as Error)?.message || "Không thể lưu hồ sơ y tế. Vui lòng thử lại.");
      return "error" as const;
    } finally {
      setSavingMedical(false);
    }
  }

  return {
    email,
    personalForm,
    personalState,
    isEditingPersonal,
    savingPersonal,
    personalErrors,
    personalSaveError,
    startEditingPersonal,
    cancelEditingPersonal,
    updatePersonalField,
    savePersonal,

    medicalForm,
    medicalState,
    isEditingMedical,
    savingMedical,
    medicalErrors,
    medicalSaveError,
    startEditingMedical,
    cancelEditingMedical,
    updateMedicalField,
    addChronicDisease,
    removeChronicDisease,
    updateChronicDisease,
    saveMedical,

    subscription,
    subscriptionState,

    reload: load,
  };
}
