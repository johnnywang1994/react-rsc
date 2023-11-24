import React from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import ClientRouter from "./client-router";

// React.startTransition(() => {
//   hydrateRoot(document, <ClientRouter />);
// });

const root = createRoot(document);
root.render(<ClientRouter />);
