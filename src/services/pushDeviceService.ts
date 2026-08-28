import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PushDeviceResponse, RegisterPushDevicePayload } from "@/src/types/pushNotification";

export const pushDevicesApi = {
  register(payload: RegisterPushDevicePayload) {
    return apiRequest<PushDeviceResponse>(ENDPOINTS.PUSH_DEVICES.BASE, {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },

  deactivate(installationId: string) {
    return apiRequest<boolean>(ENDPOINTS.PUSH_DEVICES.BY_INSTALLATION(installationId), {
      method: "DELETE",
      requiresAuth: true,
      timeout: 5000,
    });
  },
};
