import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import { STORAGE_KEYS } from "@/src/constants/storageKeys";

export async function getOrCreatePushInstallationId() {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.pushInstallationId);
  if (existing) return existing;

  const installationId = Crypto.randomUUID();
  await AsyncStorage.setItem(STORAGE_KEYS.pushInstallationId, installationId);
  return installationId;
}
