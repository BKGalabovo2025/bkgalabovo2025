"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  // Може да покажете някакъв индикатор за зареждане, докато пренасочването се извършва
  return null;
}
