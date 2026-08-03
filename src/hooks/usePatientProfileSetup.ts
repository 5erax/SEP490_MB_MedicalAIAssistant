// Ported from Web's PersonalPatientProfilePage.jsx state machine: load the
// user record, check whether a patient profile already exists (in which
// case the auth flags are just repaired and we redirect away without
// showing the form), otherwise pre-fill and let the user complete it.
import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";

import { authService } from "@/src/services/authService";
import { findPatientProfileByUserId, PatientProfileSetupForm, savePatientProfileSetup } from "@/src/services/patientProfileSetup";
import { useAuth } from "@/src/providers";
import { getRoleHomeRoute, getPrimaryRoleForSession } from "@/src/navigation/roleRedirect";
import { UserProfile } from "@/src/types/user";
import {
  MedicalProfileErrors,
  PersonalProfileErrors,
  validateMedicalProfile,
  validatePersonalProfile,
} from "@/src/utils/profileValidation";

function toDateInput(value: unknown) {
  return value ? String(value).slice(0, 10) : "";
}

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialForm(): PatientProfileSetupForm {
  return {
    displayName: "",
    dateOfBirth: "",
    gender: "1",
    phoneNumber: "",
    address: "",
    bloodType: "",
    allergyNote: "",
    height: "",
    weight: "",
    chronicDiseases: [{ localId: makeLocalId(), diseaseName: "", from: "", to: "", note: "" }],
  };
}

export function usePatientProfileSetup() {
  const { session, updateSession } = useAuth();
  const [form, setForm] = useState<PatientProfileSetupForm>(createInitialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [personalErrors, setPersonalErrors] = useState<PersonalProfileErrors>({});
  const [medicalErrors, setMedicalErrors] = useState<MedicalProfileErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const userId = String(session?.userId || (session as Record<string, unknown> | null)?.id || "");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      let resolvedUser: UserProfile | undefined;
      let resolvedUserId = userId;

      try {
        const response = await authService.me();
        if (!active) return;
        resolvedUser = (response as { data?: UserProfile }).data;
        resolvedUserId = String(resolvedUser?.userId || resolvedUser?.id || userId);
      } catch {
        // best-effort: fall back to session-derived userId, matching Web
      }

      try {
        const matchedProfile = await findPatientProfileByUserId(resolvedUserId);
        if (!active) return;

        if (matchedProfile) {
          await updateSession({
            firstLogin: false,
            isFirstLogin: false,
            isProfileCompleted: true,
            patientOnboardingPending: true,
          });
          setRedirecting(true);
          router.replace(getRoleHomeRoute(getPrimaryRoleForSession(session)));
          return;
        }
      } catch {
        // best-effort: no existing profile found, continue to the form
      }

      setForm((current) => ({
        ...current,
        displayName: resolvedUser?.displayName || resolvedUser?.name || "",
        dateOfBirth: toDateInput(resolvedUser?.dateOfBirth),
        gender: String(resolvedUser?.gender ?? "1"),
        phoneNumber: resolvedUser?.phoneNumber || "",
        address: resolvedUser?.address || "",
      }));
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField<K extends keyof PatientProfileSetupForm>(key: K, value: PatientProfileSetupForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addDisease() {
    setForm((current) => ({
      ...current,
      chronicDiseases: [...current.chronicDiseases, { localId: makeLocalId(), diseaseName: "", from: "", to: "", note: "" }],
    }));
  }

  function removeDisease(localId: string) {
    setForm((current) => ({
      ...current,
      chronicDiseases: current.chronicDiseases.filter((disease) => disease.localId !== localId),
    }));
  }

  function updateDisease(localId: string, key: "diseaseName" | "from" | "to" | "note", value: string) {
    setForm((current) => ({
      ...current,
      chronicDiseases: current.chronicDiseases.map((disease) => (disease.localId === localId ? { ...disease, [key]: value } : disease)),
    }));
  }

  const submit = useCallback(async () => {
    const nextPersonalErrors = validatePersonalProfile(form, { required: true });
    const nextMedicalErrors = validateMedicalProfile(form);
    setPersonalErrors(nextPersonalErrors);
    setMedicalErrors(nextMedicalErrors);

    if (Object.keys(nextPersonalErrors).length > 0 || Object.keys(nextMedicalErrors).length > 0) {
      setSubmitError("Vui lòng kiểm tra lại các thông tin bắt buộc.");
      return "invalid" as const;
    }

    if (!userId) {
      setSubmitError("Không tìm thấy tài khoản trong phiên đăng nhập.");
      return "error" as const;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await savePatientProfileSetup({ userId, form });
      await updateSession({
        firstLogin: false,
        isFirstLogin: false,
        isProfileCompleted: true,
        patientOnboardingPending: true,
      });
      router.replace(getRoleHomeRoute(getPrimaryRoleForSession(session)));
      return "success" as const;
    } catch (error) {
      setSubmitError((error as Error)?.message || "Không thể lưu hồ sơ. Vui lòng thử lại.");
      return "error" as const;
    } finally {
      setSubmitting(false);
    }
  }, [form, session, updateSession, userId]);

  return {
    form,
    loading: loading || redirecting,
    submitting,
    personalErrors,
    medicalErrors,
    submitError,
    updateField,
    addDisease,
    removeDisease,
    updateDisease,
    submit,
  };
}
