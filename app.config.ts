import type { ConfigContext, ExpoConfig } from "expo/config";

import baseConfig from "./app.json";

/**
 * Cleartext is permitted only in explicitly selected local-development builds.
 * Preview and production builds always require HTTPS.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
  const allowDevelopmentHttp =
    appEnvironment === "development" && process.env.MEDIMATE_ALLOW_DEV_HTTP === "true";
  const expo = baseConfig.expo as ExpoConfig;

  return {
    ...config,
    ...expo,
    ios: {
      ...expo.ios,
      ...(allowDevelopmentHttp
        ? {
            infoPlist: {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
              },
            },
          }
        : {}),
    },
    plugins: [
      ...(expo.plugins ?? []),
      ...(allowDevelopmentHttp
        ? [
            [
              "expo-build-properties",
              {
                android: {
                  usesCleartextTraffic: true,
                },
              },
            ] as [string, Record<string, unknown>],
          ]
        : []),
    ],
    extra: {
      ...expo.extra,
      appEnvironment,
      allowDevelopmentHttp,
    },
  };
};
