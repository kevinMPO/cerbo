"use client";

import { useRef, useState } from "react";
import { Mic, Send, X, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/primitives";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "cerbo"; content: string };

const LABELS = {
  fr: { open: "Parle à CERBO", title: "Parle à CERBO", hint: "Clique le micro et parle — ou écris.", placeholder: "Écris un message…", listening: "J'écoute…", first: "Bonjour ! Dis-moi le nom d'une entreprise et je t'explique comment je la qualifierais — ou pose-moi une question.", noSpeech: "Micro vocal non supporté par ce navigateur — écris ton message." },
  en: { open: "Talk to CERBO", title: "Talk to CERBO", hint: "Tap the mic and speak — or type.", placeholder: "Type a message…", listening: "Listening…", first: "Hi! Tell me a company name and I'll explain how I'd qualify it — or ask me anything.", noSpeech: "Voice input isn't supported in this browser — type your message." },
};

export function TalkToCerbo() {
  const { lang } = useLang();
  const t = LABELS[lang];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "cerbo", content: t.first }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<any>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, voice: true }),
      });
      const d: any = await res.json();
      if (!d.ok) throw new Error(d.error || "chat failed");
      setMessages((m) => [...m, { role: "cerbo", content: d.reply }]);
      if (d.audioBase64) {
        audioRef.current?.pause();
        const a = new Audio(`data:audio/mpeg;base64,${d.audioBase64}`);
        audioRef.current = a;
        a.play().catch(() => {});
      }
    } catch (e) {
      toast.error("CERBO n'a pas pu répondre", { description: String(e) });
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      toast.message(t.noSpeech);
      return;
    }
    const rec = new SR();
    rec.lang = lang === "fr" ? "fr-FR" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript || "";
      setListening(false);
      if (transcript) send(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)}>
        <Mic className="h-4 w-4 text-accent" /> {t.open}
      </Button>

      {open && (
        <div className="fixed bottom-4 right-4 z-[110] flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2 text-[13px] font-medium text-offwhite">
              <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-pulse-dot rounded-full bg-accent" /><span className="relative h-2 w-2 rounded-full bg-accent" /></span>
              {t.title}
            </div>
            <button onClick={() => { setOpen(false); audioRef.current?.pause(); recRef.current?.stop?.(); }} className="text-faint hover:text-offwhite">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex max-h-[46vh] min-h-[180px] flex-col gap-2 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-snug", m.role === "user" ? "self-end bg-accent/15 text-offwhite" : "self-start border border-border bg-canvas text-muted")}>
                {m.content}
              </div>
            ))}
            {busy && <div className="self-start flex items-center gap-1.5 text-[12px] text-faint"><Loader2 className="h-3 w-3 animate-spin" /> CERBO réfléchit…</div>}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-2">
            <button
              onClick={toggleMic}
              className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors", listening ? "border-accent-line bg-accent text-[#04120f]" : "border-border text-accent hover:border-accent-line")}
              title="Micro"
            >
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder={listening ? t.listening : t.placeholder}
              className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-[13px] text-offwhite outline-none focus:border-accent-line"
            />
            <button onClick={() => send(input)} disabled={busy || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-[#04120f] disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
