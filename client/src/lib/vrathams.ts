// Vratham guides: background, "when to perform", puja samagri (shopping list),
// and the embeddable guided-puja deck (hosted on GitHub Pages) for each.

export interface SamagriItem {
  en: string;
  te: string;
}

export interface SamagriGroup {
  titleEn: string;
  titleTe: string;
  items: SamagriItem[];
}

export interface Vratham {
  slug: string;
  nameEn: string;
  nameTe: string;
  deityEn: string;
  deityTe: string;
  emoji: string;
  /** Live guided-puja deck (GitHub Pages) embedded on the vratham page. */
  deckUrl: string;
  whenEn: string;
  whenTe: string;
  aboutEn: string[];
  aboutTe: string[];
  samagri: SamagriGroup[];
  /** YYYY-MM-DD of this year's festival day — drives the day-of banner. */
  festivalDate?: string;
  festivalNameEn?: string;
  festivalNameTe?: string;
}

const COMMON_SAMAGRI: SamagriGroup = {
  titleEn: "Common puja items",
  titleTe: "సాధారణ పూజా సామగ్రి",
  items: [
    { en: "Turmeric (pasupu) & kumkum", te: "పసుపు & కుంకుమ" },
    { en: "Sandalwood paste (gandham)", te: "గంధం" },
    { en: "Akshata (rice mixed with turmeric)", te: "అక్షతలు (పసుపు కలిపిన బియ్యం)" },
    { en: "Oil lamp, wicks, ghee/oil", te: "దీపం, వత్తులు, నెయ్యి/నూనె" },
    { en: "Incense sticks & camphor (karpuram)", te: "అగరబత్తి & కర్పూరం" },
    { en: "Betel leaves & nuts (tamalapaku, vakka)", te: "తమలపాకులు & వక్కలు" },
    { en: "Coconut, bananas & seasonal fruits", te: "కొబ్బరికాయ, అరటిపండ్లు & పండ్లు" },
    { en: "Flowers & a garland", te: "పూలు & పూలమాల" },
    { en: "Kalasham (vessel), new cloth, sacred thread", te: "కలశం, కొత్త వస్త్రం, దారం" },
  ],
};

export const VRATHAMS: Vratham[] = [
  {
    slug: "varalakshmi",
    nameEn: "Sri Varalakshmi Vratam",
    nameTe: "శ్రీ వరలక్ష్మీ వ్రతం",
    deityEn: "Goddess Lakshmi",
    deityTe: "లక్ష్మీ దేవి",
    emoji: "🪷",
    deckUrl: "https://rahulbalakavi.github.io/varalakshmi-vratam/",
    whenEn:
      "On the Friday before the full moon in the month of Shravana (July–August). Traditionally observed by married women for the well-being and prosperity of their family.",
    whenTe:
      "శ్రావణ మాసంలో పౌర్ణమికి ముందు వచ్చే శుక్రవారం నాడు. కుటుంబ క్షేమం, సంపద కోసం సుమంగళులు ఆచరిస్తారు.",
    aboutEn: [
      "Varalakshmi Vratam honours Goddess Lakshmi as the giver of boons (vara). Worshipping her on this day is said to be equal to worshipping all eight forms of Lakshmi (Ashtalakshmi).",
      "A decorated kalasham is invoked as the Goddess, and a sacred turmeric thread (toram) is tied on the wrist after the puja.",
    ],
    aboutTe: [
      "వరలక్ష్మీ వ్రతం వరాలను ప్రసాదించే లక్ష్మీ దేవిని ఆరాధించే పండుగ. ఈ రోజు అమ్మవారిని పూజించడం అష్టలక్ష్ముల ఆరాధనతో సమానమని చెబుతారు.",
      "అలంకరించిన కలశంలో అమ్మవారిని ఆవాహన చేసి, పూజ అనంతరం చేతికి పసుపు తోరం కడతారు.",
    ],
    samagri: [
      COMMON_SAMAGRI,
      {
        titleEn: "For Varalakshmi",
        titleTe: "వరలక్ష్మీ వ్రతానికి",
        items: [
          { en: "Lakshmi idol or framed picture", te: "లక్ష్మీ విగ్రహం లేదా పటం" },
          { en: "Kalasham with rice, decorated as the Goddess", te: "బియ్యంతో కలశం, అమ్మవారిగా అలంకరణ" },
          { en: "Turmeric thread (toram) — 9 threads, 9 knots", te: "తోరం (9 దారాలు, 9 ముడులు)" },
          { en: "Bangles, blouse piece, sandal & vermilion", te: "గాజులు, రవికె గుడ్డ, గంధం & కుంకుమ" },
          { en: "Payasam & sweets for naivedyam", te: "పాయసం & తీపి నైవేద్యం" },
        ],
      },
    ],
    festivalDate: "2026-08-07",
    festivalNameEn: "Varalakshmi Vratam",
    festivalNameTe: "వరలక్ష్మీ వ్రతం",
  },
  {
    slug: "vinayaka",
    nameEn: "Sri Vinayaka Vratam",
    nameTe: "శ్రీ వినాయక వ్రతం",
    deityEn: "Lord Ganesha",
    deityTe: "వినాయకుడు",
    emoji: "🐘",
    deckUrl: "https://rahulbalakavi.github.io/vinayaka-vratam/",
    whenEn:
      "On Bhadrapada Shukla Chaturthi (August–September) — Vinayaka Chavithi. The clay idol is worshipped at home and immersed after the puja.",
    whenTe:
      "భాద్రపద శుద్ధ చతుర్థి నాడు (వినాయక చవితి). మట్టి విగ్రహాన్ని ఇంట్లో పూజించి, పూజ అనంతరం నిమజ్జనం చేస్తారు.",
    aboutEn: [
      "Vinayaka Chavithi celebrates the birth of Lord Ganesha, the remover of obstacles (Vighneshwara) and the deity worshipped first in any undertaking.",
      "He is offered 21 kinds of leaves (patri) and sweets such as undrallu and kudumulu, and the Vinayaka Vrata Katha is read.",
    ],
    aboutTe: [
      "వినాయక చవితి విఘ్నాలను తొలగించే విఘ్నేశ్వరుని జన్మదినం. ఏ పనైనా ప్రారంభంలో మొదట పూజించే దేవుడు గణపతి.",
      "ఆయనకు 21 రకాల పత్రి, ఉండ్రాళ్ళు, కుడుములు వంటి నైవేద్యాలు సమర్పించి, వినాయక వ్రత కథ చదువుతారు.",
    ],
    samagri: [
      COMMON_SAMAGRI,
      {
        titleEn: "For Vinayaka",
        titleTe: "వినాయక వ్రతానికి",
        items: [
          { en: "Clay Ganesha idol", te: "మట్టి వినాయక విగ్రహం" },
          { en: "21 patri (leaves) — esp. garika (bermuda grass)", te: "21 పత్రి — ముఖ్యంగా గరిక" },
          { en: "Undrallu, kudumulu / modak", te: "ఉండ్రాళ్ళు, కుడుములు / మోదకం" },
          { en: "Jilledu / red flowers", te: "జిల్లేడు / ఎర్ర పూలు" },
          { en: "Mandapam / decoration for the idol", te: "మండపం / అలంకరణ" },
        ],
      },
    ],
    festivalDate: "2026-09-14",
    festivalNameEn: "Vinayaka Chavithi",
    festivalNameTe: "వినాయక చవితి",
  },
  {
    slug: "satyanarayana",
    nameEn: "Sri Satyanarayana Vratam",
    nameTe: "శ్రీ సత్యనారాయణ వ్రతం",
    deityEn: "Lord Vishnu (Satyanarayana)",
    deityTe: "శ్రీ సత్యనారాయణ స్వామి",
    emoji: "🕉️",
    deckUrl: "https://rahulbalakavi.github.io/satyanarayana-vratam/",
    whenEn:
      "On any Pournami (full moon day) or Ekadashi, and on auspicious occasions — housewarmings, weddings, birthdays, or the fulfilment of a wish. Kartika and Vaishakha Pournami are especially favoured.",
    whenTe:
      "ఏ పౌర్ణమి లేదా ఏకాదశి నాడైనా; గృహప్రవేశం, వివాహం, పుట్టినరోజు, కోరిక నెరవేరినప్పుడు ఆచరిస్తారు. కార్తీక, వైశాఖ పౌర్ణములు విశేషం.",
    aboutEn: [
      "The Satyanarayana Vratam is a worship of Lord Vishnu as the embodiment of truth (satya). It is simple, can be performed by anyone, and is popular for thanksgiving and on auspicious occasions.",
      "The puja centres on reading the five chapters of the Satyanarayana Katha and offering sapatha prasadam made of rava, sugar, ghee and banana.",
    ],
    aboutTe: [
      "సత్యనారాయణ వ్రతం సత్య స్వరూపుడైన శ్రీమహావిష్ణువు ఆరాధన. చాలా సులభమైనది, ఎవరైనా ఆచరించవచ్చు; శుభకార్యాలలో, కృతజ్ఞతా సూచకంగా చేస్తారు.",
      "పూజలో సత్యనారాయణ కథ ఐదు అధ్యాయాలు చదివి, రవ్వ, పంచదార, నెయ్యి, అరటిపండుతో చేసిన ప్రసాదం సమర్పిస్తారు.",
    ],
    samagri: [
      COMMON_SAMAGRI,
      {
        titleEn: "For Satyanarayana",
        titleTe: "సత్యనారాయణ వ్రతానికి",
        items: [
          { en: "Satyanarayana Swamy framed picture", te: "సత్యనారాయణ స్వామి పటం" },
          { en: "Tulasi leaves", te: "తులసి దళాలు" },
          { en: "Banana stems & leaves for the mandapam", te: "మండపానికి అరటి బోదెలు & ఆకులు" },
          { en: "Sapatha prasadam: rava, sugar, ghee, banana", te: "ప్రసాదం: రవ్వ, పంచదార, నెయ్యి, అరటిపండు" },
          { en: "Panchamrutam: milk, curd, ghee, honey, sugar", te: "పంచామృతం: పాలు, పెరుగు, నెయ్యి, తేనె, పంచదార" },
        ],
      },
    ],
  },
  {
    slug: "venkateswara",
    nameEn: "Sri Venkateswara Vratam",
    nameTe: "శ్రీ వేంకటేశ్వర వ్రతం",
    deityEn: "Lord Venkateswara (Balaji)",
    deityTe: "శ్రీ వేంకటేశ్వర స్వామి",
    emoji: "🛕",
    deckUrl: "https://rahulbalakavi.github.io/sri-venkateswara-vratam/",
    whenEn:
      "On Saturdays — the Lord's special day — and on auspicious occasions, especially during the Tula / Purattasi masam (October). The Suprabhatam may be recited every morning.",
    whenTe:
      "శనివారం స్వామివారికి విశేషమైన రోజు; శుభ సందర్భాలలో, ముఖ్యంగా తులా మాసంలో ఆచరిస్తారు. ప్రతి ఉదయం సుప్రభాతం పఠించవచ్చు.",
    aboutEn: [
      "Sri Venkateswara Vratam is dedicated to Lord Venkateswara of Tirumala (Balaji), the Lord of the Seven Hills, who is worshipped for protection, prosperity and the fulfilment of vows.",
      "The vratam begins with the Suprabhatam to wake the Lord, followed by archana with tulasi and the offering of prasadam.",
    ],
    aboutTe: [
      "శ్రీ వేంకటేశ్వర వ్రతం తిరుమల ఏడుకొండలవాడైన శ్రీ వేంకటేశ్వర స్వామికి అంకితం. రక్షణ, సంపద, మొక్కుల నెరవేర్పు కోసం ఆరాధిస్తారు.",
      "వ్రతం స్వామిని మేల్కొలిపే సుప్రభాతంతో మొదలై, తులసితో అర్చన, ప్రసాద సమర్పణతో సాగుతుంది.",
    ],
    samagri: [
      COMMON_SAMAGRI,
      {
        titleEn: "For Venkateswara",
        titleTe: "వేంకటేశ్వర వ్రతానికి",
        items: [
          { en: "Venkateswara / Balaji framed picture", te: "వేంకటేశ్వర స్వామి పటం" },
          { en: "Tulasi garland & leaves", te: "తులసి మాల & దళాలు" },
          { en: "Saffron, sandal & vermilion (namam)", te: "కుంకుమపువ్వు, గంధం & నామం" },
          { en: "Jaggery / sugar & dry fruits for prasadam", te: "బెల్లం / పంచదార & ప్రసాదానికి డ్రై ఫ్రూట్స్" },
          { en: "Bell for the Suprabhatam seva", te: "సుప్రభాత సేవకు గంట" },
        ],
      },
    ],
  },
];

/** Vratham whose festival falls on the given YYYY-MM-DD (for the day-of banner). */
export function vrathamForDate(dateStr?: string): Vratham | undefined {
  if (!dateStr) return undefined;
  return VRATHAMS.find((v) => v.festivalDate === dateStr);
}

export function vrathamBySlug(slug: string): Vratham | undefined {
  return VRATHAMS.find((v) => v.slug === slug);
}
