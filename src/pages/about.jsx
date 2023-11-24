import { Suspense } from "react";
import Counter from "../components/Counter";
import Test from "../components/Test";

export default function About() {
  return (
    <div>
      Hello About
      <Test />
      {/* <Suspense fallback={<>Loading...</>}> */}
      <Counter />
      {/* </Suspense> */}
    </div>
  );
}
