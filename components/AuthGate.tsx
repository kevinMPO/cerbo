"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentUser } from "@/lib/auth";

/**
 * Client-side gate for the console (replaces the removed middleware, since
 * static export can't run middleware). Redirects to /login when not signed in.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const authed = !!currentUser();
    setOk(authed);
    if (!authed) router.replace("/login?from=" + encodeURIComponent(window.location.pathname));
  }, [router]);

  if (ok === null)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-faint">
        …
      </div>
    );
  if (!ok) return null;
  return <>{children}</>;
}
