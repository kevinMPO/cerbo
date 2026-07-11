"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { LangProvider } from "@/lib/i18n";

/** App providers. Data is fetched via polling (lib/useLive); no realtime client. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111114",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#EDEDF0",
            fontSize: "13px",
          },
        }}
      />
    </LangProvider>
  );
}
