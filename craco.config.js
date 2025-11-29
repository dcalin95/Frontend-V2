module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for node modules that are not available in browser
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
        "react-native": false,
      };

      // Ignore warnings for these modules
      webpackConfig.ignoreWarnings = [
        {
          module: /@metamask\/sdk/,
          message: /Can't resolve '@react-native-async-storage\/async-storage'/,
        },
      ];

      return webpackConfig;
    },
  },
};

