"use client";

import { useEffect } from "react";
import { Button, Panel, Badge } from "@/components/ui/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cerbo] boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Panel className="max-w-md p-6 text-center">
        <Badge tone="bad">erreur runtime</Badge>
        <h2 className="mt-3 text-lg font-medium text-offwhite">
          Un composant a échoué
        </h2>
        <p className="mt-2 text-sm text-muted">
          L'instrument reste utilisable — relance l'étape ou recharge la vue.
          {error?.message ? (
            <span className="mt-2 block text-[12px] text-faint">
              {error.message}
            </span>
          ) : null}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="primary" onClick={reset}>
            Réessayer
          </Button>
          <Button variant="ghost" onClick={() => location.reload()}>
            Recharger
          </Button>
        </div>
      </Panel>
    </div>
  );
}
