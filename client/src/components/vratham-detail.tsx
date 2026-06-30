import { useState } from "react";
import { ArrowLeft, CalendarClock, BookOpen, ShoppingBag, Play, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import type { Vratham } from "@/lib/vrathams";

interface VrathamDetailProps {
  vratham: Vratham;
  onBack: () => void;
}

export function VrathamDetail({ vratham: v, onBack }: VrathamDetailProps) {
  const { language, t } = useLanguage();
  const [started, setStarted] = useState(false);

  const name = language === "telugu" ? v.nameTe : v.nameEn;
  const deity = language === "telugu" ? v.deityTe : v.deityEn;
  const when = language === "telugu" ? v.whenTe : v.whenEn;
  const about = language === "telugu" ? v.aboutTe : v.aboutEn;

  return (
    <div className="space-y-6" data-testid={`vratham-detail-${v.slug}`}>
      <Button variant="ghost" size="sm" className="gap-2" onClick={onBack} data-testid="button-vratham-back">
        <ArrowLeft className="h-4 w-4" />
        {t("వ్రతాలు", "All Vrathams")}
      </Button>

      {/* Hero */}
      <section className="cel-hero relative overflow-hidden rounded-[18px] p-7 md:p-10">
        <div className="flex items-center gap-5">
          <span
            className="flex-none grid place-items-center h-16 w-16 rounded-2xl text-3xl border"
            style={{
              borderColor: "hsl(var(--gold-deep))",
              background: "radial-gradient(circle at 30% 30%, hsl(var(--saffron) / 0.22), transparent 70%)",
            }}
          >
            {v.emoji}
          </span>
          <div>
            <div className="cel-eyebrow">{deity}</div>
            <h1 className="cel-headline text-3xl md:text-4xl mt-1.5">{name}</h1>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* When to perform */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="cel-panel-title flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                {t("ఎప్పుడు ఆచరించాలి", "When to perform")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-lg leading-relaxed">{when}</p>
              {v.festivalDate && (
                <p className="text-sm text-muted-foreground mt-3">
                  {t("ఈ సంవత్సరం", "This year")}:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(v.festivalDate + "T12:00:00").toLocaleDateString(
                      language === "telugu" ? "te-IN" : "en-US",
                      { weekday: "long", year: "numeric", month: "long", day: "numeric" },
                    )}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="cel-panel-title flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("గురించి", "About")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-serif text-lg leading-relaxed">
              {about.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Samagri / shopping list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="cel-panel-title flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              {t("కావలసిన సామగ్రి", "Items to buy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {v.samagri.map((group, gi) => (
              <div key={gi}>
                <p className="cel-eyebrow mb-2.5">{language === "telugu" ? group.titleTe : group.titleEn}</p>
                <ul className="space-y-2">
                  {group.items.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-none" />
                      <span>{language === "telugu" ? item.te : item.en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Guided puja deck */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap pb-3">
          <CardTitle className="cel-panel-title flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            {t("గైడెడ్ పూజ", "Guided Puja")}
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={v.deckUrl} target="_blank" rel="noopener noreferrer" data-testid="link-deck-fullscreen">
              {t("ఫుల్ స్క్రీన్", "Open full screen")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          {started ? (
            <div className="rounded-xl overflow-hidden border bg-background" style={{ height: "78vh" }}>
              <iframe
                src={v.deckUrl}
                title={`${v.nameEn} — guided puja`}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media"
                data-testid={`iframe-deck-${v.slug}`}
              />
            </div>
          ) : (
            <button
              onClick={() => setStarted(true)}
              className="cel-hero w-full rounded-xl p-10 text-center hover-elevate"
              data-testid={`button-start-deck-${v.slug}`}
            >
              <span className="grid place-items-center mx-auto h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4">
                <Play className="h-7 w-7 ml-1" />
              </span>
              <p className="font-display tracking-[0.16em] uppercase text-sm text-[hsl(var(--gold-deep))]">
                {t("గైడెడ్ పూజ ప్రారంభించండి", "Start the guided puja")}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t(
                  "మంత్రాలు, నైవేద్యం మరియు కథతో అడుగడుగునా మార్గదర్శనం",
                  "Step-by-step audio guidance with mantras, offerings & katha",
                )}
              </p>
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
