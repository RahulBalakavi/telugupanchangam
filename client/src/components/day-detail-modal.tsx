import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MoonPhase } from "./moon-phase";
import { Calendar, Moon, Star, Sunrise, Sunset, MapPin, Sun, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { CalendarDay } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

interface DayDetailModalProps {
  day: CalendarDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DayDetailModal({ day, open, onOpenChange }: DayDetailModalProps) {
  const { language, t } = useLanguage();
  
  if (!day) return null;

  const { panchang, festivals, templeEvents, eclipses } = day;

  const eclipseKindLabel = (kind: string) => {
    const map: Record<string, { te: string; en: string }> = {
      total: { te: "సంపూర్ణ", en: "Total" },
      annular: { te: "వలయాకార", en: "Annular" },
      partial: { te: "పాక్షిక", en: "Partial" },
      penumbral: { te: "ఛాయా", en: "Penumbral" },
    };
    const m = map[kind];
    return m ? t(m.te, m.en) : kind;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="modal-day-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl font-serif">
              {day.date.toLocaleDateString(language === "telugu" ? "te-IN" : "en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </DialogTitle>
          <DialogDescription>
            {panchang && (
              <span>
                {language === "telugu" 
                  ? `${panchang.isAdhikaMasa ? "అధిక " : ""}${panchang.teluguMonth} ${panchang.teluguDate}, ${panchang.teluguYear}`
                  : `${panchang.isAdhikaMasa ? "Adhika " : ""}${panchang.teluguMonthEnglish} ${panchang.teluguDate}, ${panchang.teluguYear}`
                }
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {panchang && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {t("పంచాంగ వివరాలు", "Panchang Details")}
                </h3>
                <MoonPhase phase={panchang.moonPhase} size={40} />
              </div>

              {panchang.isSpecialDay && (
                <Badge variant="default" className="mb-2" data-testid="badge-special-day-modal">
                  {language === "telugu" ? panchang.specialDayInfoTelugu : panchang.specialDayInfo}
                </Badge>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Moon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("తిథి", "Tithi")}</p>
                    <p className="font-medium text-sm" data-testid="text-modal-tithi">
                      {language === "telugu" 
                        ? `${panchang.pakshaTelugu} ${panchang.tithiTelugu}`
                        : `${panchang.paksha} ${panchang.tithi}`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-modal-tithi-timing">
                      {panchang.tithiStartTime} - {panchang.tithiEndTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/20">
                    <Star className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("నక్షత్రం", "Nakshatra")}</p>
                    <p className="font-medium text-sm" data-testid="text-modal-nakshatra">
                      {language === "telugu" ? panchang.nakshatraTelugu : panchang.nakshatra}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-modal-nakshatra-timing">
                      {panchang.nakshatraStartTime} - {panchang.nakshatraEndTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Sunrise className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("సూర్యోదయం", "Sunrise")}</p>
                    <p className="font-medium text-sm" data-testid="text-modal-sunrise">
                      {panchang.sunrise}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/20">
                    <Sunset className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("సూర్యాస్తమయం", "Sunset")}</p>
                    <p className="font-medium text-sm" data-testid="text-modal-sunset">
                      {panchang.sunset}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 col-span-2">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("తెలుగు మాసం", "Telugu Month")}</p>
                    <p className="font-medium text-sm" data-testid="text-modal-month">
                      {panchang.isAdhikaMasa && (language === "telugu" ? "అధిక " : "Adhika ")}
                      {language === "telugu" ? panchang.teluguMonth : panchang.teluguMonthEnglish}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {eclipses && eclipses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {t("గ్రహణం", "Eclipse")}
                </h3>
                {eclipses.map((eclipse, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-md bg-muted/50"
                    data-testid={`modal-eclipse-${eclipse.type}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {eclipse.type === "solar" ? (
                          <Sun className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Moon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                        )}
                        <h4 className="font-medium">
                          {eclipseKindLabel(eclipse.kind)}{" "}
                          {eclipse.type === "solar"
                            ? t("సూర్యగ్రహణం", "Solar Eclipse")
                            : t("చంద్రగ్రహణం", "Lunar Eclipse")}
                        </h4>
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-muted-foreground">
                      {t("గ్రహణ మధ్యకాలం: ", "Peak: ")}
                      <span className="text-foreground font-medium">{eclipse.peakLocal}</span>
                      {" · "}
                      {t("నక్షత్రం: ", "Nakshatra: ")}
                      <span className="text-foreground font-medium">
                        {language === "telugu" ? eclipse.nakshatraTelugu : eclipse.nakshatra}
                      </span>
                    </p>
                    <Link
                      href="/eclipses"
                      className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                      data-testid="link-eclipse-details"
                    >
                      {t("వివరాలు, ప్రభావిత నక్షత్రాలు, పరిహారాలు", "Visibility, affected stars & remedies")}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {festivals.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {t("పండుగలు", "Festivals")}
                </h3>
                {festivals.map((festival) => (
                  <div
                    key={festival.id}
                    className="p-3 rounded-md bg-muted/50"
                    data-testid={`modal-festival-${festival.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium">
                          {language === "telugu" ? festival.nameTelugu : festival.name}
                        </h4>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {language === "telugu" 
                          ? (festival.type === "major" ? "ప్రధాన" : festival.type === "minor" ? "చిన్న" : "ప్రాంతీయ")
                          : festival.type
                        }
                      </Badge>
                    </div>
                    <p className="text-sm mt-2">
                      {language === "telugu" ? (festival.descriptionTelugu || festival.description) : festival.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {templeEvents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {t("దేవాలయ కార్యక్రమాలు", "Temple Events")}
                </h3>
                {templeEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-md bg-muted/50"
                    data-testid={`modal-event-${event.id}`}
                  >
                    <h4 className="font-medium">
                      {language === "telugu" ? event.eventNameTelugu : event.eventName}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <span className="text-base">🛕</span>
                      <span>{language === "telugu" ? event.templeNameTelugu : event.templeName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{language === "telugu" ? event.locationTelugu : event.location}</span>
                    </div>
                    <p className="text-sm mt-2">
                      {language === "telugu" ? (event.descriptionTelugu || event.description) : event.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
