// Ported from the state/handlers in Web's UserMedicationsPage.jsx
// (load, buildPayload, validateForm, addReminderTime, submit, remove).
import { useCallback, useEffect, useState } from "react";

import { userMedicationsApi } from "@/src/services/userMedicationService";
import { UserMedication } from "@/src/types/medication";
import {
  buildMedicationPayload,
  getMedicationErrorMessage,
  INITIAL_MEDICATION_FORM,
  MAX_REMINDER_TIMES,
  MedicationFormErrors,
  MedicationFormState,
  toMedicationFormState,
  validateMedicationForm,
} from "@/src/utils/medicationValidation";

export function useUserMedications() {
  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicationFormState>(INITIAL_MEDICATION_FORM);
  const [formErrors, setFormErrors] = useState<MedicationFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setListError("");
    try {
      const response = (await userMedicationsApi.list()) as { data?: { items?: UserMedication[] } | UserMedication[] };
      const data = response?.data;
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      setMedications(items);
    } catch (error) {
      setListError(getMedicationErrorMessage(error, "Chưa thể tải danh sách thuốc. Vui lòng thử lại sau."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreateForm() {
    setEditingId(null);
    setForm(INITIAL_MEDICATION_FORM);
    setFormErrors({});
    setFormVisible(true);
  }

  function openEditForm(medication: UserMedication) {
    setEditingId(medication.id);
    setForm(toMedicationFormState(medication));
    setFormErrors({});
    setFormVisible(true);
  }

  function closeForm() {
    setFormVisible(false);
    setFormErrors({});
  }

  function setField<K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addReminderTime(time: string) {
    if (!time) return;
    if (form.reminderTimes.includes(time)) {
      setFormErrors((current) => ({ ...current, reminderTimes: "Giờ này đã có trong danh sách." }));
      return;
    }
    if (form.reminderTimes.length >= MAX_REMINDER_TIMES) {
      setFormErrors((current) => ({ ...current, reminderTimes: `Tối đa ${MAX_REMINDER_TIMES} giờ nhắc.` }));
      return;
    }
    setForm((current) => ({ ...current, reminderTimes: [...current.reminderTimes, time].sort() }));
    setFormErrors((current) => ({ ...current, reminderTimes: undefined }));
  }

  function removeReminderTime(time: string) {
    setForm((current) => ({ ...current, reminderTimes: current.reminderTimes.filter((entry) => entry !== time) }));
  }

  async function submit() {
    const errors = validateMedicationForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return "invalid" as const;
    }

    setSubmitting(true);
    try {
      const payload = buildMedicationPayload(form);
      if (editingId) {
        await userMedicationsApi.update(editingId, payload);
      } else {
        await userMedicationsApi.create(payload);
      }
      closeForm();
      await load();
      return "success" as const;
    } catch (error) {
      setFormErrors({ medicineName: getMedicationErrorMessage(error, "Không thể lưu thông tin thuốc. Vui lòng thử lại.") });
      return "error" as const;
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setRemovingId(id);
    try {
      await userMedicationsApi.remove(id);
      await load();
      return "success" as const;
    } catch (error) {
      setListError(getMedicationErrorMessage(error, "Không thể xoá thuốc này. Vui lòng thử lại."));
      return "error" as const;
    } finally {
      setRemovingId(null);
    }
  }

  return {
    medications,
    loading,
    refreshing,
    listError,
    reload: () => load(true),
    formVisible,
    editingId,
    form,
    formErrors,
    submitting,
    removingId,
    openCreateForm,
    openEditForm,
    closeForm,
    setField,
    addReminderTime,
    removeReminderTime,
    submit,
    remove,
  };
}
