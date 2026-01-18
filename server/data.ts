import type { Festival, TempleEvent, NotificationPreference } from "@shared/schema";

export const festivals: Festival[] = [
  {
    id: "ugadi-2026",
    name: "Ugadi",
    nameTelugu: "ఉగాది",
    date: "2026-03-29",
    description: "Telugu New Year - Beginning of Chaitra month. People prepare Ugadi Pachadi symbolizing the different tastes of life.",
    descriptionTelugu: "తెలుగు సంవత్సరాది. చైత్ర మాసం ప్రారంభం. ఉగాది పచ్చడి తయారీ.",
    type: "major",
    relatedTithi: "Pratipada",
  },
  {
    id: "sri-rama-navami-2026",
    name: "Sri Rama Navami",
    nameTelugu: "శ్రీ రామ నవమి",
    date: "2026-04-06",
    description: "Birthday of Lord Rama, the seventh avatar of Vishnu. Celebrated with prayers and bhajans.",
    descriptionTelugu: "శ్రీరాముని జన్మదినం. విష్ణువు ఏడవ అవతారం.",
    type: "major",
    relatedTithi: "Navami",
  },
  {
    id: "hanuman-jayanti-2026",
    name: "Hanuman Jayanti",
    nameTelugu: "హనుమాన్ జయంతి",
    date: "2026-04-14",
    description: "Birthday of Lord Hanuman, the devoted servant of Lord Rama.",
    descriptionTelugu: "హనుమంతుని జన్మదినం. శ్రీరాముని భక్తుడు.",
    type: "major",
    relatedTithi: "Purnima",
  },
  {
    id: "varalakshmi-vratam-2026",
    name: "Varalakshmi Vratam",
    nameTelugu: "వరలక్ష్మీ వ్రతం",
    date: "2026-08-07",
    description: "Worship of Goddess Lakshmi for prosperity and well-being. Observed by married women.",
    descriptionTelugu: "లక్ష్మీదేవి పూజ. సౌభాగ్యం కోసం వ్రతం.",
    type: "major",
    relatedTithi: "Purnima",
  },
  {
    id: "vinayaka-chavithi-2026",
    name: "Vinayaka Chavithi",
    nameTelugu: "వినాయక చవితి",
    date: "2026-08-27",
    description: "Birthday of Lord Ganesha. Ten-day festival with clay idol worship and immersion.",
    descriptionTelugu: "గణపతి జన్మదినం. పది రోజుల పండుగ.",
    type: "major",
    relatedTithi: "Chaturthi",
  },
  {
    id: "dussehra-2026",
    name: "Dussehra / Vijayadashami",
    nameTelugu: "దసరా / విజయదశమి",
    date: "2026-10-02",
    description: "Victory of good over evil. Celebrates Goddess Durga's victory and Lord Rama's victory over Ravana.",
    descriptionTelugu: "చెడుపై మంచి విజయం. దుర్గాదేవి మరియు రాముని విజయం.",
    type: "major",
    relatedTithi: "Dashami",
  },
  {
    id: "deepavali-2026",
    name: "Deepavali",
    nameTelugu: "దీపావళి",
    date: "2026-10-20",
    description: "Festival of Lights. Celebrates the victory of light over darkness and knowledge over ignorance.",
    descriptionTelugu: "దీపాల పండుగ. చీకటిపై వెలుగు విజయం.",
    type: "major",
    relatedTithi: "Amavasya",
  },
  {
    id: "kartika-purnima-2026",
    name: "Kartika Purnima",
    nameTelugu: "కార్తీక పూర్ణిమ",
    date: "2026-11-04",
    description: "Sacred full moon in Kartika month. Devotees light lamps and take holy baths.",
    descriptionTelugu: "కార్తీక మాసంలో పౌర్ణమి. దీపాలు వెలిగించడం.",
    type: "major",
    relatedTithi: "Purnima",
  },
  {
    id: "makara-sankranti-2026",
    name: "Makara Sankranti",
    nameTelugu: "మకర సంక్రాంతి",
    date: "2026-01-14",
    description: "Harvest festival marking the sun's transition into Makara. Celebrated with kite flying and traditional sweets.",
    descriptionTelugu: "పంట పండుగ. సూర్యుడు మకర రాశిలో ప్రవేశం.",
    type: "major",
  },
  {
    id: "maha-shivaratri-2026",
    name: "Maha Shivaratri",
    nameTelugu: "మహా శివరాత్రి",
    date: "2026-02-15",
    description: "Great night of Lord Shiva. Devotees observe fasting and night-long vigil.",
    descriptionTelugu: "శివుని గొప్ప రాత్రి. ఉపవాసం మరియు జాగారం.",
    type: "major",
    relatedTithi: "Chaturdashi",
  },
  {
    id: "holi-2026",
    name: "Holi",
    nameTelugu: "హోలీ",
    date: "2026-03-11",
    description: "Festival of Colors. Celebrates the divine love of Radha and Krishna.",
    descriptionTelugu: "రంగుల పండుగ. రాధాకృష్ణుల ప్రేమ.",
    type: "major",
    relatedTithi: "Purnima",
  },
  {
    id: "nagula-chavithi-2026",
    name: "Nagula Chavithi",
    nameTelugu: "నాగుల చవితి",
    date: "2026-10-24",
    description: "Worship of serpent deities. Devotees offer milk and prayers to snake idols.",
    descriptionTelugu: "నాగ దేవతల పూజ. పాము విగ్రహాలకు పాలు.",
    type: "minor",
    relatedTithi: "Chaturthi",
  },
  {
    id: "ekadashi-special-2026",
    name: "Vaikunta Ekadashi",
    nameTelugu: "వైకుంఠ ఏకాదశి",
    date: "2026-01-01",
    description: "Most auspicious Ekadashi. Gate of Vaikunta opens on this day.",
    descriptionTelugu: "అత్యంత పవిత్ర ఏకాదశి. వైకుంఠ ద్వారం తెరుచుకుంటుంది.",
    type: "major",
    relatedTithi: "Ekadashi",
  },
];

export const templeEvents: TempleEvent[] = [
  {
    id: "tirumala-brahmotsavam-2026",
    templeName: "Tirumala Tirupati Temple",
    templeNameTelugu: "తిరుమల తిరుపతి దేవస్థానం",
    location: "Tirupati, Andhra Pradesh",
    locationTelugu: "తిరుపతి, ఆంధ్రప్రదేశ్",
    eventName: "Annual Brahmotsavam",
    eventNameTelugu: "వార్షిక బ్రహ్మోత్సవాలు",
    description: "Nine-day grand festival of Lord Venkateswara with special processions and rituals.",
    descriptionTelugu: "శ్రీ వేంకటేశ్వరుని తొమ్మిది రోజుల ఉత్సవాలు. ప్రత్యేక వాహన సేవలు.",
    startDate: "2026-09-27",
    endDate: "2026-10-05",
  },
  {
    id: "tirumala-vaikunta-ekadashi-2026",
    templeName: "Tirumala Tirupati Temple",
    templeNameTelugu: "తిరుమల తిరుపతి దేవస్థానం",
    location: "Tirupati, Andhra Pradesh",
    locationTelugu: "తిరుపతి, ఆంధ్రప్రదేశ్",
    eventName: "Vaikunta Dwara Darshanam",
    eventNameTelugu: "వైకుంఠ ద్వార దర్శనం",
    description: "Special darshan through the Vaikunta Dwaram during Dhanurmasa.",
    descriptionTelugu: "ధనుర్మాసంలో వైకుంఠ ద్వారం ద్వారా ప్రత్యేక దర్శనం.",
    startDate: "2026-01-01",
    endDate: "2026-01-11",
  },
  {
    id: "srisailam-shivaratri-2026",
    templeName: "Srisailam Mallikarjuna Temple",
    templeNameTelugu: "శ్రీశైలం మల్లికార్జున దేవస్థానం",
    location: "Srisailam, Andhra Pradesh",
    locationTelugu: "శ్రీశైలం, ఆంధ్రప్రదేశ్",
    eventName: "Maha Shivaratri Celebrations",
    eventNameTelugu: "మహా శివరాత్రి ఉత్సవాలు",
    description: "Grand celebration at one of the 12 Jyotirlingas with special abhishekam and cultural programs.",
    descriptionTelugu: "12 జ్యోతిర్లింగాలలో ఒకటైన శ్రీశైలంలో ఘన వేడుకలు.",
    startDate: "2026-02-14",
    endDate: "2026-02-15",
  },
  {
    id: "bhadrachalam-sita-rama-kalyanam-2026",
    templeName: "Bhadrachalam Sri Sita Ramachandra Temple",
    templeNameTelugu: "భద్రాచలం సీతారామచంద్ర దేవస్థానం",
    location: "Bhadrachalam, Telangana",
    locationTelugu: "భద్రాచలం, తెలంగాణ",
    eventName: "Sri Rama Navami - Sita Rama Kalyanam",
    eventNameTelugu: "శ్రీ రామ నవమి - సీతారామ కళ్యాణం",
    description: "Grand celestial wedding ceremony of Lord Rama and Goddess Sita attended by millions.",
    descriptionTelugu: "సీతారాముల కళ్యాణ మహోత్సవం. లక్షలాది భక్తుల సమక్షంలో.",
    startDate: "2026-04-05",
    endDate: "2026-04-06",
  },
  {
    id: "kanipakam-brahmotsavam-2026",
    templeName: "Kanipakam Varasidhi Vinayaka Temple",
    templeNameTelugu: "కాణిపాకం వరసిద్ధి వినాయక దేవస్థానం",
    location: "Kanipakam, Andhra Pradesh",
    locationTelugu: "కాణిపాకం, ఆంధ్రప్రదేశ్",
    eventName: "Vinayaka Chavithi Brahmotsavam",
    eventNameTelugu: "వినాయక చవితి బ్రహ్మోత్సవాలు",
    description: "11-day grand festival at the famous Swayambhu Ganesh temple with special processions.",
    descriptionTelugu: "స్వయంభూ గణపతి ఆలయంలో 11 రోజుల బ్రహ్మోత్సవాలు.",
    startDate: "2026-08-27",
    endDate: "2026-09-06",
  },
  {
    id: "simhachalam-chandanotsavam-2026",
    templeName: "Simhachalam Varaha Lakshmi Narasimha Temple",
    templeNameTelugu: "సింహాచలం వరాహ లక్ష్మీ నరసింహ దేవస్థానం",
    location: "Visakhapatnam, Andhra Pradesh",
    locationTelugu: "విశాఖపట్నం, ఆంధ్రప్రదేశ్",
    eventName: "Chandanotsavam",
    eventNameTelugu: "చందనోత్సవం",
    description: "Annual festival when the sandalwood paste covering the deity is removed for one day.",
    descriptionTelugu: "వార్షిక ఉత్సవం. స్వామి వారి చందనం తీసి నిజరూప దర్శనం.",
    startDate: "2026-05-09",
    endDate: "2026-05-09",
  },
  {
    id: "yadagirigutta-brahmotsavam-2026",
    templeName: "Yadagirigutta Sri Lakshmi Narasimha Temple",
    templeNameTelugu: "యాదగిరిగుట్ట శ్రీ లక్ష్మీ నరసింహ దేవస్థానం",
    location: "Yadagirigutta, Telangana",
    locationTelugu: "యాదగిరిగుట్ట, తెలంగాణ",
    eventName: "Annual Brahmotsavam",
    eventNameTelugu: "వార్షిక బ్రహ్మోత్సవాలు",
    description: "Nine-day grand festival with special sevas and processions.",
    descriptionTelugu: "తొమ్మిది రోజుల ఘన ఉత్సవాలు. ప్రత్యేక సేవలు.",
    startDate: "2026-02-28",
    endDate: "2026-03-08",
  },
  {
    id: "basara-saraswathi-puja-2026",
    templeName: "Basara Gnana Saraswathi Temple",
    templeNameTelugu: "బాసర జ్ఞాన సరస్వతి దేవస్థానం",
    location: "Basara, Telangana",
    locationTelugu: "బాసర, తెలంగాణ",
    eventName: "Vasant Panchami - Aksharabhyasam",
    eventNameTelugu: "వసంత పంచమి - అక్షరాభ్యాసం",
    description: "Auspicious day for initiating children into learning. Special pujas for education.",
    descriptionTelugu: "పిల్లలకు అక్షరాభ్యాసం చేయించే శుభదినం.",
    startDate: "2026-02-02",
    endDate: "2026-02-02",
  },
  {
    id: "puri-rath-yatra-2026",
    templeName: "Jagannath Temple",
    templeNameTelugu: "జగన్నాథ దేవాలయం",
    location: "Puri, Odisha",
    locationTelugu: "పూరీ, ఒడిషా",
    eventName: "Rath Yatra",
    eventNameTelugu: "రథ యాత్ర",
    description: "Annual chariot festival of Lord Jagannath, Balabhadra and Subhadra.",
    descriptionTelugu: "జగన్నాథ, బలభద్ర, సుభద్ర రథ యాత్ర.",
    startDate: "2026-07-01",
    endDate: "2026-07-10",
  },
  {
    id: "kashi-dev-deepawali-2026",
    templeName: "Kashi Vishwanath Temple",
    templeNameTelugu: "కాశీ విశ్వనాథ దేవాలయం",
    location: "Varanasi, Uttar Pradesh",
    locationTelugu: "వారణాసి, ఉత్తర ప్రదేశ్",
    eventName: "Dev Deepawali",
    eventNameTelugu: "దేవ్ దీపావళి",
    description: "Festival of lights celebrated on Kartik Purnima when gods descend to bathe in the Ganges.",
    descriptionTelugu: "కార్తీక పూర్ణిమ నాడు దేవతలు గంగలో స్నానం చేస్తారని నమ్మకం.",
    startDate: "2026-11-04",
    endDate: "2026-11-04",
  },
];

let notificationPreferences: NotificationPreference = {
  id: "default",
  enabled: false,
  notifyEkadashi: true,
  notifyChaturthi: true,
  notifyPurnima: true,
  notifyAmavasya: true,
  notifyTempleEvents: true,
  notifyTime: "06:00",
};

export function getNotificationPreferences(): NotificationPreference {
  return notificationPreferences;
}

export function setNotificationPreferences(prefs: Omit<NotificationPreference, "id">): NotificationPreference {
  notificationPreferences = { ...prefs, id: "default" };
  return notificationPreferences;
}

export function getUpcomingFestivals(limit: number = 10): Festival[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return festivals
    .filter((f) => new Date(f.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

export function getFestivalsForDate(date: Date): Festival[] {
  const dateStr = date.toISOString().split("T")[0];
  return festivals.filter((f) => f.date === dateStr);
}

export function getUpcomingTempleEvents(limit: number = 10): TempleEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return templeEvents
    .filter((e) => new Date(e.endDate || e.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, limit);
}

export function getTempleEventsForDate(date: Date): TempleEvent[] {
  const dateTime = date.getTime();
  
  return templeEvents.filter((e) => {
    const startTime = new Date(e.startDate).getTime();
    const endTime = new Date(e.endDate || e.startDate).getTime();
    return dateTime >= startTime && dateTime <= endTime;
  });
}
