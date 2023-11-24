import "server-only";

import express from "express";
import compress from "compression";
import { readFileSync } from "fs";
// import { unlink, writeFile } from "fs/promises";
import path from "path";

import React from "react";

// import { renderToPipeableStream } from "react-server-dom-webpack/server";
import { renderToReadableStream } from "react-server-dom-webpack/server.edge";
// import { createFromReadableStream } from "./client-edge";
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";
import { renderToReadableStream as renderToHtmlStream } from "react-dom/server.edge";
// import { renderToString } from "react-dom/server";
import ReactRoot from "../src/layout.jsx";
import { createDecodeTransformStream } from "./encode-decode.js";

const PORT = process.env.PORT || 4000;
const app = express();

app.use(compress());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`React Server listening at ${PORT}...`);
});

// render to static stream tree
async function renderReactTree(ComponentToRender) {
  await waitForWebpack();
  const manifest = getClientManifest();
  const flightStream = await renderToReadableStream(
    <ComponentToRender />,
    manifest.clientModuleMap
  );
  return flightStream;
}

// render to real html stream
async function renderReactHtml(props) {
  const pageName = props.pathname || "/index";
  const page = await importPageByName(pageName); // check page exist

  const flightStream = await renderReactTree(() => (
    <ReactRoot>{page}</ReactRoot>
  ));
  // Prevent ReadableStream being locked after used
  const [renderStream, dataStream] = flightStream.tee();

  const manifest = getClientManifest();
  const res = createFromReadableStream(renderStream, {
    ssrManifest: {
      moduleLoading: manifest.moduleLoading,
      moduleMap: manifest.ssrModuleMap,
    },
  });
  // console.log(res);

  function ServerComponentWrapper() {
    return React.use(res);
  }

  const pageData = await streamToString(dataStream);
  const htmlStream = await renderToHtmlStream(<ServerComponentWrapper />, {
    bootstrapScriptContent: `
    const self = window; self.__ssr_f = self.__ssr_f || [];
    ${pageData}
    `,
    bootstrapScripts: ["/main.js"],
  });
  const data = await readStream(htmlStream);

  // const pageData = await streamToString(stream);
  // console.log(pageData);

  // const data = renderToString(
  //   <ReactRoot>
  //     <script
  //       dangerouslySetInnerHTML={{
  //         __html: `
  //       const self = window; self.__ssr_f = self.__ssr_f || [];
  //       ${pageData}
  //     `,
  //       }}
  //     ></script>
  //     <script src="/main.js"></script>
  //   </ReactRoot>
  // );
  return data;
}

async function sendHtmlResponse(req, res) {
  const html = await renderReactHtml({
    pathname: req.baseUrl + req.path,
  });
  res.send(html);
}

app.get("*", async (req, res, next) => {
  try {
    await sendHtmlResponse(req, res);
  } catch (err) {
    if (!err.message.includes("Cannot find module")) {
      console.error(err);
    }
    // passthrough if page not found
    next();
  }
});

async function sendTreeResponse(req, res) {
  const route = JSON.parse(req.query.route ?? "{}");
  res.set("X-Route", JSON.stringify(route));

  const pageName = route.pathname || "/index";
  let page = await importPageByName(pageName);
  const flightStream = await renderReactTree(() => (
    <ReactRoot>{page}</ReactRoot>
  ));
  const data = await readStream(flightStream);
  res.send(data);
}

app.get("/react", async (req, res) => {
  sendTreeResponse(req, res);
});

app.use(express.static("build"));
app.use(express.static("public"));

async function importPageByName(pageName) {
  const Page = (await import(`../src/pages${pageName}`)).default;
  const isAsync = Page.constructor.name === "AsyncFunction";
  if (isAsync) return await Page();
  return <Page />;
}

function getClientManifest() {
  const clientManifest = readFileSync(
    path.resolve(__dirname, "../build/react-client-manifest.json"),
    "utf8"
  );
  const ssrManifest = readFileSync(
    path.resolve(__dirname, "../build/react-ssr-manifest.json"),
    "utf8"
  );
  const clientModuleMap = JSON.parse(clientManifest);
  const { moduleLoading, moduleMap: ssrModuleMap } = JSON.parse(ssrManifest);
  // merge ssrModuleMap with chunks in clientModuleMap for "createFromReadableStream"
  Object.values(ssrModuleMap).forEach((item) => {
    const { specifier } = item["*"];
    item["*"].id = clientModuleMap[specifier].id;
    item["*"].chunks = clientModuleMap[specifier].chunks;
  });
  return {
    clientModuleMap,
    ssrModuleMap,
    moduleLoading,
  };
}

async function waitForWebpack() {
  while (true) {
    try {
      readFileSync(path.resolve(__dirname, "../build/main.js"));
      return;
    } catch (err) {
      console.log(
        "Could not find webpack build output. Will retry in a second..."
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function streamToString(stream) {
  let buffer = "";

  await stream
    // Decode the streamed chunks to turn them into strings.
    .pipeThrough(createDecodeTransformStream())
    .pipeTo(
      new WritableStream({
        write(chunk) {
          // console.log(chunk);
          chunk.split("\n").forEach((line) => {
            buffer += `self.__ssr_f.push([1, ${JSON.stringify(line)}]);`;
          });
        },
      })
    );

  return buffer;
}

async function readStream(readableStream) {
  const reader = readableStream.getReader();
  const chunks = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }

  return chunks.map((chunk) => new TextDecoder("utf-8").decode(chunk)).join("");
}
