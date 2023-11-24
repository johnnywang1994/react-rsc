const register = require("react-server-dom-webpack/node-register");
register();
const babelRegister = require("@babel/register");
babelRegister({
  ignore: [/[\\\/](build|node_modules)[\\\/]/],
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-env",
  ],
});

// console.log(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED);
// console.log(React.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED);
// console.log(ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED);

const React = require("react");
// hack for experiment(used in "react-dom/server.edge")
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  ...React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  ...React.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
};

// next-app-loader.ts
// We need to expose the bundled `require` API globally for
// react-server-dom-webpack. This is a hack until we find a better way.
globalThis.__webpack_require__ = (id) => {
  return () => React.createElement(React.Fragment);
  // return require(`.${id}`);
};
globalThis.__webpack_chunk_load__ = (chunkId) => {
  // return require(`../build/${chunkId}.main`);
  return Promise.resolve();
};

require("./setup");
