import { ChevronRight, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { VRATHAMS, type Vratham } from "@/lib/vrathams";

interface VrathamsListProps {
  onSelect: (vratham: Vratham) => void;
}

export function VrathamsList({ onSelect }: VrathamsListProps) {
  const { language, t } = useLanguage();

  return (
    <div className="space-y-5" data-testid="vrathams-list">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-telugu text-2xl md:text-3xl font-semibold">{t("వ్రతాలు", "Vrathams")}</h2>
        <p className="text-muted-foreground mt-2">
          {t(
            "ఇంట్లో చేసుకునే పూజలు — ఎప్పుడు చేయాలి, కావలసిన సామగ్రి, మరియు అడుగడుగునా గైడెడ్ పూజ.",
            "Home pujas — when to perform them, what to buy, and a step-by-step guided puja to play.",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {VRATHAMS.map((v) => (
          <button
            key={v.slug}
            onClick={() => onSelect(v)}
            className="text-left"
            data-testid={`card-vratham-${v.slug}`}
          >
            <Card className="h-full hover-elevate active-elevate-2 transition-all">
              <CardContent className="p-6 flex items-start gap-4">
                <span
                  className="flex-none grid place-items-center h-14 w-14 rounded-2xl text-2xl border"
                  style={{
                    borderColor: "hsl(var(--gold-deep))",
                    background: "radial-gradient(circle at 30% 30%, hsl(var(--saffron) / 0.2), transparent 70%)",
                  }}
                >
                  {v.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="cel-eyebrow">{language === "telugu" ? v.deityTe : v.deityEn}</div>
                  <h3 className="font-telugu text-xl font-semibold mt-1">
                    {language === "telugu" ? v.nameTe : v.nameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 mt-0.5 flex-none text-primary" />
                    <span className="line-clamp-2">{language === "telugu" ? v.whenTe : v.whenEn}</span>
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-none self-center" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
