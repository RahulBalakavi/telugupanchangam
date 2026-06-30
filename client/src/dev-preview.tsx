/**
 * DEV-ONLY auth-free preview entry.
 *
 * Renders the REAL <App/> (home page, tabs, modal, settings — everything) with
 * the network mocked, so the UI can be previewed without the Express server,
 * Postgres, or Replit/Google auth.
 *
 *   npx vite                      # then open http://localhost:5173/preview.html
 *
 * It installs a window.fetch shim that answers /api/* with static fixtures.
 * Not referenced by index.html / main.tsx, so it never ships in the prod build.
 */
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import type {
  PanchangData,
  CalendarDay,
  Festival,
  TempleEvent,
  NotificationPreference,
} from "@shared/schema";

const mockUser = {
  id: "preview-user",
  email: "preview@example.com",
  firstName: "Preview",
  lastName: "User",
  profileImageUrl: null,
};

const basePanchang: PanchangData = {
  date: "2026-06-29", teluguDate: 5, teluguMonth: "ఆషాఢం", teluguMonthEnglish: "Ashadha",
  isAdhikaMasa: false, teluguYear: 1948, samvatsaraName: "Vishvavasu", samvatsaraNameTelugu: "విశ్వావసు",
  tithi: "Shukla Panchami", tithiTelugu: "శుద్ధ పంచమి", tithiNumber: 5, tithiStartTime: "06:12", tithiEndTime: "04:48 (+1)",
  paksha: "Shukla", pakshaTelugu: "శుద్ధ", nakshatra: "Magha", nakshatraTelugu: "మఘ",
  nakshatraStartTime: "08:30", nakshatraEndTime: "06:05 (+1)", sunrise: "05:52", sunset: "18:48",
  timezone: "Asia/Kolkata", moonPhase: 0.18, isSpecialDay: true, specialDayInfo: "Auspicious Day", specialDayInfoTelugu: "శుభ దినం",
};

const tithiNames = ["పాడ్యమి","విదియ","తదియ","చవితి","పంచమి","షష్ఠి","సప్తమి","అష్టమి","నవమి","దశమి","ఏకాదశి","ద్వాదశి","త్రయోదశి","చతుర్దశి","పౌర్ణమి","పాడ్యమి","విదియ","తదియ","చవితి","పంచమి","షష్ఠి","సప్తమి","అష్టమి","నవమి","దశమి","ఏకాదశి","ద్వాదశి","త్రయోదశి","చతుర్దశి","అమావాస్య"];

const festivals: Festival[] = [
  { id: "1", name: "Varalakshmi Vratam", nameTelugu: "వరలక్ష్మీ వ్రతం", date: "2026-08-08", description: "Worship of Goddess Lakshmi for prosperity and well-being.", descriptionTelugu: "సంపద కోసం లక్ష్మీ దేవి ఆరాధన.", type: "major" },
  { id: "2", name: "Vinayaka Chavithi", nameTelugu: "వినాయక చవితి", date: "2026-08-27", description: "Birth of Lord Ganesha, the remover of obstacles.", descriptionTelugu: "విఘ్నేశ్వరుని జన్మదినం.", type: "major" },
  { id: "3", name: "Dussehra", nameTelugu: "విజయదశమి", date: "2026-10-01", description: "Celebrates the victory of good over evil.", descriptionTelugu: "చెడుపై మంచి విజయాన్ని జరుపుకుంటారు.", type: "major" },
  { id: "4", name: "Deepavali", nameTelugu: "దీపావళి", date: "2026-10-20", description: "The festival of lights.", descriptionTelugu: "దీపాల పండుగ.", type: "major" },
];

const templeEvents: TempleEvent[] = [
  { id: "t1", templeName: "Tirumala", templeNameTelugu: "తిరుమల", location: "Andhra Pradesh", locationTelugu: "ఆంధ్రప్రదేశ్", eventName: "Brahmotsavam", eventNameTelugu: "బ్రహ్మోత్సవం", description: "Annual nine-day festival at Sri Venkateswara temple.", descriptionTelugu: "శ్రీ వేంకటేశ్వర స్వామి వార్షిక బ్రహ్మోత్సవాలు.", startDate: "2026-09-22", endDate: "2026-09-30" },
  { id: "t2", templeName: "Srisailam", templeNameTelugu: "శ్రీశైలం", location: "Andhra Pradesh", locationTelugu: "ఆంధ్రప్రదేశ్", eventName: "Maha Shivaratri", eventNameTelugu: "మహా శివరాత్రి", description: "Grand celebration at Mallikarjuna Jyotirlinga.", descriptionTelugu: "మల్లికార్జున జ్యోతిర్లింగ క్షేత్రంలో వేడుకలు.", startDate: "2026-02-15" },
];

const preferences: NotificationPreference = {
  id: "pref-1", enabled: false, notifyEkadashi: true, notifyChaturthi: true, notifyShashthi: false,
  notifyAshtami: false, notifyPurnima: true, notifyAmavasya: true, notifyTempleEvents: true, notifyTime: "06:00",
};

function buildCalendar(year: number, month: number) {
  const startDow = new Date(year, month, 1).getDay();
  const days: CalendarDay[] = [];
  const festByDay: Record<string, Festival[]> = {};
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;
    const date = new Date(year, month, dayNum);
    const inMonth = date.getMonth() === month;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const isToday = inMonth && date.getFullYear() === 2026 && date.getMonth() === 5 && date.getDate() === 29;
    const special = inMonth && dayNum % 6 === 0;
    days.push({
      date: iso as unknown as Date,
      isCurrentMonth: inMonth,
      isToday,
      panchang: inMonth
        ? { ...basePanchang, date: iso, teluguDate: ((dayNum + 1) % 30) || 30, tithiTelugu: tithiNames[dayNum % 30], isSpecialDay: special, specialDayInfo: special ? "Ekadashi" : undefined }
        : undefined,
      festivals: festByDay[iso] || [],
      templeEvents: [],
    });
  }
  return { days, festivals, templeEvents };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  let path = url;
  let timezone = "Asia/Kolkata";
  try {
    const parsed = new URL(url, window.location.origin);
    path = parsed.pathname;
    timezone = parsed.searchParams.get("timezone") || timezone;
  } catch {
    /* keep raw */
  }

  if (path.startsWith("/api/")) {
    const method = (init?.method || "GET").toUpperCase();
    if (method !== "GET") return jsonResponse({ ok: true });

    if (path === "/api/auth/user") return jsonResponse(mockUser);
    if (path.startsWith("/api/panchang/")) return jsonResponse({ ...basePanchang, timezone });
    if (path.startsWith("/api/calendar/")) {
      const m = path.match(/\/api\/calendar\/(\d+)\/(\d+)/);
      const year = m ? parseInt(m[1], 10) : 2026;
      const month = m ? parseInt(m[2], 10) : 5;
      return jsonResponse(buildCalendar(year, month));
    }
    if (path.startsWith("/api/festivals")) return jsonResponse(festivals);
    if (path.startsWith("/api/temple-events")) return jsonResponse(templeEvents);
    if (path.startsWith("/api/notifications/preferences")) return jsonResponse(preferences);
    if (path.startsWith("/api/push/vapid-public-key")) return jsonResponse({ publicKey: "" });
    return jsonResponse({});
  }

  return realFetch(input as RequestInfo, init);
};

// The router (wouter) matches on location.pathname; rewrite "/preview.html"
// to "/" without reloading so the Home route renders.
window.history.replaceState(null, "", "/");

createRoot(document.getElementById("root")!).render(<App />);
