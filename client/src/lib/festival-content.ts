// Rich content for festival/event detail pages: a hero image, a longer
// background, and a link to the associated vratham (puja) when one exists.
// Images are served from the hosted deck sites (the user's own GitHub Pages).

const IMG = "https://rahulbalakavi.github.io/satyanarayana-vratam/img";

export interface FestivalContent {
  image: string;
  aboutEn: string[];
  aboutTe: string[];
  /** Slug of the vratham (puja) performed for this festival, if any. */
  vrathamSlug?: string;
}

/** Used when a festival has no specific entry below. */
export const FALLBACK_IMAGE = `${IMG}/lamp.jpg`;

// Keyed by the festival id with the trailing year removed (e.g. "deepavali").
const CONTENT: Record<string, FestivalContent> = {
  "varalakshmi-vratam": {
    image: `${IMG}/lotus.jpg`,
    aboutEn: [
      "Varalakshmi Vratam is one of the most important observances for married women, dedicated to Goddess Lakshmi — the giver of boons (vara) and the embodiment of wealth, health and prosperity.",
      "On this day a decorated kalasham is invoked as the Goddess and worshipped at home, and a sacred turmeric thread is tied on the wrist. Worshipping her is said to equal the worship of all eight Lakshmis.",
    ],
    aboutTe: [
      "వరలక్ష్మీ వ్రతం సుమంగళులు ఆచరించే ముఖ్యమైన పండుగ. వరాలను ప్రసాదించే, సంపద-ఆరోగ్య-సౌభాగ్యాల స్వరూపమైన లక్ష్మీ దేవికి అంకితం.",
      "ఈ రోజు అలంకరించిన కలశంలో అమ్మవారిని ఆవాహన చేసి పూజించి, చేతికి పసుపు తోరం కడతారు. ఈ పూజ అష్టలక్ష్ముల ఆరాధనతో సమానమని చెబుతారు.",
    ],
    vrathamSlug: "varalakshmi",
  },
  "vinayaka-chavithi": {
    image: `${IMG}/ganesha.jpg`,
    aboutEn: [
      "Vinayaka Chavithi celebrates the birth of Lord Ganesha, the remover of obstacles (Vighneshwara), worshipped first before any auspicious undertaking.",
      "A clay idol is installed and worshipped at home with 21 kinds of leaves and sweets like undrallu and kudumulu, and is immersed after the puja and the Vinayaka Vrata Katha.",
    ],
    aboutTe: [
      "వినాయక చవితి విఘ్నాలను తొలగించే విఘ్నేశ్వరుని జన్మదినం. ఏ శుభకార్యానికైనా ముందు మొదట పూజించే దేవుడు గణపతి.",
      "ఇంట్లో మట్టి విగ్రహాన్ని ప్రతిష్ఠించి 21 రకాల పత్రి, ఉండ్రాళ్ళు, కుడుములతో పూజించి, వ్రత కథ అనంతరం నిమజ్జనం చేస్తారు.",
    ],
    vrathamSlug: "vinayaka",
  },
  "dussehra": {
    image: `${IMG}/gopuram.jpg`,
    aboutEn: [
      "Dussehra (Vijayadashami) marks the victory of good over evil — the triumph of Goddess Durga over Mahishasura and of Lord Rama over Ravana.",
      "It is celebrated as the most auspicious day to begin new ventures, learning and the worship of weapons and tools (Ayudha Puja).",
    ],
    aboutTe: [
      "దసరా (విజయదశమి) చెడుపై మంచి సాధించిన విజయానికి ప్రతీక — దుర్గాదేవి మహిషాసురునిపై, శ్రీరాముడు రావణునిపై సాధించిన విజయం.",
      "కొత్త పనులు, విద్యాభ్యాసం ప్రారంభించడానికి, ఆయుధ పూజకు అత్యంత శుభప్రదమైన రోజుగా జరుపుకుంటారు.",
    ],
  },
  "deepavali": {
    image: `${IMG}/lamp.jpg`,
    aboutEn: [
      "Deepavali, the festival of lights, celebrates the victory of light over darkness and knowledge over ignorance.",
      "Homes are lit with rows of lamps, Goddess Lakshmi is worshipped for prosperity, and the day is filled with sweets, new clothes and fireworks.",
    ],
    aboutTe: [
      "దీపావళి దీపాల పండుగ — చీకటిపై వెలుగు, అజ్ఞానంపై జ్ఞానం సాధించిన విజయానికి ప్రతీక.",
      "ఇళ్ళను దీపాల వరుసలతో అలంకరించి, సంపద కోసం లక్ష్మీ దేవిని పూజించి, తీపి-కొత్త బట్టలు-బాణసంచాతో జరుపుకుంటారు.",
    ],
  },
  "ugadi": {
    image: `${IMG}/manuscript.jpg`,
    aboutEn: [
      "Ugadi marks the Telugu New Year — the beginning of a new samvatsara. The day starts with an oil bath, new clothes and the reading of the year's panchangam (panchanga sravanam).",
      "Ugadi pachadi, blending six tastes, is shared as a reminder that the coming year holds all the flavours of life.",
    ],
    aboutTe: [
      "ఉగాది తెలుగు సంవత్సరాది — కొత్త సంవత్సర ఆరంభం. తైలాభ్యంగన స్నానం, కొత్త బట్టలు, పంచాంగ శ్రవణంతో రోజు మొదలవుతుంది.",
      "ఆరు రుచుల కలయికైన ఉగాది పచ్చడి జీవితంలోని అన్ని అనుభవాలకు ప్రతీకగా పంచుకుంటారు.",
    ],
  },
  "makara-sankranti": {
    image: `${IMG}/prasadam.jpg`,
    aboutEn: [
      "Makara Sankranti is the harvest festival, marking the sun's transit into Capricorn (Makara) and the start of its northward journey (Uttarayana).",
      "Celebrated over three days — Bhogi, Sankranti and Kanuma — with bonfires, rangoli, sweets made of sesame and jaggery, and gratitude to cattle and the harvest.",
    ],
    aboutTe: [
      "మకర సంక్రాంతి పంట పండుగ — సూర్యుడు మకర రాశిలోకి ప్రవేశించి ఉత్తరాయణం ప్రారంభమయ్యే రోజు.",
      "భోగి, సంక్రాంతి, కనుమ — మూడు రోజులు భోగి మంటలు, ముగ్గులు, నువ్వులు-బెల్లం తీపి, పశువుల పూజతో జరుపుకుంటారు.",
    ],
  },
  "maha-shivaratri": {
    image: `${IMG}/temple.jpg`,
    aboutEn: [
      "Maha Shivaratri, the great night of Lord Shiva, is observed with fasting, an all-night vigil (jagarana) and the chanting of Om Namah Shivaya.",
      "Devotees offer bilva leaves and perform abhishekam to the Shiva linga through the four quarters of the night.",
    ],
    aboutTe: [
      "మహా శివరాత్రి పరమశివుని మహా రాత్రి — ఉపవాసం, రాత్రి జాగరణ, ఓం నమః శివాయ జపంతో ఆచరిస్తారు.",
      "భక్తులు బిల్వ దళాలు సమర్పించి, నాలుగు యామాలలో శివలింగానికి అభిషేకం చేస్తారు.",
    ],
  },
  "sri-rama-navami": {
    image: `${IMG}/gopuram.jpg`,
    aboutEn: [
      "Sri Rama Navami celebrates the birth of Lord Rama, the seventh avatar of Vishnu and the embodiment of dharma.",
      "The day is marked by the Sita Rama Kalyanam (celestial wedding), recitation of the Ramayana and distribution of panakam and vada pappu.",
    ],
    aboutTe: [
      "శ్రీ రామ నవమి విష్ణువు ఏడవ అవతారం, ధర్మ స్వరూపుడైన శ్రీరాముని జన్మదినం.",
      "సీతారాముల కల్యాణం, రామాయణ పారాయణం, పానకం-వడపప్పు పంపిణీతో జరుపుకుంటారు.",
    ],
  },
  "hanuman-jayanti": {
    image: `${IMG}/temple.jpg`,
    aboutEn: [
      "Hanuman Jayanti celebrates the birth of Lord Hanuman, the devoted servant of Rama and the symbol of strength, courage and selfless devotion.",
    ],
    aboutTe: [
      "హనుమాన్ జయంతి శ్రీరాముని పరమ భక్తుడు, బలం-ధైర్యం-నిష్కామ భక్తికి ప్రతీక అయిన ఆంజనేయుని జన్మదినం.",
    ],
  },
  "ekadashi-special": {
    image: `${IMG}/vishnu.jpg`,
    aboutEn: [
      "Vaikunta Ekadashi is the most sacred of all Ekadashis, when the Vaikunta Dwaram (gateway to heaven) is believed to open.",
      "Devotees fast, stay awake through the night, and pass through the Uttara Dwaram at Vishnu temples such as Tirumala.",
    ],
    aboutTe: [
      "వైకుంఠ ఏకాదశి అన్ని ఏకాదశులలో అత్యంత పవిత్రమైనది — ఈ రోజు వైకుంఠ ద్వారం తెరుచుకుంటుందని నమ్ముతారు.",
      "భక్తులు ఉపవాసం, రాత్రి జాగరణ చేసి, తిరుమల వంటి విష్ణు ఆలయాలలో ఉత్తర ద్వారం గుండా దర్శనం చేసుకుంటారు.",
    ],
  },
  "kartika-purnima": {
    image: `${IMG}/lamp.jpg`,
    aboutEn: [
      "Kartika Purnima, the full moon of the sacred month of Kartika, is celebrated by lighting rows of lamps and floating them on rivers.",
      "It is especially auspicious for worship of Lord Shiva and Vishnu and for charity and holy baths.",
    ],
    aboutTe: [
      "కార్తీక పౌర్ణమి పవిత్ర కార్తీక మాసంలోని పూర్ణిమ — దీపాల వరుసలు వెలిగించి నదులలో దీపాలు వదులుతారు.",
      "శివ-కేశవుల ఆరాధనకు, దానధర్మాలకు, పుణ్యస్నానాలకు విశేషమైన రోజు.",
    ],
  },
  "vasant-panchami": {
    image: `${IMG}/lotus.jpg`,
    aboutEn: [
      "Vasant Panchami heralds the arrival of spring and is dedicated to Goddess Saraswati, the deity of knowledge, music and the arts.",
    ],
    aboutTe: [
      "వసంత పంచమి వసంత ఋతువు ఆగమనానికి, విద్య-సంగీత-కళల అధిదేవత సరస్వతీ దేవికి అంకితమైన పండుగ.",
    ],
  },
  holi: {
    image: `${IMG}/lotus.jpg`,
    aboutEn: [
      "Holi, the festival of colours, celebrates the arrival of spring and the triumph of devotion, recalling the story of Prahlada and Holika.",
    ],
    aboutTe: [
      "హోలీ రంగుల పండుగ — వసంత ఆగమనానికి, ప్రహ్లాద-హోలిక కథను స్మరిస్తూ భక్తి విజయానికి ప్రతీక.",
    ],
  },
  "akshaya-tritiya": {
    image: `${IMG}/lotus.jpg`,
    aboutEn: [
      "Akshaya Tritiya is considered one of the most auspicious days of the year, when any venture begun or charity given is believed to bring everlasting (akshaya) results.",
    ],
    aboutTe: [
      "అక్షయ తృతీయ సంవత్సరంలోని అత్యంత శుభప్రదమైన రోజులలో ఒకటి — ఈ రోజు ప్రారంభించిన పని, చేసిన దానం అక్షయ ఫలితాలనిస్తుందని నమ్ముతారు.",
    ],
  },
  "nagula-chavithi": {
    image: `${IMG}/temple.jpg`,
    aboutEn: [
      "Nagula Chavithi is observed to worship the serpent gods (Naga devatas) for the well-being and protection of one's children and family.",
    ],
    aboutTe: [
      "నాగుల చవితి సంతాన క్షేమం, కుటుంబ రక్షణ కోసం నాగ దేవతలను ఆరాధించే పండుగ.",
    ],
  },
};

export function festivalContent(id: string): FestivalContent | undefined {
  const key = id.replace(/-\d{4}$/, "");
  return CONTENT[key];
}

export function festivalImage(id: string): string {
  return festivalContent(id)?.image ?? FALLBACK_IMAGE;
}
