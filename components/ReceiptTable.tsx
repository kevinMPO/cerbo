"use client";

import { Panel, Mono, Badge, Skeleton } from "@/components/ui/primitives";
import { fmtMs, fmtUsd, fmtClock } from "@/lib/utils";

export type Receipt = {
  _id?: string;
  step: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  ok: boolean;
  createdAt: number;
};

export function ReceiptTable({
  receipts,
  loading,
}: {
  receipts: Receipt[] | undefined;
  loading?: boolean;
}) {
  if (loading && !receipts) {
    return (
      <Panel className="p-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </Panel>
    );
  }
  if (!receipts || receipts.length === 0) {
    return (
      <Panel className="p-6 text-center text-sm text-faint">
        Aucun receipt Hermes encore.
      </Panel>
    );
  }
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-faint">
              <th className="px-4 py-2 font-medium">step</th>
              <th className="px-4 py-2 font-medium">provider</th>
              <th className="px-4 py-2 font-medium">model</th>
              <th className="px-4 py-2 text-right font-medium">tokens</th>
              <th className="px-4 py-2 text-right font-medium">coût</th>
              <th className="px-4 py-2 text-right font-medium">latence</th>
              <th className="px-4 py-2 text-right font-medium">t</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r, i) => (
              <tr
                key={r._id ?? i}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-2">
                  <Badge tone="accent">{r.step}</Badge>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      r.provider === "openai"
                        ? "text-ok"
                        : r.provider === "openrouter"
                          ? "text-accent"
                          : "text-faint"
                    }
                  >
                    {r.provider}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Mono className="text-muted">{r.model}</Mono>
                </td>
                <td className="px-4 py-2 text-right">
                  <Mono className="text-muted">
                    {r.tokensIn}+{r.tokensOut}
                  </Mono>
                </td>
                <td className="px-4 py-2 text-right">
                  <Mono>{fmtUsd(r.costUsd)}</Mono>
                </td>
                <td className="px-4 py-2 text-right">
                  <Mono>{fmtMs(r.latencyMs)}</Mono>
                </td>
                <td className="px-4 py-2 text-right">
                  <Mono className="text-faint">{fmtClock(r.createdAt)}</Mono>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
