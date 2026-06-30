import { ArrowLeft, CalendarDays, Flower2, CalendarSearch, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import type { Festival } from "@shared/schema";
import { festivalContent, FALLBACK_IMAGE } from "@/lib/festival-content";
import { vrathamBySlug } from "@/lib/vrathams";

interface FestivalDetailProps {
  festival: Festival;
  onBack: () => void;
  onOpenVratham: (slug: string) => void;
  onViewInCalendar: (festival: Festival) => void;
}

export function FestivalDetail({ festival, onBack, onOpenVratham, onViewInCalendar }: FestivalDetailProps) {
  const { language, t } = useLanguage();
  const content = festivalContent(festival.id);
  const image = content?.image ?? FALLBACK_IMAGE;
  const name = language === "telugu" ? festival.nameTelugu : festival.name;

  const about =
    (language === "telugu" ? content?.aboutTe : content?.aboutEn) ??
    [language === "telugu" ? festival.descriptionTelugu || festival.description : festival.description];

  const vratham = content?.vrathamSlug ? vrathamBySlug(content.vrathamSlug) : undefined;

  const dateLabel = new Date(festival.date + "T12:00:00").toLocaleDateString(
    language === "telugu" ? "te-IN" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );

  const typeLabel =
    language === "telugu"
      ? festival.type === "major"
        ? "ప్రధాన"
        : festival.type === "minor"
          ? "చిన్న"
          : "ప్రాంతీయ"
      : festival.type;

  return (
    <div className="space-y-6" data-testid={`festival-detail-${festival.id}`}>
      <Button variant="ghost" size="sm" className="gap-2" onClick={onBack} data-testid="button-festival-back">
        <ArrowLeft className="h-4 w-4" />
        {t("అన్ని పండుగలు", "All Festivals")}
      </Button>

      {/* Hero image */}
      <section className="relative overflow-hidden rounded-[20px] border" style={{ borderColor: "hsl(var(--cel-line) / 0.5)" }}>
        <img
          src={image}
          alt={name}
          className="w-full h-64 md:h-80 object-cover"
          loading="lazy"
          data-testid="festival-hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-9">
          <Badge className="mb-3 capitalize bg-white/15 text-white border-white/25 backdrop-blur">{typeLabel}</Badge>
          <h1 className="font-telugu text-3xl md:text-5xl font-semibold text-white leading-tight">{name}</h1>
          <p className="text-white/85 mt-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {dateLabel}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* About */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="cel-panel-title">{t("గురించి", "About")}</h2>
          <div className="space-y-3 font-serif text-lg leading-relaxed">
            {about.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {vratham && (
            <button
              onClick={() => onOpenVratham(vratham.slug)}
              className="w-full text-left"
              data-testid="link-festival-vratham"
            >
              <Card className="cel-hero hover-elevate">
                <CardContent className="p-5 flex items-center gap-4">
                  <span className="flex-none grid place-items-center h-12 w-12 rounded-full bg-primary text-primary-foreground text-xl">
                    {vratham.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="cel-eyebrow flex items-center gap-1.5">
                      <Flower2 className="h-3.5 w-3.5" />
                      {t("ఈ పండుగ పూజ", "Puja for this festival")}
                    </p>
                    <p className="font-telugu text-lg font-semibold mt-0.5">
                      {language === "telugu" ? vratham.nameTe : vratham.nameEn}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("సామగ్రి & గైడెడ్ పూజ", "Items to buy & guided puja")}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary flex-none" />
                </CardContent>
              </Card>
            </button>
          )}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => onViewInCalendar(festival)}
            data-testid="button-festival-in-calendar"
          >
            <CalendarSearch className="h-4 w-4" />
            {t("క్యాలెండర్‌లో చూడండి", "View in calendar")}
          </Button>
        </div>
      </div>
    </div>
  );
}
