// Ported from the state/handlers in Web's UserMedicationsPage.jsx
// (load, buildPayload, validateForm, addReminderTime, submit, remove).
import { useCallback, useEffect, useState } from "react";

import { userMedicationsApi } from "@/src/services/userMedicationService";
import { PaginatedResult } from "@/src/types/api";
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

const PAGE_SIZE = 5;
const EMPTY_PAGE: PaginatedResult<UserMedication> = {
  items: [],
  pageNumber: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

function normalizeMedicationPage(
  response: { data?: PaginatedResult<UserMedication> | UserMedication[] } | null | undefined,
  requestedPage: number,
): PaginatedResult<UserMedication> {
  const data = response?.data;

  if (Array.isArray(data)) {
    const totalCount = data.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const pageNumber = Math.min(Math.max(1, requestedPage), Math.max(1, totalPages));
    const start = (pageNumber - 1) * PAGE_SIZE;

    return {
      items: data.slice(start, start + PAGE_SIZE),
      pageNumber,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages,
    };
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const pageSize = Math.max(1, Number(data?.pageSize) || PAGE_SIZE);
  const totalCount = Math.max(0, Number(data?.totalCount) || items.length);

  return {
    items,
    pageNumber: Math.max(1, Number(data?.pageNumber) || requestedPage),
    pageSize,
    totalCount,
    totalPages: Math.max(0, Number(data?.totalPages) || Math.ceil(totalCount / pageSize)),
  };
}

export function useUserMedications() {
  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [pageInfo, setPageInfo] = useState<PaginatedResult<UserMedication>>(EMPTY_PAGE);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicationFormState>(INITIAL_MEDICATION_FORM);
  const [formErrors, setFormErrors] = useState<MedicationFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async (targetPage = pageNumber, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setListError("");
    try {
      const response = await userMedicationsApi.list(targetPage, PAGE_SIZE);
      const page = normalizeMedicationPage(response, targetPage);
      setPageInfo(page);
      setMedications(page.items);
    } catch (error) {
      setPageInfo((current) => ({ ...current, items: [] }));
      setMedications([]);
      setListError(getMedicationErrorMessage(error, "Chưa thể tải danh sách thuốc. Vui lòng thử lại sau."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageNumber]);

  useEffect(() => {
    load(pageNumber);
  }, [load, pageNumber]);

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
      const nextPage = editingId ? pageNumber : 1;
      if (editingId) {
        await userMedicationsApi.update(editingId, payload);
      } else {
        await userMedicationsApi.create(payload);
        setPageNumber(1);
      }
      closeForm();
      await load(nextPage);
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
      if (medications.length === 1 && pageNumber > 1) {
        setPageNumber((current) => Math.max(1, current - 1));
      } else {
        await load(pageNumber);
      }
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
    pageInfo,
    pageNumber,
    setPageNumber,
    loading,
    refreshing,
    listError,
    reload: () => load(pageNumber, true),
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
