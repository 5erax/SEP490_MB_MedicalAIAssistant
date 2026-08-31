// Ported from the state/handlers in Web's UserMedicationsPage.jsx
// (load, buildPayload, validateForm, addReminderTime, submit, remove).
import { useCallback, useEffect, useRef, useState } from "react";

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
  response: { data?: PaginatedResult<UserMedication> } | null | undefined,
  requestedPage: number,
): PaginatedResult<UserMedication> {
  const data = response?.data;
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
  const pageRequestId = useRef(0);

  const applyPage = useCallback((page: PaginatedResult<UserMedication>) => {
    setPageInfo(page);
    setMedications(page.items);
    setPageNumber(page.pageNumber);
  }, []);

  const fetchPage = useCallback(async (targetPage: number) => {
    const response = await userMedicationsApi.getPaged(targetPage, PAGE_SIZE);
    return normalizeMedicationPage(response, targetPage);
  }, []);

  const load = useCallback(async (targetPage = 1, isRefresh = false) => {
    const requestId = ++pageRequestId.current;
    const isCurrentRequest = () => requestId === pageRequestId.current;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setListError("");

    try {
      let page = await fetchPage(targetPage);

      if (page.items.length === 0 && page.totalCount > 0 && targetPage > 1 && page.totalPages < targetPage) {
        page = await fetchPage(Math.max(page.totalPages, 1));
      }

      if (!isCurrentRequest()) return null;
      applyPage(page);
      return page;
    } catch (error) {
      if (isCurrentRequest()) {
        setListError(getMedicationErrorMessage(error, "Không thể tải danh sách thuốc. Vui lòng thử lại sau."));
      }
      return null;
    } finally {
      if (isCurrentRequest()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [applyPage, fetchPage]);

  useEffect(() => {
    void load(1);
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
      await load(editingId ? pageNumber : 1);
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
      await load(pageNumber);
      return "success" as const;
    } catch (error) {
      setListError(getMedicationErrorMessage(error, "Không thể xoá thuốc này. Vui lòng thử lại."));
      return "error" as const;
    } finally {
      setRemovingId(null);
    }
  }

  function changePage(targetPage: number) {
    const lastPage = Math.max(1, pageInfo.totalPages || 1);
    const nextPage = Math.min(Math.max(1, targetPage), lastPage);
    if (loading || refreshing || nextPage === pageNumber) return;
    void load(nextPage);
  }

  return {
    medications,
    pageInfo,
    pageNumber,
    changePage,
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
