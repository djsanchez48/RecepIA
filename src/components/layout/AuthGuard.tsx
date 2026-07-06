"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/acceso", "/bienvenida", "/api/auth/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("recepia_session="))
      ?.split("=")[1];

    if (!token) {
      const next = encodeURIComponent(pathname);
      router.replace(`/acceso?next=${next}`);
      return;
    }

    if (pathname !== "/bienvenida" && !onboardingChecked) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((p) => {
          setOnboardingChecked(true);
          if (!p.onboardingCompletedAt) {
            router.replace("/bienvenida");
          }
        });
    }
  }, [pathname, router, onboardingChecked]);

  return <>{children}</>;
}
