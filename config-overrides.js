const webpack = require("webpack");

module.exports = function override(config) {
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

  // ====== (Opțional) ascunde mesajele „Failed to parse source map” rămase
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Failed to parse source map/i,
  ];

  return config;
};
