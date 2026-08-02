import { useToast as useToastContext } from "@/src/providers";

export function useToast() {
  return useToastContext();
}
