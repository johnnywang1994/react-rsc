"use client";
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return <div onClick={() => setCount(count + 1)}>Count: {count}</div>;
}
