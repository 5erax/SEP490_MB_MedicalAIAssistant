import { AxiosError } from "axios";
import { ApiErrorPayload } from "@/src/types/api";

function formatApiErrors(errors: ApiErrorPayload["errors"]) {
  if (!errors) return "";
  if (Array.isArray(errors)) return errors.filter(Boolean).join(", ");
  if (typeof errors === "string") return errors;

  return Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(", ");
}

export function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined;

    return (
      payload?.message ||
      formatApiErrors(payload?.errors) ||
      payload?.title ||
      error.message ||
      "Yeu cau that bai. Vui long thu lai."
    );
  }

  if (error instanceof Error) return error.message;
  return "Da co loi xay ra. Vui long thu lai.";
}

