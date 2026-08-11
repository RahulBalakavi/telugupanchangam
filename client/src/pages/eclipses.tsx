import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Check, CircleAlert, Globe2, Loader2, MapPin, Moon, ShieldCheck,
  Sparkles, Star, Sun, TriangleAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function AlignmentDiagram({ type, t }: { type: "solar" | "lunar"; t: (te: string, en: string) => string }) {
  const solar = type === "solar";
  return (
    <div className="rounded-2xl border border-[hsl(var(--gold)/.22)] bg-[hsl(228_38%_10%)] px-3 py-4 text-[hsl(var(--foreground))]" data-testid={`diagram-${type}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="cel-eyebrow !text-[hsl(var(--gold))]">{t("గ్రహాల అమరిక", "Celestial alignment")}</span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{solar ? t("సూర్యుడు · చంద్రుడు · భూమి", "SUN · MOON · EARTH") : t("సూర్యుడు · భూమి · చంద్రుడు", "SUN · EARTH · MOON")}</span>
      </div>
      <svg viewBox="0 0 620 158" className="h-auto w-full overflow-visible" role="img" aria-label={solar ? t("సూర్యగ్రహణంలో సూర్యుడు, చంద్రుడు, భూమి వరుసలో ఉంటాయి", "Sun, Moon, Earth aligned for a solar eclipse") : t("చంద్రగ్రహణంలో సూర్యుడు, భూమి, చంద్రుడు వరుసలో ఉంటాయి", "Sun, Earth, Moon aligned for a lunar eclipse")}>
        <defs>
          <radialGradient id={`sun-${type}`}><stop stopColor="#fff2b2" /><stop offset=".42" stopColor="#e8a543" /><stop offset="1" stopColor="#b65d20" /></radialGradient>
          <radialGradient id={`earth-${type}`}><stop stopColor="#88c4c9" /><stop offset="1" stopColor="#244e68" /></radialGradient>
          <filter id={`glow-${type}`}><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        <path d="M48 79 H572" stroke="hsl(39 70% 69% / .28)" strokeDasharray="3 9" />
        <circle cx={solar ? 82 : 82} cy="79" r="32" fill={`url(#sun-${type})`} className="eclipse-pulse" />
        <circle cx={solar ? 82 : 82} cy="79" r="45" fill="none" stroke="#e8a543" opacity=".18" filter={`url(#glow-${type})`} />
        <circle cx={solar ? 310 : 360} cy="79" r={solar ? 20 : 34} fill={solar ? "#232b3c" : `url(#earth-${type})`} className="eclipse-orbit" />
        {solar ? <circle cx="538" cy="79" r="37" fill={`url(#earth-${type})`} /> : <circle cx="538" cy="79" r="20" fill="#232b3c" className="eclipse-orbit" />}
        <text x="82" y="142" fill="#d8cca6" textAnchor="middle" fontSize="19">{t("సూర్యుడు", "Sun")}</text>
        <text x={solar ? "310" : "360"} y="142" fill="#d8cca6" textAnchor="middle" fontSize="19">{solar ? t("చంద్రుడు", "Moon") : t("భూమి", "Earth")}</text>
        <text x="538" y="142" fill="#d8cca6" textAnchor="middle" fontSize="19">{solar ? t("భూమి", "Earth") : t("చంద్రుడు", "Moon")}</text>
        <path d={solar ? "M334 79 Q410 52 488 79" : "M400 79 Q455 116 505 79"} fill="none" stroke="#d8a85b" strokeDasharray="4 5" opacity=".65" />
      </svg>
      <p className="mt-1 text-center text-xs text-[hsl(var(--muted-foreground))]">{solar ? t("చంద్రుడు సూర్యుడు మరియు భూమి మధ్యకు వస్తాడు", "The Moon passes between the Sun and Earth") : t("భూమి నీడలో చంద్రుడు ప్రయాణిస్తాడు", "The Moon travels through Earth's shadow")}</p>
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

function EclipseCard({ eclipse, location, timezone, userNakshatra, featured = false }: { eclipse: EclipseEvent; location: { lat: number; lon: number; label: string } | null; timezone: string; userNakshatra: number | null; featured?: boolean }) {
  const { language, t } = useLanguage();
  const { data: visibility, isLoading: loadingVisibility, isError: visibilityError } = useQuery<LocalEclipseVisibility>({
    queryKey: ["/api/eclipses/visibility", eclipse.peakUtc, location?.lat, location?.lon, timezone],
    enabled: !!location,
    queryFn: async () => {
      const p = new URLSearchParams({ type: eclipse.type, peakUtc: eclipse.peakUtc, lat: String(location!.lat), lon: String(location!.lon), timezone });
      const response = await fetch(`/api/eclipses/visibility?${p}`);
      if (!response.ok) throw new Error("visibility");
      return response.json();
    },
  });
  const affected = userNakshatra !== null ? eclipse.affectedNakshatras.find((n) => n.index === userNakshatra) : undefined;
  const date = new Date(eclipse.peakUtc).toLocaleDateString(language === "telugu" ? "te-IN" : "en-US", { timeZone: timezone, weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <article className={`${featured ? "eclipse-hero text-[hsl(var(--foreground))]" : "border bg-card"} relative overflow-hidden rounded-[1.5rem] p-5 shadow-lg md:p-7`} data-testid={`card-eclipse-${eclipse.dateLocal}-${eclipse.type}`}>
      {featured && <div className="eclipse-stars pointer-events-none absolute inset-0 opacity-70" />}
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-full border ${eclipse.type === "solar" ? "border-orange-300/40 bg-orange-400/15" : "border-indigo-300/40 bg-indigo-400/15"}`}>{eclipse.type === "solar" ? <Sun className="h-6 w-6 text-orange-300" /> : <Moon className="h-6 w-6 text-indigo-200" />}</div>
            <div><p className="cel-eyebrow !text-[hsl(var(--gold))]">{eclipse.type === "solar" ? t("సూర్య గ్రహణం", "Solar eclipse") : t("చంద్ర గ్రహణం", "Lunar eclipse")}</p><h2 className="font-display text-2xl font-semibold">{kindLabel(eclipse.kind, t)}</h2><p className="text-sm opacity-70">{date}</p></div>
          </div>
          {affected && <Badge className="border-red-300/40 bg-red-500/15 text-red-700 dark:text-red-200" data-testid={`badge-affected-${eclipse.dateLocal}`}><Star className="mr-1 h-3 w-3" />{t("మీ నక్షత్రం ప్రభావితం", "Your star affected")}</Badge>}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-4">
            <AlignmentDiagram type={eclipse.type} t={t} />
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.2)] p-3"><span className="block text-xs opacity-60">{t("గ్రహణ మధ్యకాలం", "Peak local time")}</span><strong>{eclipse.peakLocal}</strong></div>
              <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.2)] p-3"><span className="block text-xs opacity-60">{t("గ్రహణ నక్షత్రం", "Eclipse nakshatra")}</span><strong>{language === "telugu" ? eclipse.nakshatra.nameTelugu : eclipse.nakshatra.name}</strong></div>
              <div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.2)] p-3"><span className="block text-xs opacity-60">{t("కప్పివేత", "Obscuration")}</span><strong>{eclipse.obscuration != null ? `${(eclipse.obscuration * 100).toFixed(1)}%` : t("తెలియదు", "—")}</strong></div>
            </div>
          </div>
          {location ? <div className="space-y-3"><VisibilityGlobe location={location} visibility={visibility} t={t} /><div className="rounded-xl border border-[hsl(var(--gold)/.2)] bg-[hsl(var(--background)/.18)] p-3 text-sm">{loadingVisibility ? <span className="flex items-center gap-2 opacity-70"><Loader2 className="h-4 w-4 animate-spin" />{t("పరిశీలిస్తోంది...", "Checking visibility...")}</span> : visibilityError ? <span className="text-red-300">{t("వివరాలు లభించలేదు", "Could not check visibility")}</span> : visibility && <>{visibility.visible ? <p className="font-medium">{visibility.kindAtLocation && <span className="mr-2 rounded bg-[hsl(var(--gold)/.18)] px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide">{kindLabel(visibility.kindAtLocation, t)}</span>}{visibility.beginLocal && `${t("ప్రారంభం", "Begins")} ${visibility.beginLocal} · `}{t("మధ్యకాలం", "Peak")} {visibility.peakLocal}{visibility.endLocal && ` · ${t("ముగింపు", "Ends")} ${visibility.endLocal}`}</p> : <p className="font-medium text-[hsl(var(--muted-foreground))]">{t("మీ ప్రాంతంలో కనిపించదు", "Not visible from your location")}</p>}<p className="mt-1 text-xs opacity-70">{language === "telugu" ? visibility.noteTelugu : visibility.note}</p></>}</div></div> : <div className="grid place-items-center rounded-2xl border border-dashed border-[hsl(var(--gold)/.3)] p-6 text-center"><MapPin className="mb-3 h-6 w-6 text-[hsl(var(--gold))]" /><p className="text-sm font-medium">{t("మీ ప్రాంతాన్ని సెట్ చేయండి", "Set your location")}</p><p className="mt-1 text-xs opacity-65">{t("మీ ఆకాశంలో గ్రహణం ఎలా కనిపిస్తుందో చూపిస్తాం.", "We will show how the eclipse appears in your sky.")}</p></div>}
        </div>
        <div className="mt-5"><p className="mb-2 text-xs uppercase tracking-[.18em] opacity-60">{t("ప్రభావిత నక్షత్రాలు", "Affected nakshatras")}</p><div className="flex flex-wrap gap-1.5">{eclipse.affectedNakshatras.map((n) => <Badge key={n.index} variant={n.severity === "high" ? "default" : "secondary"} data-testid={`badge-nakshatra-${n.index}`}>{language === "telugu" ? n.nameTelugu : n.name}{n.severity === "high" && " · " + t("ప్రధానం", "key")}</Badge>)}</div></div>
        {affected && <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm" data-testid={`remedies-${eclipse.dateLocal}`}><p className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />{t(`మీ జన్మ నక్షత్రం (${nakshatraNamesTelugu[userNakshatra!]}) ప్రభావితం — పరిహారాలు:`, `Your birth star (${nakshatraNames[userNakshatra!]}) is affected — remedies:`)}</p><ul className="list-disc space-y-1 pl-5">{AFFECTED_REMEDIES.map((r, i) => <li key={i}>{t(r[0], r[1])}</li>)}</ul></div>}
      </div>
    </article>
  );
}

function Guidance({ userAffected }: { userAffected: boolean }) {
  const { t } = useLanguage();
  return <section id="guidance" className="scroll-mt-24 rounded-[1.5rem] border border-[hsl(var(--gold)/.35)] bg-[hsl(var(--gold)/.07)] p-5 shadow-md md:p-7" data-testid="card-general-guidance">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="cel-eyebrow">{t("ఆచారం మరియు శ్రద్ధ", "Ritual & care")}</p><h2 className="mt-1 font-display text-2xl font-semibold">{t("గ్రహణ సమయంలో పాటించవలసినవి", "What to do during an eclipse")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("ఇది ఇప్పుడు ముందే కనిపించేలా ఉంచిన సంప్రదాయ మార్గదర్శిని. గ్రహణం మీ ప్రాంతంలో కనిపించినప్పుడు మాత్రమే వర్తిస్తుంది.", "A practical traditional guide, placed here before the eclipse list ends. These observances apply where the eclipse is visible.")}</p></div><Badge variant="outline" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />{userAffected ? t("మీ కోసం పరిహారాలు సిద్ధంగా ఉన్నాయి", "Personal remedies included") : t("కుటుంబ మార్గదర్శిని", "For the household")}</Badge></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><div><p className="mb-3 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400"><Check className="h-4 w-4" />{t("చేయవలసినవి", "Do's")}</p><ul className="space-y-3">{GENERAL_DOS.map((d, i) => <li key={i} className="flex gap-3 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600/70" />{t(d[0], d[1])}</li>)}</ul></div><div><p className="mb-3 flex items-center gap-2 font-semibold text-red-700 dark:text-red-400"><TriangleAlert className="h-4 w-4" />{t("చేయకూడనివి", "Don'ts")}</p><ul className="space-y-3">{GENERAL_DONTS.map((d, i) => <li key={i} className="flex gap-3 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-600/70" />{t(d[0], d[1])}</li>)}</ul></div></div>
    <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">{t("గమనిక: ఇవి సాంప్రదాయ సూచనలు మాత్రమే. వ్యక్తిగత శాంతి పరిహారాల కోసం మీ పురోహితుడిని సంప్రదించండి.", "Note: These are traditional guidelines. For personalized shanti remedies, please consult your purohit.")}</p>
  </section>;
}

export default function EclipsesPage() {
  const { language, t } = useLanguage();
  const [timezone] = useState(getStoredTimezone());
  const [location, setLocation] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [manualLat, setManualLat] = useState(""); const [manualLon, setManualLon] = useState("");
  const [geoLoading, setGeoLoading] = useState(false); const [geoError, setGeoError] = useState<string | null>(null);
  const [userNakshatra, setUserNakshatra] = useState<number | null>(() => { const s = localStorage.getItem("panchangam-janma-nakshatra"); return s ? parseInt(s, 10) : null; });
  useEffect(() => { if (userNakshatra !== null) localStorage.setItem("panchangam-janma-nakshatra", String(userNakshatra)); }, [userNakshatra]);
  const { data, isLoading, isError, refetch } = useQuery<{ eclipses: EclipseEvent[] }>({ queryKey: ["/api/eclipses", timezone], queryFn: async () => { const r = await fetch(`/api/eclipses?timezone=${encodeURIComponent(timezone)}`); if (!r.ok) throw new Error("eclipses"); return r.json(); } });
  const eclipses = data?.eclipses ?? [];
  const first = eclipses[0];
  const useMyLocation = () => { setGeoError(null); if (!navigator.geolocation) { setGeoError(t("మీ బ్రౌజర్ లొకేషన్‌ను సపోర్ట్ చేయదు", "Your browser does not support geolocation")); return; } setGeoLoading(true); navigator.geolocation.getCurrentPosition((p) => { setGeoLoading(false); setLocation({ lat: p.coords.latitude, lon: p.coords.longitude, label: t("మీ ప్రస్తుత ప్రాంతం", "Your current location") }); }, () => { setGeoLoading(false); setGeoError(t("లొకేషన్ పొందలేకపోయాం — దయచేసి నగరాన్ని ఎంచుకోండి", "Could not get your location — please pick a city instead")); }, { timeout: 10000 }); };
  const applyManualCoords = () => { const lat = parseFloat(manualLat), lon = parseFloat(manualLon); if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) { setGeoError(t("సరైన అక్షాంశ/రేఖాంశాలు ఇవ్వండి", "Please enter valid latitude/longitude")); return; } setGeoError(null); setLocation({ lat, lon, label: `${lat.toFixed(3)}, ${lon.toFixed(3)}` }); };
  const affected = useMemo(() => userNakshatra !== null && eclipses.some((e) => e.affectedNakshatras.some((n) => n.index === userNakshatra)), [eclipses, userNakshatra]);
  return <div className="min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--gold)/.2)] bg-background/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-7"><Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" data-testid="button-back-home"><ArrowLeft className="h-4 w-4" /></Link><div className="flex flex-1 items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full border border-[hsl(var(--gold)/.5)] bg-[hsl(var(--gold)/.1)]"><Sun className="h-4 w-4 text-[hsl(var(--saffron))]" /></div><div><p className="font-telugu text-lg font-semibold leading-none">{t("తెలుగు పంచాంగం", "Telugu Panchangam")}</p><p className="cel-eyebrow mt-1 text-[.55rem]">{t("ఆకాశపు అల్మనాక్", "Celestial almanac")}</p></div></div><Badge variant="outline" className="hidden gap-1.5 sm:flex"><CircleAlert className="h-3 w-3" />{t("గ్రహణ గమనిక", "Eclipse watch")}</Badge></div></header>
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-6 md:px-7 md:py-10">
      <section className="grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end"><div><p className="cel-eyebrow">{t("సూర్యుడు · చంద్రుడు · భూమి", "Sun · Moon · Earth")}</p><h1 className="cel-headline mt-3 max-w-3xl text-4xl md:text-6xl" data-testid="text-page-title">{t("గ్రహణాలను అర్థం చేసుకోండి", "Read the sky differently")}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{t("మీ ఇంటి సంప్రదాయాలకు, మీ జన్మ నక్షత్రానికి, మీ ఆకాశానికి సరిపోయేలా గ్రహణాన్ని ముందుగానే తెలుసుకోండి.", "A considered guide to the eclipse: its celestial alignment, your horizon, and the family traditions that matter.")}</p></div><a href="#guidance" className="group rounded-2xl border border-[hsl(var(--gold)/.35)] bg-[hsl(var(--gold)/.08)] p-4 transition hover:bg-[hsl(var(--gold)/.14)]" data-testid="link-guidance-top"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{t("ముందుగా చదవండి", "Start with the family guide")}</span><ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{t("ఏం చేయాలి, ఏం చేయకూడదు — పేజీ చివర దాచలేదు.", "Do's, don'ts, and remedies — never buried at the end.")}</p></a></section>
      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><Card className="overflow-hidden" data-testid="card-location"><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[hsl(var(--gold-deep))]" />{t("మీ ఆకాశం", "Your horizon")}</CardTitle><CardDescription>{t("మీ ప్రాంతంలో గ్రహణం కనిపిస్తుందో, ఏ ఎత్తులో ఉంటుందో తెలుసుకోండి.", "Set a place to see whether the eclipse is visible and how high it rises.")}</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Button onClick={useMyLocation} disabled={geoLoading} size="sm" data-testid="button-use-my-location">{geoLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <MapPin className="mr-1.5 h-4 w-4" />}{t("నా లొకేషన్ వాడండి", "Use my location")}</Button><Select onValueChange={(v) => { const c = CITY_PRESETS[parseInt(v, 10)]; setGeoError(null); setLocation({ lat: c.lat, lon: c.lon, label: language === "telugu" ? c.nameTelugu : c.name }); }}><SelectTrigger className="h-9 w-48" data-testid="select-city"><SelectValue placeholder={t("నగరం ఎంచుకోండి", "Pick a city")} /></SelectTrigger><SelectContent>{CITY_PRESETS.map((c, i) => <SelectItem key={c.name} value={String(i)}>{language === "telugu" ? c.nameTelugu : c.name}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-wrap gap-2"><Input placeholder={t("అక్షాంశం (Lat)", "Latitude")} value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="h-9 w-32" data-testid="input-latitude" /><Input placeholder={t("రేఖాంశం (Lon)", "Longitude")} value={manualLon} onChange={(e) => setManualLon(e.target.value)} className="h-9 w-32" data-testid="input-longitude" /><Button variant="outline" size="sm" onClick={applyManualCoords} data-testid="button-apply-coords">{t("సెట్ చేయండి", "Set")}</Button></div>{geoError && <p className="text-sm text-destructive">{geoError}</p>}{location && <p className="text-sm text-muted-foreground" data-testid="text-current-location">{t("ప్రస్తుత ప్రాంతం: ", "Current location: ")}<strong className="text-foreground">{location.label}</strong></p>}</CardContent></Card>
        <Card data-testid="card-nakshatra"><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-4 w-4 text-[hsl(var(--gold-deep))]" />{t("మీ జన్మ నక్షత్రం", "Your birth star")}</CardTitle><CardDescription>{t("ప్రభావం ఉంటే వ్యక్తిగత పరిహారాలను చూపిస్తాం.", "We will surface personal remedies if your star is affected.")}</CardDescription></CardHeader><CardContent><Select value={userNakshatra !== null ? String(userNakshatra) : undefined} onValueChange={(v) => setUserNakshatra(parseInt(v, 10))}><SelectTrigger className="w-full" data-testid="select-nakshatra"><SelectValue placeholder={t("నక్షత్రం ఎంచుకోండి", "Select nakshatra")} /></SelectTrigger><SelectContent>{nakshatraNames.map((n, i) => <SelectItem key={n} value={String(i)}>{language === "telugu" ? nakshatraNamesTelugu[i] : n}</SelectItem>)}</SelectContent></Select></CardContent></Card></section>
      <Guidance userAffected={!!affected} />
      <section className="space-y-4"><div className="flex items-end justify-between gap-4"><div><p className="cel-eyebrow">{t("రాబోయే తేదీలు", "Upcoming dates")}</p><h2 className="mt-1 font-display text-3xl font-semibold" data-testid="text-upcoming-heading">{t("ఆకాశంలో తదుపరి మార్పులు", "The next changes in the sky")}</h2></div><span className="hidden text-sm text-muted-foreground sm:block">{eclipses.length} {t("గ్రహణాలు", "eclipses")}</span></div>
        {isLoading ? <div className="space-y-4"><div className="h-80 animate-pulse rounded-[1.5rem] bg-muted" /><div className="h-48 animate-pulse rounded-[1.5rem] bg-muted" /></div> : isError ? <Card className="border-destructive/40"><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><CircleAlert className="h-8 w-8 text-destructive" /><p className="font-medium">{t("గ్రహణ వివరాలు అందుబాటులో లేవు", "Eclipse details are unavailable right now")}</p><Button variant="outline" onClick={() => refetch()}>{t("మళ్లీ ప్రయత్నించండి", "Try again")}</Button></CardContent></Card> : first ? <><EclipseCard eclipse={first} location={location} timezone={timezone} userNakshatra={userNakshatra} featured />{eclipses.slice(1).map((e) => <EclipseCard key={`${e.peakUtc}-${e.type}`} eclipse={e} location={location} timezone={timezone} userNakshatra={userNakshatra} />)}</> : <Card><CardContent className="py-12 text-center text-muted-foreground">{t("రాబోయే గ్రహణాలు లేవు", "No upcoming eclipses found")}</CardContent></Card>}
      </section>
      <div className="flex items-center justify-center gap-2 pt-3 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--gold-deep))]" />{t("సంప్రదాయం, ఖగోళ విజ్ఞానం, మీ స్థానిక ఆకాశం — ఒకే చోట.", "Tradition, astronomy, and your local sky — together.")}</div>
    </main>
  </div>;
}