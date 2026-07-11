"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Radio,
  Sparkles,
  Search,
  Volume2,
  Mic,
  Database,
  Brain,
  ScrollText,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PowerupRow } from "@/components/PowerupRail";

type Status = "idle" | "active" | "witnessed" | "error";

type NodeData = {
  label: string;
  sub: string;
  status: Status;
  icon: keyof typeof ICONS;
  kind: "io" | "tool" | "core";
};

const ICONS = {
  leads: Radio,
  hermes: Cpu,
  openai: Sparkles,
  linkup: Search,
  elevenlabs: Volume2,
  wispr: Mic,
  brain: Brain,
  d1: Database,
  proof: ScrollText,
};

function statusRing(s: Status) {
  if (s === "active") return "border-accent-line bg-accent-dim shadow-[0_0_24px_-6px_rgba(94,230,208,0.5)]";
  if (s === "witnessed") return "border-ok/40 bg-ok/[0.06]";
  if (s === "error") return "border-bad/40 bg-bad/[0.06]";
  return "border-border bg-surface";
}
function dotColor(s: Status) {
  if (s === "active") return "bg-accent animate-pulse-dot";
  if (s === "witnessed") return "bg-ok";
  if (s === "error") return "bg-bad";
  return "bg-faint";
}

function CerboNode({ data }: NodeProps) {
  const d = data as NodeData;
  const Icon = ICONS[d.icon];
  const core = d.kind === "core";
  return (
    <div
      className={cn(
        "relative rounded-xl border px-3 py-2.5 transition-all duration-300",
        core ? "w-[190px]" : "w-[150px]",
        statusRing(d.status)
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-white/20" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-white/20" />
      <div className="flex items-center gap-2">
        <span className={cn("text-accent", core && "text-accent")}>
          <Icon className={core ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </span>
        <span className={cn("font-medium text-offwhite", core ? "text-[13px]" : "text-[12px]")}>
          {d.label}
        </span>
        <span className={cn("ml-auto h-2 w-2 rounded-full", dotColor(d.status))} />
      </div>
      <div className="num mt-1 text-[10px] leading-tight text-faint">{d.sub}</div>
    </div>
  );
}

const nodeTypes = { cerbo: CerboNode };

// Which nodes light up ("active") while a given step runs.
const ACTIVE_BY_STEP: Record<string, string[]> = {
  ingest: ["leads", "hermes", "openai", "brain", "d1"],
  qualify: ["hermes", "linkup", "openai", "d1"],
  correct: ["wispr", "hermes", "linkup", "brain", "d1"],
  memo: ["hermes", "openai", "elevenlabs", "proof", "d1"],
  memory: ["hermes", "d1", "proof"],
};

export function AgentGraph({
  powerups,
  busyStep,
  brainMax,
  hasReceipts,
  leadCount,
}: {
  powerups: PowerupRow[] | undefined;
  busyStep: string | null;
  brainMax: number;
  hasReceipts: boolean;
  leadCount: number;
}) {
  const { nodes, edges } = useMemo(() => {
    const pu = new Map((powerups ?? []).map((p) => [p.key, p.status as Status]));
    const active = new Set(busyStep ? ACTIVE_BY_STEP[busyStep] ?? [] : []);

    const st = (key: string, base: Status): Status =>
      active.has(key) ? "active" : base;

    const puStatus = (key: string): Status => (pu.get(key) ?? "idle") as Status;

    const nodeDefs: { id: string; x: number; y: number; data: NodeData }[] = [
      { id: "leads", x: 0, y: 150, data: { label: "Vos leads", sub: `${leadCount || 0} importés`, status: st("leads", leadCount ? "witnessed" : "idle"), icon: "leads", kind: "io" } },
      { id: "wispr", x: 0, y: 310, data: { label: "Vous corrigez à l'oral", sub: "Wispr Flow", status: st("wispr", puStatus("wispr")), icon: "wispr", kind: "tool" } },
      { id: "hermes", x: 250, y: 220, data: { label: "Agent Hermes", sub: "orchestre & trace", status: st("hermes", busyStep ? "active" : hasReceipts ? "witnessed" : "idle"), icon: "hermes", kind: "core" } },
      { id: "openai", x: 560, y: 60, data: { label: "Raisonne & apprend", sub: "moteur", status: st("openai", puStatus("openai")), icon: "openai", kind: "tool" } },
      { id: "linkup", x: 560, y: 180, data: { label: "Enrichit le prospect", sub: "Linkup · live", status: st("linkup", puStatus("linkup")), icon: "linkup", kind: "tool" } },
      { id: "elevenlabs", x: 560, y: 300, data: { label: "Vous répond en voix", sub: "ElevenLabs", status: st("elevenlabs", puStatus("elevenlabs")), icon: "elevenlabs", kind: "tool" } },
      { id: "brain", x: 850, y: 90, data: { label: "Company Brain", sub: brainMax >= 2 ? "règles v1 → v2" : brainMax === 1 ? "règles v1" : "—", status: st("brain", brainMax >= 2 ? "witnessed" : brainMax === 1 ? "active" : "idle"), icon: "brain", kind: "tool" } },
      { id: "d1", x: 850, y: 250, data: { label: "Garde les preuves", sub: "Cloudflare", status: st("d1", puStatus("d1")), icon: "d1", kind: "tool" } },
      { id: "proof", x: 1130, y: 170, data: { label: "Preuves live", sub: hasReceipts ? "traçable" : "—", status: st("proof", hasReceipts ? "witnessed" : "idle"), icon: "proof", kind: "io" } },
    ];

    const nodes: Node[] = nodeDefs.map((n) => ({
      id: n.id,
      type: "cerbo",
      position: { x: n.x, y: n.y },
      data: n.data as unknown as Record<string, unknown>,
      draggable: false,
    }));

    const edgeDefs: [string, string][] = [
      ["leads", "hermes"],
      ["wispr", "hermes"],
      ["hermes", "openai"],
      ["hermes", "linkup"],
      ["hermes", "elevenlabs"],
      ["openai", "brain"],
      ["linkup", "brain"],
      ["brain", "d1"],
      ["elevenlabs", "proof"],
      ["d1", "proof"],
    ];

    const isActiveEdge = (a: string, b: string) =>
      (active.has(a) && active.has(b)) ||
      (busyStep && active.has(a) && active.has(b));

    const edges: Edge[] = edgeDefs.map(([a, b]) => {
      const on = isActiveEdge(a, b);
      return {
        id: `${a}-${b}`,
        source: a,
        target: b,
        animated: !!on,
        style: {
          stroke: on ? "rgba(94,230,208,0.6)" : "rgba(255,255,255,0.10)",
          strokeWidth: on ? 2 : 1,
        },
      };
    });

    return { nodes, edges };
  }, [powerups, busyStep, brainMax, hasReceipts, leadCount]);

  return (
    <div className="h-[380px] w-full overflow-hidden rounded-xl border border-border bg-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(255,255,255,0.05)" />
      </ReactFlow>
    </div>
  );
}
