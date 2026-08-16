import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { AlarmClock, ArrowRight, Moon, ShieldAlert, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { PanchangData } from "@shared/schema";

export interface Period {
  start: string;
  end: string;
}

/** "HH:MM" (24h) → localized 12h display, e.g. "4:30 PM". */
export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 || 12;
  return `${display}:${m.toString().padStart(2, "0")} ${period}`;
}

export function fmtRange(p: Period): string {
  return `${fmtTime(p.start)} – ${fmtTime(p.end)}`;
}

function nowHHMM(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "";
  }
}

function isNowInside(p: Period, timezone: string): boolean {
  const now = nowHHMM(timezone);
  return !!now && now >= p.start && now < p.end;
}

interface RowDef {
  key: string;
  labelTe: string;
  labelEn: string;
  period: Period | null | undefined;
  kind: "avoid" | "good";
  noteTe?: string;
  noteEn?: string;
}

export function periodRows(
  periods: NonNullable<PanchangData["periods"]>,
): RowDef[] {
  return [
    {
      key: "rahu",
      labelTe: "రాహుకాలం",
      labelEn: "Rahu Kalam",
      period: periods.rahuKalam,
      kind: "avoid",
    },
    {
      key: "yama",
      labelTe: "యమగండం",
      labelEn: "Yamagandam",
      period: periods.yamagandam,
      kind: "avoid",
    },
    {
      key: "gulika",
      labelTe: "గుళిక కాలం",
      labelEn: "Gulika Kalam",
      period: periods.gulikaKalam,
      kind: "avoid",
    },
    {
      key: "abhijit",
      labelTe: "అభిజిత్ ముహూర్తం",
      labelEn: "Abhijit Muhurtam",
      period: periods.abhijitMuhurtam,
      kind: "good",
      noteTe: "బుధవారం పాటించరు",
      noteEn: "Not observed on Wednesdays",
    },
    {
      key: "brahma",
      labelTe: "బ్రహ్మ ముహూర్తం",
      labelEn: "Brahma Muhurtam",
      period: periods.brahmaMuhurtam,
      kind: "good",
    },
  ];
}

interface DayTimingsProps {
  panchang?: PanchangData;
  /** Hide the "weekly view" footer link (used on the /rahu-kalam page itself). */
  hideLink?: boolean;
}

export function DayTimings({ panchang, hideLink }: DayTimingsProps) {
  const { t } = useLanguage();
  const periods = panchang?.periods;
  if (!periods) return null;
  const timezone = panchang!.timezone;

  return (
    <Card data-testid="card-day-timings">
      <CardHeader className="pb-3">
        <CardTitle className="cel-panel-title flex items-center gap-2">
          <AlarmClock className="h-4 w-4 text-primary" />
          {t("నేటి శుభ–అశుభ సమయాలు", "Today's Auspicious & Inauspicious Times")}
        </CardTitle>
        <CardDescription>
          {t(
            "సూర్యోదయ–సూర్యాస్తమయాల ఆధారంగా మీ ప్రాంతానికి లెక్కించినవి",
            "Calculated for your location from sunrise and sunset",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {periodRows(periods).map((row) => {
          const active = row.period ? isNowInside(row.period, timezone) : false;
          return (
            <div
              key={row.key}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                row.kind === "avoid"
                  ? "border-red-500/25 bg-red-500/[.04]"
                  : "border-emerald-500/25 bg-emerald-500/[.04]"
              } ${active ? "ring-1 ring-primary/60" : ""}`}
              data-testid={`timing-${row.key}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {row.kind === "avoid" ? (
                  <ShieldAlert className="h-4 w-4 flex-none text-red-500/80" />
                ) : row.key === "brahma" ? (
                  <Moon className="h-4 w-4 flex-none text-emerald-600/90" />
                ) : (
                  <Sparkles className="h-4 w-4 flex-none text-emerald-600/90" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {t(row.labelTe, row.labelEn)}
                  </p>
                  {active && (
                    <p className="text-[11px] text-primary leading-tight">
                      {t("ఇప్పుడు జరుగుతోంది", "Happening now")}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm tabular-nums whitespace-nowrap text-muted-foreground">
                {row.period
                  ? fmtRange(row.period)
                  : t(row.noteTe ?? "—", row.noteEn ?? "—")}
              </p>
            </div>
          );
        })}
        {!hideLink && (
          <Link href="/rahu-kalam">
            <span className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer" data-testid="link-week-timings">
              {t("వారం మొత్తం రాహుకాలం చూడండి", "See the whole week's Rahu Kalam")}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
