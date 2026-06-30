import { Badge } from "@/components/ui/badge";
import { MoonPhase } from "./moon-phase";
import { Sunrise, Star, Calendar, Moon } from "lucide-react";
import type { PanchangData } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";

interface TodayPanchangProps {
  panchang?: PanchangData;
  isLoading?: boolean;
}

export function TodayPanchang({ panchang, isLoading }: TodayPanchangProps) {
  const { language, t } = useLanguage();

  if (isLoading) {
    return (
      <div data-testid="card-today-panchang-loading">
        <div className="cel-hero rounded-[18px] p-8 md:p-12">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-72 max-w-full" />
              <Skeleton className="h-5 w-56" />
            </div>
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px cel-strip rounded-[14px] overflow-hidden mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  if (!panchang) {
    return (
      <div className="cel-hero rounded-[18px] p-10 text-center" data-testid="card-today-panchang-empty">
        <p className="text-muted-foreground">Unable to load today's panchang data</p>
      </div>
    );
  }

  const teluguDateLine =
    language === "telugu"
      ? `${panchang.teluguMonth} ${panchang.teluguDate}, ${panchang.teluguYear}`
      : `${panchang.teluguMonthEnglish} ${panchang.teluguDate}, ${panchang.teluguYear}`;

  return (
    <div data-testid="card-today-panchang">
      {/* ---- Hero almanac plate ---- */}
      <section className="cel-hero relative overflow-hidden rounded-[18px] p-7 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="min-w-0">
            <div className="cel-eyebrow">{t("నేటి తిథి", "Today")} &middot; {t("Today", "నేటి తిథి")}</div>
            <h1
              className="cel-headline text-4xl md:text-5xl lg:text-[3.4rem] mt-3 mb-1"
              data-testid="text-telugu-date"
            >
              {teluguDateLine}
            </h1>
            {panchang.samvatsaraName && (
              <p className="font-serif italic text-xl md:text-2xl text-primary" data-testid="text-samvatsara">
                {language === "telugu"
                  ? `శ్రీ ${panchang.samvatsaraNameTelugu} నామ సంవత్సరం`
                  : `Sri ${panchang.samvatsaraName} Nama Samvatsaram`}
              </p>
            )}
            <p className="text-muted-foreground mt-2" data-testid="text-english-date">
              {new Date(panchang.date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {panchang.isSpecialDay && (
              <Badge
                className="mt-4 font-display tracking-[0.16em] uppercase text-[11px] px-4 py-1.5 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0"
                data-testid="badge-special-day"
              >
                ✦ {language === "telugu" ? panchang.specialDayInfoTelugu : panchang.specialDayInfo}
              </Badge>
            )}
          </div>

          <div className="flex-none text-center self-center">
            <div className="cel-halo inline-block">
              <MoonPhase phase={panchang.moonPhase} size={132} />
            </div>
            <div className="cel-eyebrow mt-3 text-[0.62rem]">
              {language === "telugu" ? panchang.pakshaTelugu : panchang.paksha}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Four-up metric strip ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px cel-strip rounded-[14px] overflow-hidden mt-6">
        <div className="cel-strip-cell p-5 md:p-6">
          <div className="cel-metric-k flex items-center gap-2">
            <Moon className="h-3.5 w-3.5" /> {t("తిథి", "Tithi")}
          </div>
          <p className="font-telugu text-xl md:text-2xl mt-2.5" data-testid="text-tithi">
            {language === "telugu" ? panchang.tithiTelugu : panchang.tithi}
          </p>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-tithi-timing">
            {panchang.tithiStartTime} → {panchang.tithiEndTime}
          </p>
        </div>

        <div className="cel-strip-cell p-5 md:p-6">
          <div className="cel-metric-k flex items-center gap-2">
            <Star className="h-3.5 w-3.5" /> {t("నక్షత్రం", "Nakshatra")}
          </div>
          <p className="font-telugu text-xl md:text-2xl mt-2.5" data-testid="text-nakshatra">
            {language === "telugu" ? panchang.nakshatraTelugu : panchang.nakshatra}
          </p>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-nakshatra-timing">
            {panchang.nakshatraStartTime} → {panchang.nakshatraEndTime}
          </p>
        </div>

        <div className="cel-strip-cell p-5 md:p-6">
          <div className="cel-metric-k flex items-center gap-2">
            <Sunrise className="h-3.5 w-3.5" /> {t("సూర్యుడు", "Sun")}
          </div>
          <p className="font-telugu text-xl md:text-2xl mt-2.5">
            <span data-testid="text-sunrise">{panchang.sunrise}</span>
            <span className="text-muted-foreground"> &middot; </span>
            <span data-testid="text-sunset">{panchang.sunset}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("ఉదయం & అస్తమయం", "rise & set")}</p>
        </div>

        <div className="cel-strip-cell p-5 md:p-6">
          <div className="cel-metric-k flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" /> {t("మాసం", "Masa")}
          </div>
          <p className="font-telugu text-xl md:text-2xl mt-2.5" data-testid="text-telugu-month">
            {panchang.isAdhikaMasa && (language === "telugu" ? "అధిక " : "Adhika ")}
            {language === "telugu" ? panchang.teluguMonth : panchang.teluguMonthEnglish}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "telugu" ? panchang.pakshaTelugu : panchang.paksha} {t("పక్షం", "Paksha")}
          </p>
        </div>
      </div>
    </div>
  );
}
