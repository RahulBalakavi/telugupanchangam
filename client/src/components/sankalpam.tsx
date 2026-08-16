import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy, Globe, Loader2, ScrollText, Share2 } from "lucide-react";
import type { PanchangData } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { shareSankalpamCard } from "@/lib/share-card";

interface SankalpamProps {
  panchang?: PanchangData;
}

interface CountryInfo {
  code: string;
  name: string;
  nameTelugu: string;
  dwipa: string;
  dwipaTelugu: string;
  varsha: string;
  varshaTelugu: string;
  khanda: string;
  khandaTelugu: string;
  /** Optional extra geographic phrase recited after the khanda. */
  locale?: string;
  localeTelugu?: string;
}

const COUNTRIES: CountryInfo[] = [
  {
    code: "IN",
    name: "India",
    nameTelugu: "భారత దేశం",
    dwipa: "Jambu Dwipe",
    dwipaTelugu: "జంబూ ద్వీపే",
    varsha: "Bharata Varshe",
    varshaTelugu: "భరత వర్షే",
    khanda: "Bharata Khande",
    khandaTelugu: "భరత ఖండే",
    locale: "Meroh Dakshina Digbhage, Sri Shailasya (Godavari-Krishna nadyoh) Praanthe",
    localeTelugu: "మేరోః దక్షిణ దిగ్భాగే, శ్రీశైలస్య ప్రాంతే",
  },
  {
    code: "US",
    name: "United States",
    nameTelugu: "అమెరికా సంయుక్త రాష్ట్రాలు",
    dwipa: "Krouncha Dwipe",
    dwipaTelugu: "క్రౌంచ ద్వీపే",
    varsha: "Ramanaka Varshe",
    varshaTelugu: "రమణక వర్షే",
    khanda: "Aindra Khande",
    khandaTelugu: "ఐంద్ర ఖండే",
    locale:
      "Meroh Paschima Digbhage, Uttara Americayaam, Atlantic-Pacific Saagarayor Madhya Pradeshe, Rocky-McKinley Parvatayor Madhye, Mississippi-Missouri ityadi Jeeva Nadee Pareevaaha Praanthe",
    localeTelugu:
      "మేరోః పశ్చిమ దిగ్భాగే, ఉత్తర అమెరికాయాం, అట్లాంటిక్-పసిఫిక్ సాగరయోర్ మధ్య ప్రదేశే, రాకీ-మెకిన్లీ పర్వతయోర్ మధ్యే, మిస్సిసిపి-మిస్సోరి ఇత్యాది జీవ నదీ పరీవాహ ప్రాంతే",
  },
  {
    code: "CA",
    name: "Canada",
    nameTelugu: "కెనడా",
    dwipa: "Krouncha Dwipe",
    dwipaTelugu: "క్రౌంచ ద్వీపే",
    varsha: "Ramanaka Varshe",
    varshaTelugu: "రమణక వర్షే",
    khanda: "Hiranmaya Khande",
    khandaTelugu: "హిరణ్మయ ఖండే",
    locale: "Meroh Paschima Digbhage, Uttara Americayaam",
    localeTelugu: "మేరోః పశ్చిమ దిగ్భాగే, ఉత్తర అమెరికాయాం",
  },
  {
    code: "GB",
    name: "United Kingdom",
    nameTelugu: "యునైటెడ్ కింగ్‌డమ్",
    dwipa: "Pushkara Dwipe",
    dwipaTelugu: "పుష్కర ద్వీపే",
    varsha: "Pashchima Varshe",
    varshaTelugu: "పశ్చిమ వర్షే",
    khanda: "Pashchima Khande",
    khandaTelugu: "పశ్చిమ ఖండే",
  },
  {
    code: "AU",
    name: "Australia",
    nameTelugu: "ఆస్ట్రేలియా",
    dwipa: "Shaka Dwipe",
    dwipaTelugu: "శాక ద్వీపే",
    varsha: "Dakshina Varshe",
    varshaTelugu: "దక్షిణ వర్షే",
    khanda: "Ketumala Khande",
    khandaTelugu: "కేతుమాల ఖండే",
  },
  {
    code: "AE",
    name: "UAE / Middle East",
    nameTelugu: "యూఏఈ / మధ్య ప్రాచ్యం",
    dwipa: "Shalmali Dwipe",
    dwipaTelugu: "శాల్మలి ద్వీపే",
    varsha: "Pashchima Varshe",
    varshaTelugu: "పశ్చిమ వర్షే",
    khanda: "Pashchima Khande",
    khandaTelugu: "పశ్చిమ ఖండే",
  },
  {
    code: "SG",
    name: "Singapore / SE Asia",
    nameTelugu: "సింగపూర్ / ఆగ్నేయాసియా",
    dwipa: "Jambu Dwipe",
    dwipaTelugu: "జంబూ ద్వీపే",
    varsha: "Bharata Varshe",
    varshaTelugu: "భరత వర్షే",
    khanda: "Aagneya Khande",
    khandaTelugu: "ఆగ్నేయ ఖండే",
  },
  {
    code: "JP",
    name: "Japan",
    nameTelugu: "జపాన్",
    dwipa: "Jambu Dwipe",
    dwipaTelugu: "జంబూ ద్వీపే",
    varsha: "Bharata Varshe",
    varshaTelugu: "భరత వర్షే",
    khanda: "Purva Khande",
    khandaTelugu: "పూర్వ ఖండే",
  },
];

// Recitation-friendly country names for the "<X> Rashtre" clause.
const RASHTRA_EN: Record<string, string> = {
  IN: "Bharata", US: "America", CA: "Canada", GB: "Britain",
  AU: "Australia", AE: "Arab", SG: "Singapura", JP: "Japan",
};
const RASHTRA_TE: Record<string, string> = {
  IN: "భరత", US: "అమెరికా", CA: "కెనడా", GB: "బ్రిటన్",
  AU: "ఆస్ట్రేలియా", AE: "అరబ్", SG: "సింగపుర", JP: "జపాన్",
};

const STORAGE_KEY = "sankalpam_country";
const CITY_KEY = "sankalpam_city";
const GOTRA_KEY = "sankalpam_gotra";
const NAME_KEY = "sankalpam_name";

/** Best-effort map from an IANA timezone to the closest Sankalpam country. */
function countryFromTimezone(tz?: string): string {
  if (!tz) return "IN";
  const exact: Record<string, string> = {
    "Asia/Kolkata": "IN",
    "Asia/Dubai": "AE",
    "Asia/Singapore": "SG",
    "Asia/Hong_Kong": "SG",
    "Asia/Tokyo": "JP",
    "America/Toronto": "CA",
  };
  if (exact[tz]) return exact[tz];
  if (tz.startsWith("America/")) return "US";
  if (tz.startsWith("Europe/")) return "GB";
  if (tz.startsWith("Australia/") || tz.startsWith("Pacific/")) return "AU";
  return "IN";
}

const RITUS = [
  { name: "Shishira", nameTelugu: "శిశిర", months: [9, 10] },
  { name: "Vasanta", nameTelugu: "వసంత", months: [11, 0] },
  { name: "Grishma", nameTelugu: "గ్రీష్మ", months: [1, 2] },
  { name: "Varsha", nameTelugu: "వర్ష", months: [3, 4] },
  { name: "Sharad", nameTelugu: "శరత్", months: [5, 6] },
  { name: "Hemanta", nameTelugu: "హేమంత", months: [7, 8] },
];

const VASARAS = [
  { name: "Bhanu", nameTelugu: "భాను" },
  { name: "Indu", nameTelugu: "ఇందు" },
  { name: "Bhauma", nameTelugu: "భౌమ" },
  { name: "Saumya", nameTelugu: "సౌమ్య" },
  { name: "Guru", nameTelugu: "గురు" },
  { name: "Bhrigu", nameTelugu: "భృగు" },
  { name: "Sthira", nameTelugu: "స్థిర" },
];

function getRitu(teluguMonthIndex: number): { name: string; nameTelugu: string } {
  const ritu = RITUS.find((r) => r.months.includes(teluguMonthIndex)) || RITUS[1];
  return { name: ritu.name, nameTelugu: ritu.nameTelugu };
}

function getAyana(teluguMonthIndex: number): { name: string; nameTelugu: string } {
  const isUttarayana = [9, 10, 11, 0, 1, 2].includes(teluguMonthIndex);
  return isUttarayana
    ? { name: "Uttarayana", nameTelugu: "ఉత్తరాయణ" }
    : { name: "Dakshinayana", nameTelugu: "దక్షిణాయన" };
}

const TELUGU_MONTH_LIST = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashwayuja", "Kartika", "Margashira", "Pushya", "Magha", "Phalguna"
];

function usePersistedInput(key: string): [string, (v: string) => void] {
  const [value, setValue] = useState<string>(
    () => (typeof window !== "undefined" && localStorage.getItem(key)) || "",
  );
  const set = (v: string) => {
    setValue(v);
    if (typeof window !== "undefined") {
      if (v.trim()) localStorage.setItem(key, v);
      else localStorage.removeItem(key);
    }
  };
  return [value, set];
}

export function Sankalpam({ panchang }: SankalpamProps) {
  const { language, t } = useLanguage();
  const [countryCode, setCountryCode] = useState<string>(() =>
    (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "IN",
  );
  const [isManual, setIsManual] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) != null,
  );
  const [city, setCity] = usePersistedInput(CITY_KEY);
  const [gotra, setGotra] = usePersistedInput(GOTRA_KEY);
  const [personName, setPersonName] = usePersistedInput(NAME_KEY);
  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "busy" | "done">("idle");

  useEffect(() => {
    if (!isManual && panchang?.timezone) {
      setCountryCode(countryFromTimezone(panchang.timezone));
    }
  }, [isManual, panchang?.timezone]);

  const handleCountryChange = (code: string) => {
    setIsManual(true);
    setCountryCode(code);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, code);
    }
  };

  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const monthIndex = panchang ? TELUGU_MONTH_LIST.indexOf(panchang.teluguMonthEnglish) : 0;
  const ritu = getRitu(monthIndex >= 0 ? monthIndex : 0);
  const ayana = getAyana(monthIndex >= 0 ? monthIndex : 0);
  const dateObj = panchang
    ? new Date(panchang.date.includes("T") ? panchang.date : panchang.date + "T12:00:00")
    : new Date();
  const vasara = VASARAS[dateObj.getDay()];

  // The full text as plain strings (used for the copy button and, split on
  // "\n\n", for rendering).
  const fullText = useMemo(() => {
    if (!panchang) return { en: "", te: "" };
    const cityEn = city.trim() || "____";
    const gotraEn = gotra.trim() || "____";
    const nameEn = personName.trim() || "____";
    const en = [
      "Mama upaatta samasta duritakshaya dvaara Sri Parameshwara muddishya, Sri Parameshwara preetyartham, shubhe shobhane muhurte, Sri Mahavishnor aajnaya pravartamaanasya, Adya Brahmanah Dviteeya Paraardhe, Shveta Varaaha Kalpe, Vaivasvata Manvantare, Kaliyuge, Prathama Paade,",
      `${country.dwipa}, ${country.varsha}, ${country.khanda},${country.locale ? ` ${country.locale},` : ""} ${RASHTRA_EN[country.code] || country.name} Rashtre, ${cityEn} Nagara Sthaane, Swasthaane, Shobhana Gruhe, Samasta Devataa Braahmana Harihara Sannidhau,`,
      `Asmin Vartamaana Vyaavahaarika Chaandramaanena, Prabhavaadi Shashti Samvatsaraanaam Madhye, Sri ${panchang.samvatsaraName} Naama Samvatsare, ${ayana.name} Ayane, ${ritu.name} Ritau, ${panchang.isAdhikaMasa ? "Adhika " : ""}${panchang.teluguMonthEnglish} Maase, ${panchang.paksha} Pakshe, ${panchang.tithi} Tithau, ${vasara.name} Vaasara Yuktaayaam, ${panchang.nakshatra} Nakshatra Yuktaayaam, ${panchang.yoga} Shubha Yoge, ${panchang.karana} Shubha Karane — evam guna visheshana vishishtaayaam, asyaam shubha tithau,`,
      `Sriman ${gotraEn} Gotrasya, ${nameEn} Naamadheyasya, mama sahakutumbasya — kshema, sthairya, vijaya, abhaya, aayur-aarogya, aishvaryaadi abhivriddhyartham; dharma-artha-kaama-moksha chaturvidha purushaartha phala siddhyartham; mama ishta-kaamya-artha siddhyartham; samasta mangala avaaptyartham — (mention the puja / vratam / japam being performed) aham karishye.`,
    ].join("\n\n");
    const te = [
      "మమ ఉపాత్త సమస్త దురితక్షయ ద్వారా శ్రీ పరమేశ్వర ముద్దిశ్య, శ్రీ పరమేశ్వర ప్రీత్యర్థం, శుభే శోభనే ముహూర్తే, శ్రీ మహావిష్ణోః ఆజ్ఞయా ప్రవర్తమానస్య, ఆద్య బ్రహ్మణః ద్వితీయ పరార్ధే, శ్వేత వరాహ కల్పే, వైవస్వత మన్వంతరే, కలియుగే, ప్రథమ పాదే,",
      `${country.dwipaTelugu}, ${country.varshaTelugu}, ${country.khandaTelugu},${country.localeTelugu ? ` ${country.localeTelugu},` : ""} ${RASHTRA_TE[country.code] || country.nameTelugu} రాష్ట్రే, ${city.trim() || "____"} నగర స్థానే, స్వస్థానే, శోభన గృహే, సమస్త దేవతా బ్రాహ్మణ హరిహర సన్నిధౌ,`,
      `అస్మిన్ వర్తమాన వ్యావహారిక చాంద్రమానేన, ప్రభవాది షష్టి సంవత్సరాణాం మధ్యే, శ్రీ ${panchang.samvatsaraNameTelugu} నామ సంవత్సరే, ${ayana.nameTelugu} ఆయనే, ${ritu.nameTelugu} ఋతౌ, ${panchang.isAdhikaMasa ? "అధిక " : ""}${panchang.teluguMonth} మాసే, ${panchang.pakshaTelugu.replace(" పక్షం", "")} పక్షే, ${panchang.tithiTelugu} తిథౌ, ${vasara.nameTelugu} వాసర యుక్తాయాం, ${panchang.nakshatraTelugu} నక్షత్ర యుక్తాయాం, ${panchang.yogaTelugu} శుభ యోగే, ${panchang.karanaTelugu} శుభ కరణే — ఏవం గుణ విశేషణ విశిష్టాయాం, అస్యాం శుభ తిథౌ,`,
      `శ్రీమాన్ ${gotra.trim() || "____"} గోత్రస్య, ${personName.trim() || "____"} నామధేయస్య, మమ సహకుటుంబస్య — క్షేమ, స్థైర్య, విజయ, అభయ, ఆయురారోగ్య, ఐశ్వర్యాది అభివృద్ధ్యర్థం; ధర్మ-అర్థ-కామ-మోక్ష చతుర్విధ పురుషార్థ ఫల సిద్ధ్యర్థం; మమ ఇష్ట కామ్యార్థ సిద్ధ్యర్థం; సమస్త మంగళ అవాప్త్యర్థం — (చేయబోయే పూజ / వ్రతం / జపం పేరు చెప్పండి) అహం కరిష్యే.`,
    ].join("\n\n");
    return { en, te };
  }, [panchang, country, ayana, ritu, vasara, city, gotra, personName]);

  if (!panchang) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(language === "telugu" ? fullText.te : fullText.en);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const share = async () => {
    if (shareState === "busy") return;
    setShareState("busy");
    try {
      const dateLabel = new Date(panchang.date + "T12:00:00").toLocaleDateString(
        language === "telugu" ? "te-IN" : "en-US",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" },
      );
      await shareSankalpamCard(
        language === "telugu" ? fullText.te : fullText.en,
        dateLabel,
        panchang.date,
        language === "telugu" ? "telugu" : "english",
      );
      setShareState("done");
      setTimeout(() => setShareState("idle"), 2500);
    } catch {
      setShareState("idle");
    }
  };

  const text = language === "telugu" ? fullText.te : fullText.en;
  // Highlight the values computed for today by bolding known tokens.
  const highlights = [
    panchang.samvatsaraName, panchang.samvatsaraNameTelugu,
    panchang.tithi, panchang.tithiTelugu,
    panchang.nakshatra, panchang.nakshatraTelugu,
    panchang.yoga, panchang.yogaTelugu,
    panchang.karana, panchang.karanaTelugu,
    panchang.teluguMonth, panchang.teluguMonthEnglish,
    ayana.name, ayana.nameTelugu, ritu.name, ritu.nameTelugu,
    vasara.name, vasara.nameTelugu,
  ].filter(Boolean);

  const renderPara = (para: string, i: number) => {
    let parts: (string | JSX.Element)[] = [para];
    highlights.forEach((h, hi) => {
      parts = parts.flatMap((part) => {
        if (typeof part !== "string" || !part.includes(h)) return [part];
        const split = part.split(h);
        const out: (string | JSX.Element)[] = [];
        split.forEach((s, si) => {
          if (si > 0) out.push(<strong key={`${i}-${hi}-${si}`} className="font-semibold text-primary">{h}</strong>);
          out.push(s);
        });
        return out;
      });
    });
    return <p key={i}>{parts}</p>;
  };

  return (
    <Card data-testid="card-sankalpam">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="cel-panel-title flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              {t("నేటి సంకల్పం", "Today's Sankalpam")}
            </CardTitle>
            <CardDescription>
              {t(
                "మీ స్థలం, కాలం, పేరుతో పూర్తి సంకల్ప వాక్యం",
                "The full sankalpam for your place, time and name"
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={countryCode} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-[190px]" data-testid="select-sankalpam-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} data-testid={`option-country-${c.code}`}>
                    {language === "telugu" ? c.nameTelugu : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("మీ ఊరు (ఉదా: హైదరాబాద్)", "Your city (e.g. San Mateo)")}
            data-testid="input-sankalpam-city"
          />
          <Input
            value={gotra}
            onChange={(e) => setGotra(e.target.value)}
            placeholder={t("గోత్రం", "Gotram")}
            data-testid="input-sankalpam-gotra"
          />
          <Input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder={t("పేరు (శర్మ/వర్మ...)", "Your name")}
            data-testid="input-sankalpam-name"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-3 text-base leading-relaxed font-serif text-foreground"
          data-testid={language === "telugu" ? "text-sankalpam-telugu" : "text-sankalpam-english"}
        >
          {text.split("\n\n").map(renderPara)}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground italic max-w-md">
            {t(
              "వివాహితులు 'మమ సహకుటుంబస్య' ముందు 'ధర్మపత్నీ సమేతస్య' చేర్చుకోవచ్చు. సంకల్పం: పూజ ప్రారంభంలో కాలం, స్థలం, సంకల్పం ప్రకటించే సంప్రదాయ వాక్యం.",
              "Married individuals may add 'Dharmapatni samethasya' before 'mama sahakutumbasya'. The sankalpam declares the time, place and intent at the start of any puja or vratam."
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copy} data-testid="button-copy-sankalpam">
              {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
              {copied ? t("కాపీ అయింది", "Copied") : t("కాపీ చేయండి", "Copy")}
            </Button>
            <Button variant="outline" size="sm" onClick={share} disabled={shareState === "busy"} data-testid="button-share-sankalpam">
              {shareState === "busy" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : shareState === "done" ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Share2 className="mr-1.5 h-4 w-4" />}
              {shareState === "done" ? t("సిద్ధం!", "Done!") : t("షేర్", "Share")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
