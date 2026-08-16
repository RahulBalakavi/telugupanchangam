import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Check, ChevronDown, CircleAlert, Globe2, Loader2, MapPin, Moon, Share2, ShieldCheck,
  Sparkles, Star, Sun, TriangleAlert
} from "lucide-react";
import { shareEclipseCard } from "@/lib/share-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/use-language";
import { getStoredTimezone } from "@/components/timezone-selector";
import { nakshatraNames, nakshatraNamesTelugu } from "@shared/schema";

interface EclipseNakshatraInfo { index: number; name: string; nameTelugu: string; severity: "high" | "medium"; reason: string; }
interface EclipseEvent {
  type: "solar" | "lunar"; kind: string; peakUtc: string; dateLocal: string; peakLocal: string;
  obscuration: number | null; nakshatra: { index: number; name: string; nameTelugu: string };
  affectedNakshatras: EclipseNakshatraInfo[];
}
interface LocalEclipseVisibility {
  visible: boolean; kindAtLocation: string | null; obscuration: number | null;
  beginLocal: string | null; peakLocal: string | null; endLocal: string | null;
  peakAltitude: number | null; note: string; noteTelugu: string;
}
type LocationState = { lat: number; lon: number; label: string } | null;

const CITY_PRESETS = [
  { name: "Hyderabad", nameTelugu: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
  { name: "Vijayawada", nameTelugu: "విజయవాడ", lat: 16.5062, lon: 80.648 },
  { name: "Visakhapatnam", nameTelugu: "విశాఖపట్నం", lat: 17.6868, lon: 83.2185 },
  { name: "Tirupati", nameTelugu: "తిరుపతి", lat: 13.6288, lon: 79.4192 },
  { name: "Chennai", nameTelugu: "చెన్నై", lat: 13.0827, lon: 80.2707 },
  { name: "Bengaluru", nameTelugu: "బెంగళూరు", lat: 12.9716, lon: 77.5946 },
  { name: "Mumbai", nameTelugu: "ముంబై", lat: 19.076, lon: 72.8777 },
  { name: "Delhi", nameTelugu: "ఢిల్లీ", lat: 28.6139, lon: 77.209 },
  { name: "New York", nameTelugu: "న్యూయార్క్", lat: 40.7128, lon: -74.006 },
  { name: "San Francisco", nameTelugu: "శాన్ ఫ్రాన్సిస్కో", lat: 37.7749, lon: -122.4194 },
  { name: "Dallas", nameTelugu: "డల్లాస్", lat: 32.7767, lon: -96.797 },
  { name: "Chicago", nameTelugu: "చికాగో", lat: 41.8781, lon: -87.6298 },
  { name: "London", nameTelugu: "లండన్", lat: 51.5074, lon: -0.1278 },
  { name: "Sydney", nameTelugu: "సిడ్నీ", lat: -33.8688, lon: 151.2093 },
  { name: "Singapore", nameTelugu: "సింగపూర్", lat: 1.3521, lon: 103.8198 },
  { name: "Dubai", nameTelugu: "దుబాయ్", lat: 25.2048, lon: 55.2708 },
];
const GENERAL_DOS = [
  ["గ్రహణ సమయంలో ఇష్టదైవ నామస్మరణ, జపం చేయండి — ఈ సమయంలో చేసిన జపానికి అధిక ఫలం.", "Chant your ishta devata's name or do japa during the eclipse — japa done during an eclipse is considered many times more powerful."],
  ["గ్రహణం ముగిసిన వెంటనే స్నానం చేయండి (గ్రహణ మోక్ష స్నానం).", "Take a bath immediately after the eclipse ends (grahana moksha snanam)."],
  ["గ్రహణం తర్వాత దానం చేయండి — బియ్యం, నువ్వులు, వస్త్రాలు, లేదా అన్నదానం.", "Give charity after the eclipse — rice, sesame (til), clothes, or food donation (annadanam)."],
  ["నిల్వ ఉంచే ఆహారంలో, నీటిలో దర్భ (గరిక) ఉంచండి.", "Place darbha (kusha grass) in stored food and water to protect them during the eclipse."],
  ["గ్రహణం తర్వాత ఇంటిని శుభ్రం చేసి, పూజా మందిరాన్ని ప్రోక్షణ చేయండి.", "Clean the house after the eclipse and sprinkle water (prokshana) on the puja area."],
] as const;
const GENERAL_DONTS = [
  ["గ్రహణ సమయంలో భోజనం చేయకూడదు; గ్రహణానికి ముందు (సూర్యగ్రహణానికి 12 గం., చంద్రగ్రహణానికి 9 గం. ముందు నుండి) ఆహారం తీసుకోకపోవడం సంప్రదాయం.", "Avoid eating during the eclipse; traditionally food is avoided from 12 hours before a solar eclipse and 9 hours before a lunar eclipse (children, elderly, and the unwell are exempt)."],
  ["గర్భిణులు గ్రహణ సమయంలో బయటకు వెళ్లకుండా, విశ్రాంతి తీసుకోవడం సంప్రదాయం.", "Pregnant women are traditionally advised to stay indoors and rest during the eclipse."],
  ["గ్రహణ సమయంలో నిద్రపోవడం, కొత్త పనులు ప్రారంభించడం మంచిది కాదు.", "Avoid sleeping during the eclipse and avoid starting new ventures at that time."],
  ["గ్రహణ సమయంలో దేవాలయ దర్శనం, విగ్రహ స్పర్శ చేయరు (ఆలయాలు మూసి ఉంటాయి).", "Temple darshan and touching idols are avoided during the eclipse (temples remain closed)."],
] as const;
const AFFECTED_REMEDIES = [
  ["గ్రహణ శాంతి: గ్రహణ సమయంలో మీ నక్షత్ర అధిదేవతను ప్రార్థించండి, గ్రహణ శాంతి జపం చేయించండి.", "Grahana shanti: pray to your nakshatra's presiding deity during the eclipse and consider having a grahana shanti japa performed."],
  ["సూర్యగ్రహణానికి ఆదిత్య హృదయం / సూర్య మంత్రం, చంద్రగ్రహణానికి చంద్ర మంత్రం జపించండి.", "Chant Aditya Hrudayam or a Surya mantra for a solar eclipse; a Chandra mantra for a lunar eclipse."],
  ["గ్రహణం తర్వాత నువ్వులు, బెల్లం, వస్త్రదానం చేయండి — గ్రహణ దోష నివారణకు ఇది ముఖ్య పరిహారం.", "After the eclipse, donate sesame seeds, jaggery, and clothes — this is the key remedy for grahana dosha."],
  ["గ్రహణ బింబ దానం: వెండి/బంగారు గ్రహణ బింబం లేదా తులాదానం శక్తి మేరకు చేయవచ్చు.", "Grahana bimba danam: donating a small silver/gold eclipse image (bimba) is traditionally done by those who can."],
  ["గ్రహణ మోక్షం తర్వాత శిరస్నానం చేసి, కొత్త ప్రారంభాలకు ముందు ఒక రోజు ఆగడం మంచిది.", "Take a head bath after the eclipse releases, and preferably wait a day before important new beginnings."],
] as const;

function kindLabel(kind: string, t: (te: string, en: string) => string) {
  const labels: Record<string, [string, string]> = { total: ["సంపూర్ణ", "Total"], annular: ["వలయాకార", "Annular"], partial: ["పాక్షిక", "Partial"], penumbral: ["ఛాయా", "Penumbral"] };
  return labels[kind] ? t(...labels[kind]) : kind;
}

function useVisibility(eclipse: EclipseEvent, location: LocationState, timezone: string, enabled: boolean) {
  return useQuery<LocalEclipseVisibility>({
    queryKey: ["/api/eclipses/visibility", eclipse.peakUtc, location?.lat, location?.lon, timezone],
    enabled: enabled && !!location,
    queryFn: async () => {
      const p = new URLSearchParams({ type: eclipse.type, peakUtc: eclipse.peakUtc, lat: String(location!.lat), lon: String(location!.lon), timezone });
      const response = await fetch(`/api/eclipses/visibility?${p}`);
      if (!response.ok) throw new Error("visibility");
      return response.json();
    },
  });
}

/* Mini Sun/Moon disk motif for the countdown card */
function DiskMotif({ type }: { type: "solar" | "lunar" }) {
  return (
    <svg viewBox="0 0 190 110" className="mx-auto h-24 w-44">
      <circle cx="95" cy="52" r="38" fill="none" stroke="hsl(var(--gold)/.4)" strokeDasharray="3 5" />
      {type === "lunar" ? (
        <>
          <circle cx="95" cy="52" r="25" fill="#3a1710" stroke="rgba(230,120,80,.5)" />
          <circle cx="66" cy="44" r="14" fill="#f4efdf" />
        </>
      ) : (
        <>
          <circle cx="95" cy="52" r="25" fill="url(#cd-sun)" />
          <circle cx="112" cy="44" r="18" fill="#171c2b" stroke="rgba(140,150,190,.4)" />
          <defs><radialGradient id="cd-sun"><stop stopColor="#fff2b2" /><stop offset="1" stopColor="#c96f24" /></radialGradient></defs>
        </>
      )}
    </svg>
  );
}

/* Live countdown to the next eclipse */
function CountdownCard({ eclipse, timezone }: { eclipse: EclipseEvent; timezone: string }) {
  const { language, t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(eclipse.peakUtc).getTime() - now);
  const days = Math.floor(diff / 86400_000);
  const hrs = Math.floor((diff % 86400_000) / 3600_000);
  const min = Math.floor((diff % 3600_000) / 60_000);
  const date = new Date(eclipse.peakUtc).toLocaleDateString(language === "telugu" ? "te-IN" : "en-US", { timeZone: timezone, weekday: "long", month: "long", day: "numeric" });
  const cells: Array<[string, string]> = [
    [String(days), t("రోజులు", "days")],
    [String(hrs).padStart(2, "0"), t("గంటలు", "hrs")],
    [String(min).padStart(2, "0"), t("నిమి", "min")],
  ];
  if (eclipse.obscuration != null) cells.push([`${Math.round(eclipse.obscuration * 100)}%`, t("కప్పివేత", eclipse.type === "lunar" ? "umbra" : "covered")]);
  return (
    <aside className="eclipse-hero relative overflow-hidden rounded-[1.4rem] border border-[hsl(var(--gold)/.3)] text-[hsl(0_0%_95%)] shadow-xl" data-testid="card-countdown">
      <div className="eclipse-stars pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">
        <div className="flex items-center justify-between border-b border-[hsl(var(--gold)/.25)] px-5 py-3.5">
          <span className="cel-eyebrow !text-[hsl(var(--gold))]">{t("తదుపరి గ్రహణం", "Next eclipse")}</span>
          <span className="text-xs opacity-75">{eclipse.type === "solar" ? t("సూర్య గ్రహణం", "Solar") : t("చంద్ర గ్రహణం", "Lunar")} · {kindLabel(eclipse.kind, t)}</span>
        </div>
        <div className="pt-4"><DiskMotif type={eclipse.type} /></div>
        <p className="text-center font-display text-2xl font-semibold" data-testid="text-countdown-title">
          {kindLabel(eclipse.kind, t)} {eclipse.type === "solar" ? t("సూర్యగ్రహణం", "Solar Eclipse") : t("చంద్రగ్రహణం", "Lunar Eclipse")}
        </p>
        <p className="mt-1 text-center text-sm opacity-75">{date} · {t("మధ్యకాలం", "peak")} {eclipse.peakLocal} · {language === "telugu" ? eclipse.nakshatra.nameTelugu : eclipse.nakshatra.name}</p>
        <div className="flex justify-center gap-2.5 px-4 py-5">
          {cells.map(([v, l]) => (
            <div key={l} className="min-w-[62px] rounded-xl border border-[hsl(var(--gold)/.25)] bg-white/[.03] px-2 py-2.5 text-center">
              <span className="block font-display text-2xl text-[hsl(var(--gold))]">{v}</span>
              <span className="text-[.6rem] uppercase tracking-[.18em] opacity-70">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function AlignmentDiagram({ type, t }: { type: "solar" | "lunar"; t: (te: string, en: string) => string }) {
  const solar = type === "solar";
  return (
    <div className="rounded-2xl border border-[hsl(var(--gold)/.22)] bg-[hsl(228_38%_10%)] px-3 py-4 text-[hsl(0_0%_92%)]" data-testid={`diagram-${type}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="cel-eyebrow !text-[hsl(var(--gold))]">{t("గ్రహాల అమరిక", "Celestial alignment")}</span>
        <span className="text-xs opacity-60">{solar ? t("సూర్యుడు · చంద్రుడు · భూమి", "SUN · MOON · EARTH") : t("సూర్యుడు · భూమి · చంద్రుడు", "SUN · EARTH · MOON")}</span>
      </div>
      <svg viewBox="0 0 620 158" className="h-auto w-full overflow-visible" role="img" aria-label={solar ? t("సూర్యగ్రహణంలో సూర్యుడు, చంద్రుడు, భూమి వరుసలో ఉంటాయి", "Sun, Moon, Earth aligned for a solar eclipse") : t("చంద్రగ్రహణంలో సూర్యుడు, భూమి, చంద్రుడు వరుసలో ఉంటాయి", "Sun, Earth, Moon aligned for a lunar eclipse")}>
        <defs>
          <radialGradient id={`sun-${type}`}><stop stopColor="#fff2b2" /><stop offset=".42" stopColor="#e8a543" /><stop offset="1" stopColor="#b65d20" /></radialGradient>
          <radialGradient id={`earth-${type}`}><stop stopColor="#88c4c9" /><stop offset="1" stopColor="#244e68" /></radialGradient>
          <filter id={`glow-${type}`}><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        <path d="M48 79 H572" stroke="hsl(39 70% 69% / .28)" strokeDasharray="3 9" />
        <circle cx="82" cy="79" r="32" fill={`url(#sun-${type})`} className="eclipse-pulse" />
        <circle cx="82" cy="79" r="45" fill="none" stroke="#e8a543" opacity=".18" filter={`url(#glow-${type})`} />
        <circle cx={solar ? 310 : 360} cy="79" r={solar ? 20 : 34} fill={solar ? "#232b3c" : `url(#earth-${type})`} className="eclipse-orbit" />
        {solar ? <circle cx="538" cy="79" r="37" fill={`url(#earth-${type})`} /> : <circle cx="538" cy="79" r="20" fill="#232b3c" className="eclipse-orbit" />}
        <text x="82" y="142" fill="#d8cca6" textAnchor="middle" fontSize="19">{t("సూర్యుడు", "Sun")}</text>
        <text x={solar ? "310" : "360"} y="142" fill="#d8cca6" textAnchor="middle" fontSize="19">{solar ? t("చంద్రుడు", "Moon") : t("భూమి", "Earth")}</text>
        <text x="538" y="142" fill="#d8cca6" textAnchor="middle" fontSize="19">{solar ? t("భూమి", "Earth") : t("చంద్రుడు", "Moon")}</text>
        <path d={solar ? "M334 79 Q410 52 488 79" : "M400 79 Q455 116 505 79"} fill="none" stroke="#d8a85b" strokeDasharray="4 5" opacity=".65" />
      </svg>
      <p className="mt-1 text-center text-xs opacity-60">{solar ? t("చంద్రుడు సూర్యుడు మరియు భూమి మధ్యకు వస్తాడు", "The Moon passes between the Sun and Earth") : t("భూమి నీడలో చంద్రుడు ప్రయాణిస్తాడు", "The Moon travels through Earth's shadow")}</p>
    </div>
  );
}

function VisibilityGlobe({ location, visibility, t }: { location: { lat: number; lon: number; label: string }; visibility?: LocalEclipseVisibility; t: (te: string, en: string) => string }) {
  const x = 110 + (location.lon / 180) * 86;
  const y = 75 - Math.sin((location.lat * Math.PI) / 180) * 48;
  const visible = visibility?.visible;
  return (
    <div className="rounded-2xl border bg-[hsl(var(--secondary)/.3)] p-4" data-testid="globe-visibility">
      <div className="mb-2 flex items-center gap-2"><Globe2 className="h-4 w-4 text-[hsl(var(--gold-deep))]" /><span className="text-sm font-semibold">{t("మీ ఆకాశం", "Your sky")}</span></div>
      <svg viewBox="0 0 220 150" className="mx-auto h-32 w-full max-w-[260px]" aria-label={t("మీ ప్రాంతంలో గ్రహణం కనిపించే దృశ్యం", "Visibility from your location")}>
        <defs><radialGradient id="globe-fill"><stop stopColor="#567b87" /><stop offset="1" stopColor="#24384c" /></radialGradient></defs>
        <ellipse cx="110" cy="75" rx="88" ry="58" fill="url(#globe-fill)" stroke="hsl(var(--gold)/.5)" />
        <path d="M28 75h164M40 48q70 30 140 0M40 102q70-30 140 0M110 17q-34 58 0 116M110 17q34 58 0 116" fill="none" stroke="hsl(var(--foreground)/.18)" />
        {visibility && <path d={visible ? "M26 75 A88 58 0 0 0 112 133 A88 58 0 0 0 26 75" : "M26 75 A88 58 0 0 1 112 17 A88 58 0 0 1 26 75"} fill={visible ? "hsl(39 70% 69% / .13)" : "hsl(228 39% 7% / .42)"} />}
        <circle cx={Math.max(30, Math.min(190, x))} cy={y} r="5" fill={visible ? "#e8b85f" : "#a6a19a"} stroke="hsl(var(--background))" strokeWidth="2" />
      </svg>
      <div className={`mt-1 text-center text-sm font-semibold ${visible ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
        {visibility ? (visible ? t("ఇక్కడ కనిపిస్తుంది", "Visible here") : t("ఇక్కడ కనిపించదు", "Not visible here")) : t("వివరాలు పరిశీలిస్తోంది", "Checking your horizon")}
      </div>
      {visibility?.peakAltitude != null && <p className="mt-1 text-center text-xs text-muted-foreground">{t("గరిష్ఠ ఎత్తు", "Peak altitude")} {visibility.peakAltitude.toFixed(1)}°</p>}
    </div>
  );
}

/* One row on the eclipse timeline rail; expands into the full dossier. */
function EclipseRow({ eclipse, location, timezone, userNakshatra, featured = false, past = false }: {
  eclipse: EclipseEvent; location: LocationState; timezone: string; userNakshatra: number | null; featured?: boolean; past?: boolean;
}) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(featured);
  const [shareState, setShareState] = useState<"idle" | "busy" | "done">("idle");
  const { data: visibility, isLoading: loadingVisibility, isError: visibilityError } = useVisibility(eclipse, location, timezone, open);

  const share = async () => {
    if (shareState === "busy") return;
    setShareState("busy");
    try {
      const te = language === "telugu";
      await shareEclipseCard(
        {
          type: eclipse.type,
          kindLabel: kindLabel(eclipse.kind, t),
          title: `${kindLabel(eclipse.kind, t)} ${eclipse.type === "solar" ? t("సూర్యగ్రహణం", "Solar Eclipse") : t("చంద్రగ్రహణం", "Lunar Eclipse")}`,
          dateLabel: new Date(eclipse.peakUtc).toLocaleDateString(te ? "te-IN" : "en-US", { timeZone: timezone, weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          date: eclipse.dateLocal,
          peakLocal: eclipse.peakLocal,
          obscuration: eclipse.obscuration,
          nakshatra: te ? eclipse.nakshatra.nameTelugu : eclipse.nakshatra.name,
          affectedNakshatras: eclipse.affectedNakshatras.map((n) => (te ? n.nameTelugu : n.name)),
          timezone,
        },
        te ? "telugu" : "english",
      );
      setShareState("done");
      setTimeout(() => setShareState("idle"), 2500);
    } catch {
      setShareState("idle");
    }
  };
  const affected = userNakshatra !== null ? eclipse.affectedNakshatras.find((n) => n.index === userNakshatra) : undefined;
  const peak = new Date(eclipse.peakUtc);
  const locale = language === "telugu" ? "te-IN" : "en-US";
  const dateShort = peak.toLocaleDateString(locale, { timeZone: timezone, month: "short", day: "numeric" });
  const dateSub = peak.toLocaleDateString(locale, { timeZone: timezone, year: "numeric", weekday: "long" });
  return (
    <article className={`relative rounded-2xl border transition-colors ${featured ? "border-[hsl(var(--gold)/.55)] bg-[hsl(var(--gold)/.08)]" : past ? "border-border/70 bg-card/40 opacity-90" : "border-[hsl(var(--gold)/.22)] bg-card/60 hover:bg-[hsl(var(--gold)/.05)]"}`} data-testid={`row-eclipse-${eclipse.dateLocal}-${eclipse.type}`}>
      {/* rail node */}
      <span className={`absolute -left-[26px] top-7 hidden h-[11px] w-[11px] rounded-full border-2 sm:block ${past ? "border-muted-foreground/50 bg-background" : "border-[hsl(var(--gold))] bg-background"}`} aria-hidden />
      <button className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-left sm:px-5" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid={`button-expand-${eclipse.dateLocal}-${eclipse.type}`}>
        <div className="w-24 shrink-0">
          <span className={`block font-display text-xl font-semibold ${past ? "text-muted-foreground" : "text-[hsl(var(--gold-deep))] dark:text-[hsl(var(--gold))]"}`}>{dateShort}</span>
          <span className="text-xs text-muted-foreground">{dateSub}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${eclipse.type === "solar" ? "border-orange-400/40 bg-orange-400/15" : "border-indigo-300/40 bg-indigo-400/15"}`}>
              {eclipse.type === "solar" ? <Sun className="h-3.5 w-3.5 text-orange-500 dark:text-orange-300" /> : <Moon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-200" />}
            </span>
            <span className="sm:truncate">{kindLabel(eclipse.kind, t)} {eclipse.type === "solar" ? t("సూర్యగ్రహణం", "solar eclipse") : t("చంద్రగ్రహణం", "lunar eclipse")}</span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t("మధ్యకాలం", "Peak")} <strong className="font-medium text-foreground/80">{eclipse.peakLocal}</strong>
            {" · "}{language === "telugu" ? eclipse.nakshatra.nameTelugu : eclipse.nakshatra.name}
            {eclipse.obscuration != null && <> · {(eclipse.obscuration * 100).toFixed(0)}%</>}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {past && <Badge variant="outline" className="text-muted-foreground">{t("గడిచింది", "Past")}</Badge>}
          {affected && <Badge className="border-red-300/40 bg-red-500/15 text-red-700 dark:text-red-200" data-testid={`badge-affected-${eclipse.dateLocal}`}><Star className="mr-1 h-3 w-3" />{t("మీ నక్షత్రం", "Your star")}</Badge>}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-[hsl(var(--gold)/.18)] px-4 pb-5 pt-4 sm:px-5">
          <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
            <div className="space-y-4">
              <AlignmentDiagram type={eclipse.type} t={t} />
              <Link href={`/sky?t=${encodeURIComponent(eclipse.peakUtc)}`}>
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[hsl(var(--gold)/.35)] bg-[hsl(var(--gold)/.08)] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--gold-deep))] hover:bg-[hsl(var(--gold)/.15)] dark:text-[hsl(var(--gold))]" data-testid={`link-sky-${eclipse.dateLocal}-${eclipse.type}`}>
                  🪐 {t("ఈ గ్రహణాన్ని 3D నమూనాలో చూడండి", "Watch this eclipse in the 3D model")}
                  <span aria-hidden>→</span>
                </span>
              </Link>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.2)] p-3"><span className="block text-xs opacity-60">{t("గ్రహణ మధ్యకాలం", "Peak local time")}</span><strong>{eclipse.peakLocal}</strong></div>
                <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.2)] p-3"><span className="block text-xs opacity-60">{t("గ్రహణ నక్షత్రం", "Eclipse nakshatra")}</span><strong>{language === "telugu" ? eclipse.nakshatra.nameTelugu : eclipse.nakshatra.name}</strong></div>
                <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.2)] p-3"><span className="block text-xs opacity-60">{t("కప్పివేత", "Obscuration")}</span><strong>{eclipse.obscuration != null ? `${(eclipse.obscuration * 100).toFixed(1)}%` : t("తెలియదు", "—")}</strong></div>
              </div>
            </div>
            {location ? (
              <div className="space-y-3">
                <VisibilityGlobe location={location} visibility={visibility} t={t} />
                <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.18)] p-3 text-sm">
                  {loadingVisibility ? <span className="flex items-center gap-2 opacity-70"><Loader2 className="h-4 w-4 animate-spin" />{t("పరిశీలిస్తోంది...", "Checking visibility...")}</span>
                    : visibilityError ? <span className="text-destructive">{t("వివరాలు లభించలేదు", "Could not check visibility")}</span>
                    : visibility && <>
                        {visibility.visible ? (
                          <p className="font-medium">
                            {visibility.kindAtLocation && <span className="mr-2 rounded bg-[hsl(var(--gold)/.18)] px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide">{kindLabel(visibility.kindAtLocation, t)}</span>}
                            {visibility.beginLocal && `${t("ప్రారంభం", "Begins")} ${visibility.beginLocal} · `}{t("మధ్యకాలం", "Peak")} {visibility.peakLocal}{visibility.endLocal && ` · ${t("ముగింపు", "Ends")} ${visibility.endLocal}`}
                          </p>
                        ) : <p className="font-medium text-muted-foreground">{past ? t("మీ ప్రాంతంలో కనిపించలేదు", "Was not visible from your location") : t("మీ ప్రాంతంలో కనిపించదు", "Not visible from your location")}</p>}
                        <p className="mt-1 text-xs opacity-70">{language === "telugu" ? visibility.noteTelugu : visibility.note}</p>
                      </>}
                </div>
              </div>
            ) : (
              <div className="grid place-items-center rounded-2xl border border-dashed border-[hsl(var(--gold)/.3)] p-6 text-center">
                <MapPin className="mb-3 h-6 w-6 text-[hsl(var(--gold))]" />
                <p className="text-sm font-medium">{t("మీ ప్రాంతాన్ని సెట్ చేయండి", "Set your location")}</p>
                <p className="mt-1 text-xs opacity-65">{t("మీ ఆకాశంలో గ్రహణం ఎలా కనిపిస్తుందో చూపిస్తాం.", "We will show how the eclipse appears in your sky.")}</p>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[.18em] opacity-60">{t("ప్రభావిత నక్షత్రాలు", "Affected nakshatras")}</p>
              <div className="flex flex-wrap gap-1.5">{eclipse.affectedNakshatras.map((n) => <Badge key={n.index} variant={n.severity === "high" ? "default" : "secondary"} data-testid={`badge-nakshatra-${n.index}`}>{language === "telugu" ? n.nameTelugu : n.name}{n.severity === "high" && " · " + t("ప్రధానం", "key")}</Badge>)}</div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={share} disabled={shareState === "busy"} data-testid={`button-share-eclipse-${eclipse.dateLocal}`}>
              {shareState === "busy" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : shareState === "done" ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Share2 className="mr-1.5 h-4 w-4" />}
              {shareState === "done" ? t("సిద్ధం!", "Done!") : t("షేర్ చేయండి", "Share")}
            </Button>
          </div>
          {affected && !past && (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm" data-testid={`remedies-${eclipse.dateLocal}`}>
              <p className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />{t(`మీ జన్మ నక్షత్రం (${nakshatraNamesTelugu[userNakshatra!]}) ప్రభావితం — పరిహారాలు:`, `Your birth star (${nakshatraNames[userNakshatra!]}) is affected — remedies:`)}</p>
              <ul className="list-disc space-y-1 pl-5">{AFFECTED_REMEDIES.map((r, i) => <li key={i}>{t(r[0], r[1])}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* Parchment "almanac page" for ritual guidance */
function Guidance({ userAffected }: { userAffected: boolean }) {
  const { t } = useLanguage();
  return (
    <section id="guidance" className="relative scroll-mt-24 overflow-hidden rounded-[1.5rem] p-6 shadow-lg md:p-9" style={{ background: "linear-gradient(160deg,#f6eed9,#efe3c4)", color: "#33270f" }} data-testid="card-general-guidance">
      <div className="pointer-events-none absolute inset-2.5 rounded-2xl border border-[rgba(120,90,30,.25)]" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="cel-eyebrow" style={{ color: "#8a6420" }}>{t("ఆచారం మరియు శ్రద్ధ", "Ritual & care")}</p>
            <h2 className="mt-1 font-telugu text-2xl font-semibold md:text-3xl">{t("గ్రహణ సమయంలో పాటించవలసినవి", "What to do during an eclipse")}</h2>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "#5d4a22" }}>{t("ఇది ముందే కనిపించేలా ఉంచిన సంప్రదాయ మార్గదర్శిని. గ్రహణం మీ ప్రాంతంలో కనిపించినప్పుడు మాత్రమే వర్తిస్తుంది.", "A practical traditional guide. These observances apply where the eclipse is visible.")}</p>
          </div>
          <Badge variant="outline" className="gap-1.5 border-[rgba(120,90,30,.4)] text-[#6b5426]"><Sparkles className="h-3.5 w-3.5" />{userAffected ? t("మీ కోసం పరిహారాలు సిద్ధం", "Personal remedies included") : t("కుటుంబ మార్గదర్శిని", "For the household")}</Badge>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 flex items-center gap-2 font-display font-semibold text-[#3d7a4f]"><Check className="h-4 w-4" />{t("చేయవలసినవి", "Do's")}</p>
            <ul className="space-y-3">{GENERAL_DOS.map((d, i) => <li key={i} className="flex gap-3 text-sm leading-6" style={{ color: "#4c3c1c" }}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3d7a4f]" />{t(d[0], d[1])}</li>)}</ul>
          </div>
          <div>
            <p className="mb-3 flex items-center gap-2 font-display font-semibold text-[#a33d2f]"><TriangleAlert className="h-4 w-4" />{t("చేయకూడనివి", "Don'ts")}</p>
            <ul className="space-y-3">{GENERAL_DONTS.map((d, i) => <li key={i} className="flex gap-3 text-sm leading-6" style={{ color: "#4c3c1c" }}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a33d2f]" />{t(d[0], d[1])}</li>)}</ul>
          </div>
        </div>
        <p className="mt-6 border-t border-[rgba(120,90,30,.25)] pt-4 text-xs" style={{ color: "#7a6335" }}>{t("గమనిక: ఇవి సాంప్రదాయ సూచనలు మాత్రమే. వ్యక్తిగత శాంతి పరిహారాల కోసం మీ పురోహితుడిని సంప్రదించండి.", "Note: These are traditional guidelines. For personalized shanti remedies, please consult your purohit.")}</p>
      </div>
    </section>
  );
}

function SectionHead({ title, aside, id }: { title: string; aside?: string; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-24 items-baseline justify-between gap-4 border-b border-[hsl(var(--gold)/.25)] pb-3">
      <h2 className="font-display text-2xl font-semibold md:text-3xl">{title}</h2>
      {aside && <span className="shrink-0 font-display text-sm text-[hsl(var(--gold-deep))] dark:text-[hsl(var(--gold))]">{aside}</span>}
    </div>
  );
}

export default function EclipsesPage() {
  const { language, t } = useLanguage();
  const [timezone] = useState(getStoredTimezone());
  const [location, setLocation] = useState<LocationState>(null);
  const [manualLat, setManualLat] = useState(""); const [manualLon, setManualLon] = useState("");
  const [showCoords, setShowCoords] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false); const [geoError, setGeoError] = useState<string | null>(null);
  const [range, setRange] = useState<"upcoming" | "past">("upcoming");
  const [userNakshatra, setUserNakshatra] = useState<number | null>(() => { const s = localStorage.getItem("panchangam-janma-nakshatra"); return s ? parseInt(s, 10) : null; });
  useEffect(() => { if (userNakshatra !== null) localStorage.setItem("panchangam-janma-nakshatra", String(userNakshatra)); }, [userNakshatra]);
  const { data, isLoading, isError, refetch } = useQuery<{ eclipses: EclipseEvent[]; past?: EclipseEvent[] }>({ queryKey: ["/api/eclipses", timezone], queryFn: async () => { const r = await fetch(`/api/eclipses?timezone=${encodeURIComponent(timezone)}`); if (!r.ok) throw new Error("eclipses"); return r.json(); } });
  const eclipses = data?.eclipses ?? [];
  const pastEclipses = data?.past ?? [];
  const first = eclipses[0];
  const shown = range === "upcoming" ? eclipses : pastEclipses;
  const useMyLocation = () => { setGeoError(null); if (!navigator.geolocation) { setGeoError(t("మీ బ్రౌజర్ లొకేషన్‌ను సపోర్ట్ చేయదు", "Your browser does not support geolocation")); return; } setGeoLoading(true); navigator.geolocation.getCurrentPosition((p) => { setGeoLoading(false); setLocation({ lat: p.coords.latitude, lon: p.coords.longitude, label: t("మీ ప్రస్తుత ప్రాంతం", "Your current location") }); }, () => { setGeoLoading(false); setGeoError(t("లొకేషన్ పొందలేకపోయాం — దయచేసి నగరాన్ని ఎంచుకోండి", "Could not get your location — please pick a city instead")); }, { timeout: 10000 }); };
  const applyManualCoords = () => { const lat = parseFloat(manualLat), lon = parseFloat(manualLon); if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) { setGeoError(t("సరైన అక్షాంశ/రేఖాంశాలు ఇవ్వండి", "Please enter valid latitude/longitude")); return; } setGeoError(null); setLocation({ lat, lon, label: `${lat.toFixed(3)}, ${lon.toFixed(3)}` }); };
  const affected = useMemo(() => userNakshatra !== null && eclipses.some((e) => e.affectedNakshatras.some((n) => n.index === userNakshatra)), [eclipses, userNakshatra]);
  return <div className="min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--gold)/.2)] bg-background/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-7"><Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" data-testid="button-back-home"><ArrowLeft className="h-4 w-4" /></Link><div className="flex flex-1 items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full border border-[hsl(var(--gold)/.5)] bg-[hsl(var(--gold)/.1)]"><Sun className="h-4 w-4 text-[hsl(var(--saffron))]" /></div><div><p className="font-telugu text-lg font-semibold leading-none">{t("తెలుగు పంచాంగం", "Telugu Panchangam")}</p><p className="cel-eyebrow mt-1 text-[.55rem]">{t("ఆకాశపు అల్మనాక్", "Celestial almanac")}</p></div></div><Badge variant="outline" className="hidden gap-1.5 sm:flex"><CircleAlert className="h-3 w-3" />{t("గ్రహణ గమనిక", "Eclipse watch")}</Badge></div></header>
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-6 md:px-7 md:py-10">

      {/* HERO — the next eclipse is the headline */}
      <section className="grid gap-7 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div>
          <p className="cel-eyebrow">{t("సూర్యుడు · చంద్రుడు · భూమి", "Sun · Moon · Earth — గ్రహణ గమనిక")}</p>
          <h1 className="cel-headline mt-3 max-w-3xl text-4xl md:text-6xl" data-testid="text-page-title">{t("ఆకాశం తన మాట నిలబెట్టుకుంటుంది", "The sky keeps its appointments")}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{t("రాబోయే ప్రతి గ్రహణం — మీ ఊరి మీద ఎప్పుడు, మీ జన్మ నక్షత్రానికి ప్రభావం ఉందా, పాటించవలసిన సంప్రదాయాలు ఏమిటి.", "Every eclipse ahead — when it peaks over your town, whether your janma nakshatra is touched, and the observances that matter.")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild data-testid="button-hero-watch"><a href="#eclipse-lab">{t("గ్రహణాన్ని చూడండి", "Watch the next eclipse")}</a></Button>
            <Button asChild variant="outline" data-testid="button-hero-guide"><a href="#guidance">{t("కుటుంబ మార్గదర్శిని", "Family guide")}</a></Button>
          </div>
        </div>
        {isLoading ? <div className="h-72 animate-pulse rounded-[1.4rem] bg-muted" /> : first ? <CountdownCard eclipse={first} timezone={timezone} /> : null}
      </section>

      {/* YOUR SKY — one compact ribbon */}
      <section className="rounded-2xl border border-[hsl(var(--gold)/.28)] bg-[hsl(var(--gold)/.05)] px-4 py-3.5 md:px-5" data-testid="card-location">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="cel-eyebrow mr-1 hidden sm:inline">{t("మీ ఆకాశం", "Your sky")}</span>
          <Button onClick={useMyLocation} disabled={geoLoading} size="sm" variant={location ? "outline" : "default"} className="rounded-full" data-testid="button-use-my-location">{geoLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <MapPin className="mr-1.5 h-4 w-4" />}{t("నా లొకేషన్", "My location")}</Button>
          <Select onValueChange={(v) => { const c = CITY_PRESETS[parseInt(v, 10)]; setGeoError(null); setLocation({ lat: c.lat, lon: c.lon, label: language === "telugu" ? c.nameTelugu : c.name }); }}>
            <SelectTrigger className="h-9 w-40 rounded-full" data-testid="select-city"><SelectValue placeholder={t("నగరం", "Pick a city")} /></SelectTrigger>
            <SelectContent>{CITY_PRESETS.map((c, i) => <SelectItem key={c.name} value={String(i)}>{language === "telugu" ? c.nameTelugu : c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => setShowCoords((s) => !s)} data-testid="button-toggle-coords">{t("అక్షాంశ/రేఖాంశం", "Lat / Lon")}</Button>
          <span className="mx-1 hidden h-5 w-px bg-[hsl(var(--gold)/.3)] sm:block" />
          <span className="cel-eyebrow mr-1 hidden sm:inline">{t("జన్మ నక్షత్రం", "Birth star")}</span>
          <Select value={userNakshatra !== null ? String(userNakshatra) : undefined} onValueChange={(v) => setUserNakshatra(parseInt(v, 10))}>
            <SelectTrigger className="h-9 w-44 rounded-full" data-testid="select-nakshatra"><SelectValue placeholder={t("నక్షత్రం ఎంచుకోండి", "Select nakshatra")} /></SelectTrigger>
            <SelectContent>{nakshatraNames.map((n, i) => <SelectItem key={n} value={String(i)}>{language === "telugu" ? nakshatraNamesTelugu[i] : n}</SelectItem>)}</SelectContent>
          </Select>
          {location && <span className="ml-auto text-sm text-muted-foreground" data-testid="text-current-location">📍 <strong className="text-foreground">{location.label}</strong></span>}
        </div>
        {showCoords && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Input placeholder={t("అక్షాంశం (Lat)", "Latitude")} value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="h-9 w-32" data-testid="input-latitude" />
            <Input placeholder={t("రేఖాంశం (Lon)", "Longitude")} value={manualLon} onChange={(e) => setManualLon(e.target.value)} className="h-9 w-32" data-testid="input-longitude" />
            <Button variant="outline" size="sm" onClick={applyManualCoords} data-testid="button-apply-coords">{t("సెట్ చేయండి", "Set")}</Button>
          </div>
        )}
        {geoError && <p className="mt-2 text-sm text-destructive">{geoError}</p>}
      </section>

      {/* ECLIPSE LAB — now the 3D orrery on /sky */}
      <section id="eclipse-lab" className="scroll-mt-24 space-y-5">
        <SectionHead title={t("గ్రహణ ప్రయోగశాల", "Eclipse Lab")} aside={t("3D ఇంటరాక్టివ్", "3D interactive")} />
        <div className="eclipse-hero relative overflow-hidden rounded-[1.4rem] border border-[hsl(var(--gold)/.3)] text-[hsl(0_0%_95%)] shadow-xl" data-testid="card-sky-cta">
          <div className="eclipse-stars pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative grid gap-6 p-6 md:grid-cols-[1.2fr_.8fr] md:items-center md:p-9">
            <div>
              <p className="cel-eyebrow !text-[hsl(var(--gold))]">{t("సూర్యుడు · భూమి · చంద్రుడు — నిజమైన కోణాలు", "Sun · Earth · Moon — real angles")}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold md:text-3xl">{t("గ్రహణాలు ఎందుకు అరుదు? 3D నమూనాలో చూడండి", "Why are eclipses rare? See it in 3D")}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 opacity-80">
                {t(
                  "కాలాన్ని లాగండి, చంద్రుని వాలిన కక్ష్యను చూడండి, రాహు–కేతు నోడ్స్ సూర్యుని వైపు తిరిగినప్పుడు గ్రహణం ఎలా ఏర్పడుతుందో గమనించండి. గ్రహణ సమయంలో ప్రభావిత నక్షత్రాలు కూడా వెలుగుతాయి.",
                  "Drag through time, watch the Moon's tilted orbit, and see an eclipse form only when the Rahu–Ketu nodes swing toward the Sun. During an eclipse, the affected nakshatras light up on the zodiac ring.",
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild data-testid="link-sky-orrery">
                  <Link href="/sky">🪐 {t("3D నమూనా తెరవండి", "Open the 3D model")}</Link>
                </Button>
                {first && (
                  <Button asChild variant="outline" className="border-[hsl(var(--gold)/.4)] bg-transparent text-inherit hover:bg-white/10" data-testid="link-sky-next-eclipse">
                    <Link href={`/sky?t=${encodeURIComponent(first.peakUtc)}`}>{t("తదుపరి గ్రహణాన్ని 3Dలో చూడండి", "Watch the next eclipse in 3D")}</Link>
                  </Button>
                )}
              </div>
            </div>
            <ul className="space-y-2.5 text-sm opacity-85">
              {[
                t("చంద్రుని 5° వాలు స్లయిడర్‌తో మార్చి చూడండి", "Slide the Moon's 5° tilt and see eclipses vanish"),
                t("27 నక్షత్రాల వలయం — గ్రహణ నక్షత్రం ఎరుపులో", "The 27-nakshatra ring — the eclipse star glows red"),
                t("జన్మ, అనుజన్మ, త్రిజన్మ నక్షత్రాలు ఎందుకు ప్రభావితమో వివరణ", "Why janma, anujanma & trijanma stars are affected"),
                t("టైమ్‌లైన్‌పై నిజమైన గ్రహణ తేదీల గుర్తులు", "Real eclipse dates marked on the timeline"),
              ].map((line, i) => (
                <li key={i} className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--gold))]" />{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TIMELINE — upcoming & past */}
      <section className="space-y-5">
        <SectionHead id="timeline" title={t("ఆకాశంలో మార్పులు", "The changes in the sky")} aside={`${shown.length} ${t("గ్రహణాలు", "eclipses")}`} />
        <div className="flex rounded-full border border-[hsl(var(--gold)/.3)] bg-[hsl(var(--background))] p-1" role="tablist" style={{ width: "fit-content" }}>
          <button role="tab" aria-selected={range === "upcoming"} onClick={() => setRange("upcoming")} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${range === "upcoming" ? "bg-[hsl(var(--gold)/.9)] text-[hsl(228_40%_12%)]" : "text-muted-foreground hover:text-foreground"}`} data-testid="tab-upcoming">{t("రాబోయేవి", "Upcoming")}</button>
          <button role="tab" aria-selected={range === "past"} onClick={() => setRange("past")} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${range === "past" ? "bg-[hsl(var(--gold)/.9)] text-[hsl(228_40%_12%)]" : "text-muted-foreground hover:text-foreground"}`} data-testid="tab-past">{t("గత సంవత్సరం", "Past year")}</button>
        </div>
        {isLoading ? <div className="space-y-4"><div className="h-40 animate-pulse rounded-2xl bg-muted" /><div className="h-20 animate-pulse rounded-2xl bg-muted" /></div>
          : isError ? <Card className="border-destructive/40"><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><CircleAlert className="h-8 w-8 text-destructive" /><p className="font-medium">{t("గ్రహణ వివరాలు అందుబాటులో లేవు", "Eclipse details are unavailable right now")}</p><Button variant="outline" onClick={() => refetch()}>{t("మళ్లీ ప్రయత్నించండి", "Try again")}</Button></CardContent></Card>
          : shown.length ? (
            <div className="relative space-y-3.5 sm:pl-8 sm:before:absolute sm:before:bottom-2 sm:before:left-[13px] sm:before:top-2 sm:before:w-px sm:before:bg-gradient-to-b sm:before:from-[hsl(var(--gold))] sm:before:to-[hsl(var(--gold)/.08)]" data-testid={`rail-${range}`}>
              {shown.map((e, i) => (
                <EclipseRow key={`${e.peakUtc}-${e.type}`} eclipse={e} location={location} timezone={timezone} userNakshatra={userNakshatra}
                  featured={range === "upcoming" && i === 0} past={range === "past"} />
              ))}
            </div>
          ) : <Card><CardContent className="py-12 text-center text-muted-foreground">{range === "upcoming" ? t("రాబోయే గ్రహణాలు లేవు", "No upcoming eclipses found") : t("గత సంవత్సరంలో గ్రహణాలు లేవు", "No eclipses in the past year")}</CardContent></Card>}
      </section>

      <Guidance userAffected={!!affected} />

      <div className="flex items-center justify-center gap-2 pt-3 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--gold-deep))]" />{t("సంప్రదాయం, ఖగోళ విజ్ఞానం, మీ స్థానిక ఆకాశం — ఒకే చోట.", "Tradition, astronomy, and your local sky — together.")}</div>
    </main>
  </div>;
}
