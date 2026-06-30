import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { getStoredTimezone } from "@/components/timezone-selector";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Example questions to seed the conversation — the kinds of day-to-day things
// people ask a panchangam guide. Shown as tappable chips on the empty screen.
const SUGGESTIONS: { te: string; en: string }[] = [
  {
    te: "ఈరోజు ప్రయాణానికి మంచి ముహూర్తం ఏది?",
    en: "What's a good muhurtam for travel today?",
  },
  { te: "ఈరోజు రాహుకాలం ఎప్పుడు?", en: "When is Rahu Kalam today?" },
  { te: "ఈరోజు తిథి, నక్షత్రం ఏమిటి?", en: "What's the tithi and nakshatra today?" },
  { te: "ఈ సంవత్సరం ఉగాది ఎప్పుడు?", en: "When is Ugadi this year?" },
  { te: "రాబోయే పండుగలు ఏవి?", en: "Which festivals are coming up?" },
  {
    te: "సత్యనారాయణ వ్రతం ఎలా చేయాలి? సామగ్రి ఏమిటి?",
    en: "How do I perform Satyanarayana Vratam? What samagri do I need?",
  },
  {
    te: "ఈరోజు కొత్త వాహనం కొనడానికి మంచిదేనా?",
    en: "Is today auspicious for buying a new vehicle?",
  },
  { te: "వినాయక చవితి కథ చెప్పండి", en: "Tell me the story of Vinayaka Chavithi" },
];

export function ChatWidget() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check whether the server has chat configured (ANTHROPIC_API_KEY set).
  useEffect(() => {
    fetch("/api/chat/status")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          timezone: getStoredTimezone(),
          language,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything until we know chat is available.
  if (enabled === false) return null;

  return (
    <>
      {/* Floating launcher — sits above the mobile bottom nav. */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="icon"
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6"
          data-testid="button-open-chat"
          aria-label={t("ప్రశ్నలు అడగండి", "Ask a question")}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col rounded-t-2xl border bg-card shadow-2xl md:inset-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:rounded-2xl"
          data-testid="panel-chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold leading-none">
                  {t("పంచాంగం సహాయకుడు", "Panchangam Assistant")}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t(
                    "పండుగలు, ముహూర్తాలు, వ్రతాల గురించి అడగండి",
                    "Ask about festivals, muhurtams & vrathams",
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setOpen(false)}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              data-testid="button-close-chat"
              aria-label={t("మూసివేయి", "Close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t(
                    "ఏదైనా అడగండి, లేదా కింది వాటిలో ఒకటి ప్రయత్నించండి:",
                    "Ask me anything, or try one of these:",
                  )}
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(t(s.te, s.en))}
                      className="rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                      data-testid={`chip-suggestion-${i}`}
                    >
                      {t(s.te, s.en)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground")
                  }
                  data-testid={`message-${m.role}-${i}`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("ఆలోచిస్తోంది…", "Thinking…")}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("మీ ప్రశ్న రాయండి…", "Type your question…")}
              className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-chat"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              disabled={loading || !input.trim()}
              data-testid="button-send-chat"
              aria-label={t("పంపండి", "Send")}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
