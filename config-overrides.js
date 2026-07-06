const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

function override(config) {
  // ====== FALLBACKS (rămân ca la tine)
  config.resolve = {
    ...config.resolve,
    fallback: {
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
      crypto: require.resolve("crypto-browserify"),
      assert: require.resolve("assert"),
      util: require.resolve("util"),
      process: require.resolve("process/browser"),
      http: require.resolve("http-browserify"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      path: require.resolve("path-browserify"),
      url: require.resolve("url/"),
      zlib: require.resolve("browserify-zlib"),
      vm: require.resolve("vm-browserify"),
      "@react-native-async-storage/async-storage": false,
      fs: false,
    },
  };

  // ====== .mjs rules (rămâne)
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: { fullySpecified: false },
  });

  // ====== Oprește source-map-loader pentru pachetele care lipsesc sourcemaps
  // (CRA adaugă source-map-loader ca rule "pre"; îl găsim și îi setăm exclude)
  const smRule = config.module.rules.find(
    (rule) =>
      rule.enforce === "pre" &&
      rule.use &&
      rule.use.some(
        (u) =>
          (typeof u === "string" && u.includes("source-map-loader")) ||
          (u.loader && u.loader.includes("source-map-loader"))
      )
  );

  if (smRule) {
    const extraExcludes = [
      /node_modules\/@walletconnect/,
      /node_modules\/superstruct/,
      /node_modules\/json-rpc-engine/,
      /node_modules\/xhr2-cookies/,
      /node_modules\/enc-utils/,
      /node_modules\/ethereumjs-abi/,
      /node_modules\/ethereumjs-util/,
    ];
    smRule.exclude = Array.isArray(smRule.exclude)
      ? [...smRule.exclude, ...extraExcludes]
      : smRule.exclude
      ? [smRule.exclude, ...extraExcludes]
      : extraExcludes;
  }

  // ====== ProvidePlugin (ok) – NU mai definim process.env aici
  config.plugins = [
    ...(config.plugins || []),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ];

  // ====== Silence MiniCssExtractPlugin "Conflicting order" warnings (CSS import order varies across routes)
  // This does NOT change runtime behavior in our case; it only avoids noisy build warnings.
  config.plugins = (config.plugins || []).map((p) => {
    if (p && p.constructor && p.constructor.name === "MiniCssExtractPlugin") {
      const opts = p.options || {};
      return new MiniCssExtractPlugin({ ...opts, ignoreOrder: true });
    }
    return p;
  });

  // ====== (Opțional) ascunde mesajele „Failed to parse source map” rămase
  // ====== FIX: Ascunde warning-ul DefinePlugin pentru process.env (child compilations)
  // NOTE: Child compilation warnings are hard to suppress in webpack 5 without eject
  // This warning is harmless and doesn't affect functionality
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Failed to parse source map/i,
    (warning) => {
      // Function form - catch DefinePlugin warnings from child compilations
      const message = warning.message || warning.toString();
      if (message && (
        message.includes('DefinePlugin') && 
        message.includes("Conflicting values for 'process.env'")
      )) {
        return true;
      }
      return false;
    },
  ];

  return config;
}

override.jest = function overrideJest(config) {
  config.testPathIgnorePatterns = [
    ...(config.testPathIgnorePatterns || []),
    '<rootDir>/src/components/DEX/Proiect/backend/tests/',
  ];

  config.modulePathIgnorePatterns = [
    ...(config.modulePathIgnorePatterns || []),
    '<rootDir>/src/components/DEX/Proiect/backend/',
    '<rootDir>/src/components/DEX/Proiect/contracts/',
    '<rootDir>/src/components/DEX/Proiect/frontend/',
  ];

  config.moduleNameMapper = {
    ...(config.moduleNameMapper || {}),
    '^wagmi$': '<rootDir>/src/test/mocks/wagmi.js',
    '^@wagmi/core$': '<rootDir>/src/test/mocks/wagmiCore.js',
    '^wagmi/chains$': '<rootDir>/src/test/mocks/wagmiChains.js',
    '^wagmi/connectors$': '<rootDir>/src/test/mocks/wagmiConnectors.js',
    '^@cosmjs/cosmwasm-stargate$': '<rootDir>/src/test/mocks/cosmwasmStargate.js',
    '^@cosmjs/proto-signing$': '<rootDir>/src/test/mocks/cosmjsProtoSigning.js',
    '^@cosmjs/stargate$': '<rootDir>/src/test/mocks/cosmjsStargate.js',
  };

  return config;
};

module.exports = override;
