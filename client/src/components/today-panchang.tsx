import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoonPhase } from "./moon-phase";
import { Sunrise, Sunset, Star, Calendar, Moon } from "lucide-react";
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
      <Card className="overflow-hidden" data-testid="card-today-panchang-loading">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 pb-4">
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!panchang) {
    return (
      <Card className="overflow-hidden" data-testid="card-today-panchang-empty">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Unable to load today's panchang data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="card-today-panchang">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-serif flex flex-wrap items-center gap-2">
              <span data-testid="text-telugu-date">
                {language === "telugu" 
                  ? `${panchang.teluguMonth} ${panchang.teluguDate}, ${panchang.teluguYear}`
                  : `${panchang.teluguMonthEnglish} ${panchang.teluguDate}, ${panchang.teluguYear}`
                }
              </span>
              {panchang.isSpecialDay && (
                <Badge variant="default" className="ml-2" data-testid="badge-special-day">
                  {language === "telugu" ? panchang.specialDayInfoTelugu : panchang.specialDayInfo}
                </Badge>
              )}
            </CardTitle>
            {panchang.samvatsaraName && (
              <p className="text-sm font-medium text-primary mt-1" data-testid="text-samvatsara">
                {language === "telugu"
                  ? `శ్రీ ${panchang.samvatsaraNameTelugu} నామ సంవత్సరం`
                  : `Sri ${panchang.samvatsaraName} Nama Samvatsaram`}
              </p>
            )}
            <p className="text-muted-foreground mt-1" data-testid="text-english-date">
              {new Date(panchang.date + "T12:00:00").toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <MoonPhase phase={panchang.moonPhase} size={56} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("తిథి", "Tithi")}</p>
                <p className="font-medium" data-testid="text-tithi">
                  {language === "telugu" 
                    ? `${panchang.pakshaTelugu} ${panchang.tithiTelugu}`
                    : `${panchang.paksha} ${panchang.tithi}`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1" data-testid="text-tithi-timing">
                  {panchang.tithiStartTime} - {panchang.tithiEndTime}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent/20">
                <Star className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("నక్షత్రం", "Nakshatra")}</p>
                <p className="font-medium" data-testid="text-nakshatra">
                  {language === "telugu" ? panchang.nakshatraTelugu : panchang.nakshatra}
                </p>
                <p className="text-xs text-muted-foreground mt-1" data-testid="text-nakshatra-timing">
                  {panchang.nakshatraStartTime} - {panchang.nakshatraEndTime}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-500/10">
                <Sunrise className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("సూర్యోదయం", "Sunrise")}</p>
                <p className="font-medium" data-testid="text-sunrise">{panchang.sunrise}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-orange-500/10">
                <Sunset className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("సూర్యాస్తమయం", "Sunset")}</p>
                <p className="font-medium" data-testid="text-sunset">{panchang.sunset}</p>
              </div>
            </div>
            
            {panchang.timezone && (
              <p className="text-xs text-muted-foreground pt-2" data-testid="text-timezone">
                {t("టైమ్‌జోన్", "Timezone")}: {panchang.timezone}
              </p>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("తెలుగు మాసం", "Telugu Month")}</p>
                <p className="font-medium" data-testid="text-telugu-month">
                  {language === "telugu" ? panchang.teluguMonth : panchang.teluguMonthEnglish}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
