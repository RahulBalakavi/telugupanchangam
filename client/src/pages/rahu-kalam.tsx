import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimezoneSelector, getStoredTimezone, setStoredTimezone } from "@/components/timezone-selector";
import { DayTimings, fmtRange } from "@/components/day-timings";
import { useLanguage } from "@/hooks/use-language";
import { useState } from "react";
import type { PanchangData } from "@shared/schema";

interface WeekDay {
  date: string;
  weekday: number;
  periods: NonNullable<PanchangData["periods"]>;
}

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_TE = ["ఆదివారం", "సోమవారం", "మంగళవారం", "బుధవారం", "గురువారం", "శుక్రవారం", "శనివారం"];

export default function RahuKalamPage() {
  const { t, language } = useLanguage();
  const [timezone, setTimezone] = useState(getStoredTimezone);

  const { data: panchang } = useQuery<PanchangData>({
    queryKey: ["/api/panchang/today", timezone],
    queryFn: async () => {
      const res = await fetch(`/api/panchang/today?timezone=${encodeURIComponent(timezone)}`);
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const { data: week } = useQuery<{ timezone: string; days: WeekDay[] }>({
    queryKey: ["/api/periods/week", timezone],
    queryFn: async () => {
      const res = await fetch(`/api/periods/week?timezone=${encodeURIComponent(timezone)}`);
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const handleTimezoneChange = (tz: string) => {
    setStoredTimezone(tz);
    setTimezone(tz);
  };

  const dateLabel = (iso: string) =>
    new Date(iso + "T12:00:00Z").toLocaleDateString(language === "telugu" ? "te-IN" : "en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back-home">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t("పంచాంగం", "Panchangam")}</span>
              </span>
            </Link>
            <h1 className="text-lg md:text-xl font-telugu font-semibold truncate" data-testid="text-rahukalam-title">
              {t("రాహుకాలం & ముహూర్తాలు", "Rahu Kalam & Muhurtams")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        <div className="sm:hidden">
          <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
        </div>

        <DayTimings panchang={panchang} hideLink />

        <Card data-testid="card-week-timings">
          <CardHeader className="pb-3">
            <CardTitle className="cel-panel-title">
              {t("ఈ వారం రాహుకాలం", "This Week's Rahu Kalam")}
            </CardTitle>
            <CardDescription>
              {t(
                "రాహుకాలంలో కొత్త పనులు, ప్రయాణాలు, శుభకార్యాలు ప్రారంభించకూడదని సంప్రదాయం",
                "Tradition avoids starting new ventures, journeys, or auspicious work during Rahu Kalam",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-3 font-medium">{t("రోజు", "Day")}</th>
                    <th className="py-2 pr-3 font-medium">{t("రాహుకాలం", "Rahu Kalam")}</th>
                    <th className="py-2 pr-3 font-medium">{t("యమగండం", "Yamagandam")}</th>
                    <th className="py-2 font-medium">{t("గుళిక", "Gulika")}</th>
                  </tr>
                </thead>
                <tbody>
                  {week?.days.map((d, i) => (
                    <tr key={d.date} className={`border-b last:border-0 ${i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`} data-testid={`week-row-${d.date}`}>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {t(WEEKDAYS_TE[d.weekday], WEEKDAYS_EN[d.weekday])}
                        <span className="ml-1.5 text-xs text-muted-foreground">{dateLabel(d.date)}</span>
                        {i === 0 && <span className="ml-1.5 text-xs text-primary">{t("నేడు", "Today")}</span>}
                      </td>
                      <td className="py-2 pr-3 tabular-nums whitespace-nowrap text-red-600 dark:text-red-400">{fmtRange(d.periods.rahuKalam)}</td>
                      <td className="py-2 pr-3 tabular-nums whitespace-nowrap">{fmtRange(d.periods.yamagandam)}</td>
                      <td className="py-2 tabular-nums whitespace-nowrap">{fmtRange(d.periods.gulikaKalam)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="cel-panel-title">
              {t("ఈ సమయాలు ఎలా లెక్కిస్తారు?", "How are these times calculated?")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              {t(
                "సూర్యోదయం నుంచి సూర్యాస్తమయం వరకు గల పగటిని 8 సమాన భాగాలుగా విభజిస్తారు. వారాన్ని బట్టి ఏ భాగం రాహుకాలమో, యమగండమో, గుళిక కాలమో నిర్ణయమవుతుంది. అందుకే ఈ సమయాలు ప్రతి ఊరికీ, ప్రతి రోజుకీ మారుతాయి.",
                "Daytime (sunrise to sunset) is divided into 8 equal parts. Which part is Rahu Kalam, Yamagandam, or Gulika Kalam depends only on the weekday — which is why the times shift with your city and the season.",
              )}
            </p>
            <p>
              {t(
                "అభిజిత్ ముహూర్తం పగటి 15 ముహూర్తాలలో 8వది — మధ్యాహ్న సమయంలో వచ్చే శుభ ఘడియ (బుధవారం మినహా). బ్రహ్మ ముహూర్తం సూర్యోదయానికి 96 నుంచి 48 నిమిషాల ముందు వచ్చే ప్రాతఃకాల శుభ సమయం.",
                "Abhijit Muhurtam is the 8th of the day's 15 muhurtas — the auspicious midday window (not observed on Wednesdays). Brahma Muhurtam is the pre-dawn window from 96 to 48 minutes before sunrise, prized for prayer and study.",
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
