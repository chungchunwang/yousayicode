const { build } = require("esbuild");
const cssModulesPlugin = require('esbuild-css-modules-plugin');

const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outfile: "./out/extension.js",
  external: ["vscode"],
};

const watchConfig = {
    watch: {
      onRebuild(error, result) {
        console.log("[watch] build started");
        if (error) {
          error.errors.forEach(error =>
            console.error(`> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`)
          );
        } else {
          console.log("[watch] build finished");
        }
      },
    },
  };
  const webviewConfig = {
    ...baseConfig,
    target: "es2020",
    format: "esm",
    entryPoints: ["./src/webview/main.tsx"],
    outfile: "./out/webview.js",
    plugins: [cssModulesPlugin({
        // optional. set to false to not inject generated css into page;
      // default value is false when set `v2` to `true`, otherwise default is true,
      // if set to `true`, the generated css will be injected into `head`;
      // could be a string of css selector of the element to inject into,
      // e.g.
      // ```
      // inject: '#some-element-id' // the plugin will try to get `shadowRoot` of the found element, and append css to the `shadowRoot`, if no shadowRoot then append to the found element, if no element found then append to document.head
      // ```
      // could be a function with params content & digest (return a string of js code to inject to page),
      // e.g.
      // ```
      // inject: (cssContent, digest) => `console.log("${cssContent}", "${digest}")`
      // ```
      inject: false,

      localsConvention: 'camelCaseOnly', // optional. value could be one of 'camelCaseOnly', 'camelCase', 'dashes', 'dashesOnly', default is 'camelCaseOnly'

      generateScopedName: (name, filename, css) => string, // optional. refer to: https://github.com/madyankin/postcss-modules#generating-scoped-names

      filter: /\.modules?\.css$/i, // Optional. Regex to filter certain CSS files.

      cssModulesOption: {
        // optional, refer to: https://github.com/madyankin/postcss-modules/blob/d7cefc427c43bf35f7ebc55e7bda33b4689baf5a/index.d.ts#L27
        // this option will override others passed to postcss-modules
      },

      v2: true, // experimental. v2 can bundle images in css, note if set `v2` to true, other options except `inject` will be ignored. and v2 only works with `bundle: true`.
      v2CssModulesOption: { // Optional.
        dashedIndents: false, // Optional. refer to: https://github.com/parcel-bundler/parcel-css/releases/tag/v1.9.0
        /**
         * Optional. The currently supported segments are:
         * [name] - the base name of the CSS file, without the extension
         * [hash] - a hash of the full file path
         * [local] - the original class name
         */
        pattern: `custom-prefix_[local]_[hash]`
      }
    })],
  };
  
  (async () => {
    const args = process.argv.slice(2);
    try {
      if (args.includes("--watch")) {
        // Build and watch extension and webview code
        console.log("[watch] build started");
        await build({
          ...extensionConfig,
          ...watchConfig,
        });
        await build({
          ...webviewConfig,
          ...watchConfig,
        });
        console.log("[watch] build finished");
      } else {
        // Build extension and webview code
        await build(extensionConfig);
        await build(webviewConfig);
        console.log("build complete");
      }
    } catch (err) {
      process.stderr.write(err.stderr);
      process.exit(1);
    }
  })();