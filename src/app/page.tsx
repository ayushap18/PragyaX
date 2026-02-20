"use client";

import dynamic from "next/dynamic";

const PragyaXShell = dynamic(
  () => import("@/components/layout/PragyaXShell"),
  { ssr: false }
);

export default function Home() {
  return <PragyaXShell />;
}
