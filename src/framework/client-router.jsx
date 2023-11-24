import {
  createContext,
  startTransition,
  useContext,
  useState,
  use,
} from "react";
import {
  createFromFetch,
  createFromReadableStream,
} from "react-server-dom-webpack/client";

const RouterContext = createContext();
const initialCache = new Map();

const routeKey = JSON.stringify({
  pathname: location.pathname,
});
initialCache.set(routeKey, injectServerRoot());

// TODO: cache handleing, navigation handling
export default function ClientRouter() {
  const [cache, setCache] = useState(initialCache);
  const [route, setRoute] = useState({
    pathname: location.pathname,
  });

  const routeKey = JSON.stringify(route);
  let content = cache.get(routeKey);
  if (!content) {
    content = createFromFetch(
      fetch("/react?route=" + encodeURIComponent(routeKey))
    );
    cache.set(routeKey, content);
  }

  return (
    <RouterContext.Provider value={{ route }}>
      {use(content)}
    </RouterContext.Provider>
  );
}

export function useClientRouter() {
  return useContext(RouterContext);
}

function stringToStream(value) {
  return new Blob([value], { type: "text/plain" }).stream();
}

function injectServerRoot() {
  const rawStreams = window.__ssr_f;
  const streams = {};
  rawStreams.forEach(([id, line]) => {
    streams[id] = (streams[id] || "") + line + "\n";
  });
  const content = createFromReadableStream(stringToStream(streams[1]));
  return content;
}
