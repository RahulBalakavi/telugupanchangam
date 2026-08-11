import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, MapPin, ArrowLeft, Loader2, Star, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { getStoredTimezone } from "@/components/timezone-selector";
import { nakshatraNames, nakshatraNamesTelugu } from "@shared/schema";

interface EclipseNakshatraInfo {
  index: number;
  name: string;
  nameTelugu: string;
  severity: "high" | "medium";
  reason: string;
}

interface EclipseEvent {
  type: "solar" | "lunar";
  kind: string;
  peakUtc: string;
  dateLocal: string;
  peakLocal: string;
  obscuration: number | null;
  nakshatra: { index: number; name: string; nameTelugu: string };
  affectedNakshatras: EclipseNakshatraInfo[];
}

interface LocalEclipseVisibility {
  visible: boolean;
  kindAtLocation: string | null;
  obscuration: number | null;
  beginLocal: string | null;
  peakLocal: string | null;
  endLocal: string | null;
  peakAltitude: number | null;
  note: string;
  noteTelugu: string;
}

// Common city presets so users don't need to know coordinates
const CITY_PRESETS: { name: string; nameTelugu: string; lat: number; lon: number }[] = [
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

// General eclipse observances (traditional)
const GENERAL_DOS: { telugu: string; english: string }[] = [
  {
    telugu: "గ్రహణ సమయంలో ఇష్టదైవ నామస్మరణ, జపం చేయండి — ఈ సమయంలో చేసిన జపానికి అధిక ఫలం.",
    english: "Chant your ishta devata's name or do japa during the eclipse — japa done during an eclipse is considered many times more powerful.",
  },
  {
    telugu: "గ్రహణం ముగిసిన వెంటనే స్నానం చేయండి (గ్రహణ మోక్ష స్నానం).",
    english: "Take a bath immediately after the eclipse ends (grahana moksha snanam).",
  },
  {
    telugu: "గ్రహణం తర్వాత దానం చేయండి — బియ్యం, నువ్వులు, వస్త్రాలు, లేదా అన్నదానం.",
    english: "Give charity after the eclipse — rice, sesame (til), clothes, or food donation (annadanam).",
  },
  {
    telugu: "నిల్వ ఉంచే ఆహారంలో, నీటిలో దర్భ (గరిక) ఉంచండి.",
    english: "Place darbha (kusha grass) in stored food and water to protect them during the eclipse.",
  },
  {
    telugu: "గ్రహణం తర్వాత ఇంటిని శుభ్రం చేసి, పూజా మందిరాన్ని ప్రోక్షణ చేయండి.",
    english: "Clean the house after the eclipse and sprinkle water (prokshana) on the puja area.",
  },
];

const GENERAL_DONTS: { telugu: string; english: string }[] = [
  {
    telugu: "గ్రహణ సమయంలో భోజనం చేయకూడదు; గ్రహణానికి ముందు (సూర్యగ్రహణానికి 12 గం., చంద్రగ్రహణానికి 9 గం. ముందు నుండి) ఆహారం తీసుకోకపోవడం సంప్రదాయం.",
    english: "Avoid eating during the eclipse; traditionally food is avoided from 12 hours before a solar eclipse and 9 hours before a lunar eclipse (children, elderly, and the unwell are exempt).",
  },
  {
    telugu: "గర్భిణులు గ్రహణ సమయంలో బయటకు వెళ్లకుండా, విశ్రాంతి తీసుకోవడం సంప్రదాయం.",
    english: "Pregnant women are traditionally advised to stay indoors and rest during the eclipse.",
  },
  {
    telugu: "గ్రహణ సమయంలో నిద్రపోవడం, కొత్త పనులు ప్రారంభించడం మంచిది కాదు.",
    english: "Avoid sleeping during the eclipse and avoid starting new ventures at that time.",
  },
  {
    telugu: "గ్రహణ సమయంలో దేవాలయ దర్శనం, విగ్రహ స్పర్శ చేయరు (ఆలయాలు మూసి ఉంటాయి).",
    english: "Temple darshan and touching idols are avoided during the eclipse (temples remain closed).",
  },
];

// Extra remedies for people whose janma nakshatra is affected
const AFFECTED_REMEDIES: { telugu: string; english: string }[] = [
  {
    telugu: "గ్రహణ శాంతి: గ్రహణ సమయంలో మీ నక్షత్ర అధిదేవతను ప్రార్థించండి, గ్రహణ శాంతి జపం చేయించండి.",
    english: "Grahana shanti: pray to your nakshatra's presiding deity during the eclipse and consider having a grahana shanti japa performed.",
  },
  {
    telugu: "సూర్యగ్రహణానికి ఆదిత్య హృదయం / సూర్య మంత్రం, చంద్రగ్రహణానికి చంద్ర మంత్రం జపించండి.",
    english: "Chant Aditya Hrudayam or a Surya mantra for a solar eclipse; a Chandra mantra for a lunar eclipse.",
  },
  {
    telugu: "గ్రహణం తర్వాత నువ్వులు, బెల్లం, వస్త్రదానం చేయండి — గ్రహణ దోష నివారణకు ఇది ముఖ్య పరిహారం.",
    english: "After the eclipse, donate sesame seeds, jaggery, and clothes — this is the key remedy for grahana dosha.",
  },
  {
    telugu: "గ్రహణ బింబ దానం: వెండి/బంగారు గ్రహణ బింబం లేదా తులాదానం శక్తి మేరకు చేయవచ్చు.",
    english: "Grahana bimba danam: donating a small silver/gold eclipse image (bimba) is traditionally done by those who can.",
  },
  {
    telugu: "గ్రహణ మోక్షం తర్వాత శిరస్నానం చేసి, కొత్త ప్రారంభాలకు ముందు ఒక రోజు ఆగడం మంచిది.",
    english: "Take a head bath after the eclipse releases, and preferably wait a day before important new beginnings.",
  },
];

function EclipseCard({
  eclipse,
  location,
  timezone,
  userNakshatra,
}: {
  eclipse: EclipseEvent;
  location: { lat: number; lon: number; label: string } | null;
  timezone: string;
  userNakshatra: number | null;
}) {
  const { language, t } = useLanguage();

  const { data: visibility, isLoading: loadingVisibility } = useQuery<LocalEclipseVisibility>({
    queryKey: ["/api/eclipses/visibility", eclipse.peakUtc, location?.lat, location?.lon, timezone],
    enabled: !!location,
    queryFn: async () => {
      const params = new URLSearchParams({
        type: eclipse.type,
        peakUtc: eclipse.peakUtc,
        lat: String(location!.lat),
        lon: String(location!.lon),
        timezone,
      });
      const res = await fetch(`/api/eclipses/visibility?${params}`);
      if (!res.ok) throw new Error("Failed to fetch visibility");
      return res.json();
    },
  });

  const isUserAffected =
    userNakshatra !== null &&
    eclipse.affectedNakshatras.some((n) => n.index === userNakshatra);
  const userAffectedInfo =
    userNakshatra !== null
      ? eclipse.affectedNakshatras.find((n) => n.index === userNakshatra)
      : undefined;

  const kindLabel = (kind: string) => {
    const map: Record<string, { te: string; en: string }> = {
      total: { te: "సంపూర్ణ", en: "Total" },
      annular: { te: "వలయాకార", en: "Annular" },
      partial: { te: "పాక్షిక", en: "Partial" },
      penumbral: { te: "ఛాయా", en: "Penumbral" },
    };
    const m = map[kind];
    return m ? t(m.te, m.en) : kind;
  };

  const dateDisplay = new Date(eclipse.peakUtc).toLocaleDateString(
    language === "telugu" ? "te-IN" : "en-US",
    { timeZone: timezone, weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <Card data-testid={`card-eclipse-${eclipse.dateLocal}-${eclipse.type}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {eclipse.type === "solar" ? (
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-950">
                <Sun className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-950">
                <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">
                {kindLabel(eclipse.kind)}{" "}
                {eclipse.type === "solar"
                  ? t("సూర్యగ్రహణం", "Solar Eclipse")
                  : t("చంద్రగ్రహణం", "Lunar Eclipse")}
              </CardTitle>
              <CardDescription>{dateDisplay}</CardDescription>
            </div>
          </div>
          {isUserAffected && (
            <Badge variant="destructive" data-testid={`badge-affected-${eclipse.dateLocal}`}>
              {t("మీ నక్షత్రం ప్రభావితం", "Your star affected")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <span className="text-muted-foreground">{t("గ్రహణ మధ్యకాలం: ", "Peak: ")}</span>
            {eclipse.peakLocal}
          </span>
          <span>
            <span className="text-muted-foreground">{t("గ్రహణ నక్షత్రం: ", "Eclipse nakshatra: ")}</span>
            <span className="font-medium">
              {language === "telugu" ? eclipse.nakshatra.nameTelugu : eclipse.nakshatra.name}
            </span>
          </span>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">
            {t("ప్రభావిత నక్షత్రాలు:", "Affected nakshatras:")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {eclipse.affectedNakshatras.map((n) => (
              <Badge
                key={n.index}
                variant={n.severity === "high" ? "default" : "secondary"}
                data-testid={`badge-nakshatra-${n.index}`}
              >
                {language === "telugu" ? n.nameTelugu : n.name}
                {n.severity === "high" && " ★"}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              "★ = గ్రహణం జరిగే నక్షత్రం (అత్యధిక ప్రభావం); మిగిలినవి అనుజన్మ, త్రిజన్మ నక్షత్రాలు.",
              "★ = the nakshatra in which the eclipse occurs (most affected); the others are the anujanma and trijanma stars.",
            )}
          </p>
        </div>

        {location && (
          <div className="rounded-md border p-3 space-y-1" data-testid={`visibility-${eclipse.dateLocal}`}>
            <p className="font-medium flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {location.label}
            </p>
            {loadingVisibility ? (
              <p className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("పరిశీలిస్తోంది...", "Checking visibility...")}
              </p>
            ) : visibility ? (
              <>
                <p className={visibility.visible ? "text-green-700 dark:text-green-400 font-medium" : "text-muted-foreground font-medium"}>
                  {visibility.visible
                    ? t("మీ ప్రాంతంలో కనిపిస్తుంది", "Visible from your location")
                    : t("మీ ప్రాంతంలో కనిపించదు", "Not visible from your location")}
                  {visibility.visible && visibility.kindAtLocation && (
                    <> ({kindLabel(visibility.kindAtLocation)})</>
                  )}
                </p>
                {visibility.visible && (
                  <p>
                    {visibility.beginLocal && (
                      <>
                        <span className="text-muted-foreground">{t("ప్రారంభం: ", "Begins: ")}</span>
                        {visibility.beginLocal}{" · "}
                      </>
                    )}
                    <span className="text-muted-foreground">{t("మధ్యకాలం: ", "Peak: ")}</span>
                    {visibility.peakLocal}
                    {visibility.endLocal && (
                      <>
                        {" · "}
                        <span className="text-muted-foreground">{t("ముగింపు: ", "Ends: ")}</span>
                        {visibility.endLocal}
                      </>
                    )}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {language === "telugu" ? visibility.noteTelugu : visibility.note}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {t("వివరాలు లభించలేదు", "Could not check visibility")}
              </p>
            )}
          </div>
        )}

        {isUserAffected && userAffectedInfo && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2" data-testid={`remedies-${eclipse.dateLocal}`}>
            <p className="font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              {t(
                `మీ జన్మ నక్షత్రం (${nakshatraNamesTelugu[userNakshatra!]}) ఈ గ్రహణంతో ప్రభావితం — పరిహారాలు:`,
                `Your birth star (${nakshatraNames[userNakshatra!]}) is affected by this eclipse — remedies:`,
              )}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {AFFECTED_REMEDIES.map((r, i) => (
                <li key={i}>{language === "telugu" ? r.telugu : r.english}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EclipsesPage() {
  const { language, t } = useLanguage();
  const [timezone] = useState(getStoredTimezone());
  const [location, setLocation] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userNakshatra, setUserNakshatra] = useState<number | null>(() => {
    const stored = localStorage.getItem("panchangam-janma-nakshatra");
    return stored !== null && stored !== "" ? parseInt(stored, 10) : null;
  });

  useEffect(() => {
    if (userNakshatra !== null) {
      localStorage.setItem("panchangam-janma-nakshatra", String(userNakshatra));
    }
  }, [userNakshatra]);

  const { data, isLoading } = useQuery<{ eclipses: EclipseEvent[] }>({
    queryKey: ["/api/eclipses", timezone],
    queryFn: async () => {
      const res = await fetch(`/api/eclipses?timezone=${encodeURIComponent(timezone)}`);
      if (!res.ok) throw new Error("Failed to fetch eclipses");
      return res.json();
    },
  });

  const useMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(t("మీ బ్రౌజర్ లొకేషన్‌ను సపోర్ట్ చేయదు", "Your browser does not support geolocation"));
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: t("మీ ప్రస్తుత ప్రాంతం", "Your current location"),
        });
      },
      () => {
        setGeoLoading(false);
        setGeoError(
          t(
            "లొకేషన్ పొందలేకపోయాం — దయచేసి నగరాన్ని ఎంచుకోండి",
            "Could not get your location — please pick a city instead",
          ),
        );
      },
      { timeout: 10000 },
    );
  };

  const applyManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setGeoError(t("సరైన అక్షాంశ/రేఖాంశాలు ఇవ్వండి", "Please enter valid latitude/longitude"));
      return;
    }
    setGeoError(null);
    setLocation({ lat, lon, label: `${lat.toFixed(3)}, ${lon.toFixed(3)}` });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sun className="h-5 w-5 text-orange-500" />
              <Moon className="h-3 w-3 text-indigo-500 absolute -bottom-1 -right-1" />
            </div>
            <h1 className="text-lg font-semibold" data-testid="text-page-title">
              {t("గ్రహణాలు", "Eclipses")}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Location picker */}
        <Card data-testid="card-location">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("మీ ప్రాంతం", "Your Location")}
            </CardTitle>
            <CardDescription>
              {t(
                "గ్రహణం మీ ప్రాంతంలో కనిపిస్తుందో లేదో తెలుసుకోవడానికి మీ ప్రాంతాన్ని ఎంచుకోండి.",
                "Set your location to see whether each eclipse is visible in your region.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={useMyLocation}
                disabled={geoLoading}
                variant="default"
                size="sm"
                data-testid="button-use-my-location"
              >
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <MapPin className="h-4 w-4 mr-1.5" />
                )}
                {t("నా లొకేషన్ వాడండి", "Use my location")}
              </Button>
              <Select
                onValueChange={(v) => {
                  const city = CITY_PRESETS[parseInt(v, 10)];
                  setGeoError(null);
                  setLocation({
                    lat: city.lat,
                    lon: city.lon,
                    label: language === "telugu" ? city.nameTelugu : city.name,
                  });
                }}
              >
                <SelectTrigger className="w-48 h-9" data-testid="select-city">
                  <SelectValue placeholder={t("నగరం ఎంచుకోండి", "Pick a city")} />
                </SelectTrigger>
                <SelectContent>
                  {CITY_PRESETS.map((c, i) => (
                    <SelectItem key={c.name} value={String(i)}>
                      {language === "telugu" ? c.nameTelugu : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder={t("అక్షాంశం (Lat)", "Latitude")}
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-32 h-9"
                data-testid="input-latitude"
              />
              <Input
                placeholder={t("రేఖాంశం (Lon)", "Longitude")}
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="w-32 h-9"
                data-testid="input-longitude"
              />
              <Button variant="outline" size="sm" onClick={applyManualCoords} data-testid="button-apply-coords">
                {t("సెట్ చేయండి", "Set")}
              </Button>
            </div>
            {geoError && <p className="text-sm text-destructive">{geoError}</p>}
            {location && (
              <p className="text-sm text-muted-foreground" data-testid="text-current-location">
                {t("ప్రస్తుత ప్రాంతం: ", "Current location: ")}
                <span className="font-medium text-foreground">{location.label}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Janma nakshatra picker */}
        <Card data-testid="card-nakshatra">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />
              {t("మీ జన్మ నక్షత్రం", "Your Birth Star (Janma Nakshatra)")}
            </CardTitle>
            <CardDescription>
              {t(
                "మీ జన్మ నక్షత్రాన్ని ఎంచుకుంటే, ఏ గ్రహణం మిమ్మల్ని ప్రభావితం చేస్తుందో, పరిహారాలు ఏమిటో చూపిస్తాం.",
                "Select your birth star to see which eclipses affect you and what remedies are recommended.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={userNakshatra !== null ? String(userNakshatra) : undefined}
              onValueChange={(v) => setUserNakshatra(parseInt(v, 10))}
            >
              <SelectTrigger className="w-64" data-testid="select-nakshatra">
                <SelectValue placeholder={t("నక్షత్రం ఎంచుకోండి", "Select nakshatra")} />
              </SelectTrigger>
              <SelectContent>
                {nakshatraNames.map((n, i) => (
                  <SelectItem key={n} value={String(i)}>
                    {language === "telugu" ? nakshatraNamesTelugu[i] : n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Eclipse list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" data-testid="text-upcoming-heading">
            {t("రాబోయే గ్రహణాలు", "Upcoming Eclipses")}
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t("లోడ్ అవుతోంది...", "Loading...")}
            </div>
          ) : (
            data?.eclipses.map((e) => (
              <EclipseCard
                key={`${e.peakUtc}-${e.type}`}
                eclipse={e}
                location={location}
                timezone={timezone}
                userNakshatra={userNakshatra}
              />
            ))
          )}
        </div>

        {/* General observances */}
        <Card data-testid="card-general-guidance">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("గ్రహణ సమయంలో పాటించవలసినవి", "What to Do During an Eclipse")}
            </CardTitle>
            <CardDescription>
              {t(
                "గ్రహణం మీ ప్రాంతంలో కనిపించినప్పుడు మాత్రమే ఈ నియమాలు వర్తిస్తాయి.",
                "These observances traditionally apply only where the eclipse is visible.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-green-700 dark:text-green-400 mb-1.5">
                {t("చేయవలసినవి", "Do's")}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {GENERAL_DOS.map((d, i) => (
                  <li key={i}>{language === "telugu" ? d.telugu : d.english}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-red-700 dark:text-red-400 mb-1.5">
                {t("చేయకూడనివి", "Don'ts")}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {GENERAL_DONTS.map((d, i) => (
                  <li key={i}>{language === "telugu" ? d.telugu : d.english}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "గమనిక: ఇవి సాంప్రదాయ సూచనలు మాత్రమే. వ్యక్తిగత శాంతి పరిహారాల కోసం మీ పురోహితుడిని సంప్రదించండి.",
                "Note: These are traditional guidelines. For personalized shanti remedies, please consult your purohit.",
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
