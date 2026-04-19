import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Globe } from "lucide-react";
import type { PanchangData } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

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
  },
  {
    code: "US",
    name: "United States",
    nameTelugu: "అమెరికా సంయుక్త రాష్ట్రాలు",
    dwipa: "Krouncha Dwipe",
    dwipaTelugu: "క్రౌంచ ద్వీపే",
    varsha: "Ramanaka Varshe",
    varshaTelugu: "రమణక వర్షే",
    khanda: "Ailaavruta Khande",
    khandaTelugu: "ఐలావృత ఖండే",
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
  },
  {
    code: "GB",
    name: "United Kingdom",
    nameTelugu: "యునైటెడ్ కింగ్‌డమ్",
    dwipa: "Pushkara Dwipe",
    dwipaTelugu: "పుష్కర ద్వీపే",
    varsha: "Pashchima Varshe",
    varshaTelugu: "పశ్చిమ వర్షే",
    khanda: "Bharata Khande",
    khandaTelugu: "భరత ఖండే",
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
    khanda: "Bharata Khande",
    khandaTelugu: "భరత ఖండే",
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

const STORAGE_KEY = "sankalpam_country";

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
  // Uttarayana: Pushya - Jyeshtha (months 9,10,11,0,1,2)
  // Dakshinayana: Ashadha - Margashira (months 3,4,5,6,7,8)
  const isUttarayana = [9, 10, 11, 0, 1, 2].includes(teluguMonthIndex);
  return isUttarayana
    ? { name: "Uttarayana", nameTelugu: "ఉత్తరాయణ" }
    : { name: "Dakshinayana", nameTelugu: "దక్షిణాయన" };
}

const TELUGU_MONTH_LIST = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashwayuja", "Kartika", "Margashira", "Pushya", "Magha", "Phalguna"
];

export function Sankalpam({ panchang }: SankalpamProps) {
  const { language, t } = useLanguage();
  const [countryCode, setCountryCode] = useState<string>("IN");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setCountryCode(stored);
  }, []);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, code);
    }
  };

  if (!panchang) return null;

  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const monthIndex = TELUGU_MONTH_LIST.indexOf(panchang.teluguMonthEnglish);
  const ritu = getRitu(monthIndex >= 0 ? monthIndex : 0);
  const ayana = getAyana(monthIndex >= 0 ? monthIndex : 0);
  const dateObj = new Date(panchang.date.includes("T") ? panchang.date : panchang.date + "T12:00:00");
  const vasara = VASARAS[dateObj.getDay()];

  return (
    <Card data-testid="card-sankalpam">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              {t("సంకల్పం", "Sankalpam")}
            </CardTitle>
            <CardDescription>
              {t(
                "మీ స్థానానికి అనుగుణంగా సంకల్ప వాక్యం",
                "Sankalpam tailored to your country"
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={countryCode} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-[200px]" data-testid="select-sankalpam-country">
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
      </CardHeader>
      <CardContent>
        {language === "telugu" ? (
          <div
            className="space-y-2 text-base leading-relaxed font-serif text-foreground"
            data-testid="text-sankalpam-telugu"
          >
            <p>
              శుభే శోభనే ముహూర్తే, ఆద్యబ్రహ్మణః ద్వితీయ పరార్ధే,
              శ్వేత వరాహ కల్పే, వైవస్వత మన్వంతరే, కలియుగే ప్రథమ పాదే,
            </p>
            <p>
              <span className="font-semibold text-primary">{country.dwipaTelugu}</span>,{" "}
              <span className="font-semibold text-primary">{country.varshaTelugu}</span>,{" "}
              <span className="font-semibold text-primary">{country.khandaTelugu}</span>,
            </p>
            <p>
              శ్రీమన్నృప శాలివాహన శకే, బౌద్ధావతారే, రామక్షేత్రే,{" "}
              <span className="font-semibold text-accent-foreground">
                శ్రీ {panchang.samvatsaraNameTelugu}
              </span>{" "}
              నామ సంవత్సరే,{" "}
              <span className="font-semibold">{ayana.nameTelugu}</span> ఆయనే,{" "}
              <span className="font-semibold">{ritu.nameTelugu}</span> ఋతౌ,
            </p>
            <p>
              <span className="font-semibold">{panchang.teluguMonth}</span> మాసే,{" "}
              <span className="font-semibold">{panchang.pakshaTelugu}</span>,{" "}
              <span className="font-semibold">{panchang.tithiTelugu}</span> తిథౌ,{" "}
              <span className="font-semibold">{vasara.nameTelugu}</span> వాసర యుక్తాయాం,{" "}
              <span className="font-semibold">{panchang.nakshatraTelugu}</span> నక్షత్రే...
            </p>
          </div>
        ) : (
          <div
            className="space-y-2 text-base leading-relaxed font-serif text-foreground"
            data-testid="text-sankalpam-english"
          >
            <p>
              Shubhe Shobhane Muhurte, Adya Brahmanah Dvitiya Pararthe,
              Shveta Varaha Kalpe, Vaivasvata Manvantare, Kaliyuge Prathame Pade,
            </p>
            <p>
              <span className="font-semibold text-primary">{country.dwipa}</span>,{" "}
              <span className="font-semibold text-primary">{country.varsha}</span>,{" "}
              <span className="font-semibold text-primary">{country.khanda}</span>,
            </p>
            <p>
              Shrimannrupa Shalivahana Shake, Bauddhavatare, Ramakshetre,{" "}
              <span className="font-semibold text-accent-foreground">
                Shri {panchang.samvatsaraName}
              </span>{" "}
              Nama Samvatsare,{" "}
              <span className="font-semibold">{ayana.name}</span> Ayane,{" "}
              <span className="font-semibold">{ritu.name}</span> Ritau,
            </p>
            <p>
              <span className="font-semibold">{panchang.teluguMonthEnglish}</span> Mase,{" "}
              <span className="font-semibold">{panchang.paksha} Pakshe</span>,{" "}
              <span className="font-semibold">{panchang.tithi}</span> Tithau,{" "}
              <span className="font-semibold">{vasara.name}</span> Vasara Yuktayam,{" "}
              <span className="font-semibold">{panchang.nakshatra}</span> Nakshatre...
            </p>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4 italic">
          {t(
            "(సంకల్పం: పూజ ప్రారంభంలో సమయం, స్థలం, వ్యక్తి సంకల్పించే సంప్రదాయ వాక్యం)",
            "(Sankalpam: traditional declaration of time, place and intent recited at the start of any puja or vrat)"
          )}
        </p>
      </CardContent>
    </Card>
  );
}
