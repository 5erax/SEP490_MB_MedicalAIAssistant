const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withDebugSigningKeystore(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      return config;
    }

    config.modResults.contents = config.modResults.contents
      .replace(
        /storeFile file\(['"]debug\.keystore['"]\)/g,
        'storeFile file("${System.properties[\'user.home\']}/.android/debug.keystore")',
      );

    return config;
  });
};
