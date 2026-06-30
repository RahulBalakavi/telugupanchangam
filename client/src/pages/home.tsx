import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TodayPanchang } from "@/components/today-panchang";
import { Sankalpam } from "@/components/sankalpam";
import { CalendarGrid } from "@/components/calendar-grid";
import { FestivalsList } from "@/components/festivals-list";
import { TempleEvents } from "@/components/temple-events";
import { NotificationSettings } from "@/components/notification-settings";
import { DayDetailModal } from "@/components/day-detail-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimezoneSelector, getStoredTimezone, setStoredTimezone } from "@/components/timezone-selector";
import { LanguageSelector } from "@/components/language-selector";
import { InstallBanner } from "@/components/install-banner";
import { VrathamsList } from "@/components/vrathams-list";
import { VrathamDetail } from "@/components/vratham-detail";
import { FestivalBanner } from "@/components/festival-banner";
import { FestivalDetail } from "@/components/festival-detail";
import { ChatWidget } from "@/components/chat-widget";
import { vrathamForDate, vrathamBySlug, type Vratham } from "@/lib/vrathams";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Bell, Sparkles, LogOut, Settings, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/lib/theme-provider";
import type { CalendarDay, PanchangData, Festival, TempleEvent, NotificationPreference } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { setDaylight } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [timezone, setTimezone] = useState(getStoredTimezone());
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedVratham, setSelectedVratham] = useState<Vratham | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    setStoredTimezone(newTimezone);
    queryClient.invalidateQueries({ queryKey: ["/api/panchang"] });
    queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
  };

  const { data: todayPanchang, isLoading: loadingToday } = useQuery<PanchangData>({
    queryKey: ["/api/panchang/today", timezone],
    queryFn: async () => {
      const res = await fetch(`/api/panchang/today?timezone=${encodeURIComponent(timezone)}`);
      if (!res.ok) throw new Error("Failed to fetch panchang");
      return res.json();
    },
  });

  const { data: monthData, isLoading: loadingMonth } = useQuery<{
    days: CalendarDay[];
    festivals: Festival[];
    templeEvents: TempleEvent[];
  }>({
    queryKey: ["/api/calendar", currentMonth.getFullYear(), currentMonth.getMonth(), timezone],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/${currentMonth.getFullYear()}/${currentMonth.getMonth()}?timezone=${encodeURIComponent(timezone)}`);
      if (!res.ok) throw new Error("Failed to fetch calendar");
      return res.json();
    },
  });

  const { data: upcomingFestivals, isLoading: loadingFestivals } = useQuery<Festival[]>({
    queryKey: ["/api/festivals/upcoming"],
  });

  const { data: allFestivals, isLoading: loadingAllFestivals } = useQuery<Festival[]>({
    queryKey: ["/api/festivals/all"],
  });

  const { data: upcomingEvents, isLoading: loadingEvents } = useQuery<TempleEvent[]>({
    queryKey: ["/api/temple-events/upcoming"],
  });

  const { data: preferences, isLoading: loadingPrefs } = useQuery<NotificationPreference>({
    queryKey: ["/api/notifications/preferences"],
  });

  const savePrefsMutation = useMutation({
    mutationFn: async (prefs: Omit<NotificationPreference, "id">) => {
      return apiRequest("POST", "/api/notifications/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
  });

  const calendarDays = useMemo(() => {
    if (!monthData?.days) return [];
    return monthData.days.map((day) => {
      const rawDate = day.date as unknown;
      const normalized =
        typeof rawDate === "string" && !rawDate.includes("T")
          ? rawDate + "T12:00:00"
          : rawDate as string | Date;
      return {
        ...day,
        date: new Date(normalized),
      };
    });
  }, [monthData]);

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const selectedDate = useMemo(() => {
    if (highlightedDate) {
      const target = new Date(highlightedDate + "T12:00:00");
      return calendarDays.find(
        (d) => d.date.toDateString() === target.toDateString()
      )?.date;
    }
    const today = new Date();
    return calendarDays.find(
      (d) => d.date.toDateString() === today.toDateString()
    )?.date;
  }, [calendarDays, highlightedDate]);

  const navigateToFestival = useCallback((festival: Festival) => {
    const festDate = new Date(festival.date + "T12:00:00");
    setCurrentMonth(new Date(festDate.getFullYear(), festDate.getMonth(), 1));
    setHighlightedDate(festival.date);
    setActiveTab("calendar");
    setTimeout(() => setHighlightedDate(null), 4000);
  }, []);

  // A vratham whose festival is today (drives the day-of banner).
  const todayVratham = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return vrathamForDate(todayStr);
  }, []);

  const openVratham = useCallback((v: Vratham) => {
    setSelectedVratham(v);
    setActiveTab("vrathams");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openVrathamBySlug = useCallback((slug: string) => {
    const v = vrathamBySlug(slug);
    if (v) openVratham(v);
  }, [openVratham]);

  // Open a festival's detail page (the event page that links to its vratham).
  const openFestival = useCallback((festival: Festival) => {
    setSelectedFestival(festival);
    setActiveTab("events");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Feed the day's real sunrise/sunset into the theme so auto mode flips at
  // the actual local horizon rather than a fixed 6am–6pm window.
  useEffect(() => {
    if (todayPanchang?.sunrise && todayPanchang?.sunset && todayPanchang?.timezone) {
      setDaylight(todayPanchang.sunrise, todayPanchang.sunset, todayPanchang.timezone);
    }
  }, [todayPanchang, setDaylight]);

  useEffect(() => {
    if (highlightedDate && calendarDays.length > 0) {
      const target = new Date(highlightedDate + "T12:00:00");
      const day = calendarDays.find(
        (d) => d.date.toDateString() === target.toDateString()
      );
      if (day) {
        setSelectedDay(day);
        setModalOpen(true);
      }
    }
  }, [highlightedDate, calendarDays]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex-none grid place-items-center h-11 w-11 rounded-full text-xl border"
              style={{
                borderColor: "hsl(var(--gold-deep))",
                background: "radial-gradient(circle at 30% 30%, hsl(var(--saffron) / 0.22), transparent 70%)",
                boxShadow: "0 4px 22px hsl(var(--gold) / 0.22)",
              }}
            >
              🪔
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-telugu font-semibold text-foreground leading-none" data-testid="text-app-title">
                {t("తెలుగు పంచాంగం", "Telugu Panchangam")}
              </h1>
              <p className="cel-eyebrow text-[0.6rem] mt-1.5 hidden sm:block">
                Celestial Almanac
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden sm:block">
              <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
            </div>
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden md:inline" data-testid="text-user-name">
                    {user.firstName || user.email}
                  </span>
                </div>
                <Button variant="ghost" size="icon" asChild data-testid="button-logout">
                  <a href="/api/logout" title="Logout">
                    <LogOut className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-6 pb-28 md:pb-6">
        {todayVratham && <FestivalBanner vratham={todayVratham} onOpen={openVratham} />}
        <InstallBanner />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop: centered top tabs. Mobile: fixed bottom icon nav. */}
          <TabsList
            className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-4 rounded-none border-t bg-background/95 p-0 backdrop-blur pb-[env(safe-area-inset-bottom)] md:static md:mx-auto md:h-10 md:w-full md:max-w-lg md:rounded-md md:border-0 md:bg-muted md:p-1"
            data-testid="tabs-main"
          >
            <TabsTrigger
              value="calendar"
              className="h-full flex-col gap-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none md:h-auto md:flex-row md:gap-2 md:rounded-sm md:data-[state=active]:bg-background md:data-[state=active]:text-foreground md:data-[state=active]:shadow-sm"
              data-testid="tab-calendar"
            >
              <Calendar className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-[10px] leading-none md:text-sm">{t("క్యాలెండర్", "Calendar")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="h-full flex-col gap-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none md:h-auto md:flex-row md:gap-2 md:rounded-sm md:data-[state=active]:bg-background md:data-[state=active]:text-foreground md:data-[state=active]:shadow-sm"
              data-testid="tab-events"
            >
              <Sparkles className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-[10px] leading-none md:text-sm">{t("పండుగలు", "Events")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="vrathams"
              className="h-full flex-col gap-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none md:h-auto md:flex-row md:gap-2 md:rounded-sm md:data-[state=active]:bg-background md:data-[state=active]:text-foreground md:data-[state=active]:shadow-sm"
              data-testid="tab-vrathams"
            >
              <Flower2 className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-[10px] leading-none md:text-sm">{t("వ్రతాలు", "Vrathams")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="h-full flex-col gap-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none md:h-auto md:flex-row md:gap-2 md:rounded-sm md:data-[state=active]:bg-background md:data-[state=active]:text-foreground md:data-[state=active]:shadow-sm"
              data-testid="tab-settings"
            >
              <Settings className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-[10px] leading-none md:text-sm">{t("సెట్టింగ్స్", "Settings")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6" data-testid="tabcontent-calendar">
            <TodayPanchang panchang={todayPanchang} isLoading={loadingToday} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CalendarGrid
                  days={calendarDays}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  onDayClick={handleDayClick}
                  selectedDate={selectedDate}
                  highlightedDate={highlightedDate}
                  isLoading={loadingMonth}
                />
              </div>
              <div className="space-y-6">
                <FestivalsList
                  festivals={upcomingFestivals || []}
                  title={t("రాబోయే పండుగలు", "Upcoming Festivals")}
                  isLoading={loadingFestivals}
                  onFestivalClick={openFestival}
                />
              </div>
            </div>

            <Sankalpam panchang={todayPanchang} />
          </TabsContent>

          <TabsContent value="events" className="space-y-6" data-testid="tabcontent-events">
            {selectedFestival ? (
              <FestivalDetail
                festival={selectedFestival}
                onBack={() => setSelectedFestival(null)}
                onOpenVratham={openVrathamBySlug}
                onViewInCalendar={navigateToFestival}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FestivalsList
                  festivals={allFestivals || []}
                  title={t("అన్ని పండుగలు", "All Festivals")}
                  isLoading={loadingAllFestivals}
                  showPast
                  onFestivalClick={openFestival}
                />
                <TempleEvents events={upcomingEvents || []} isLoading={loadingEvents} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="vrathams" data-testid="tabcontent-vrathams">
            {selectedVratham ? (
              <VrathamDetail vratham={selectedVratham} onBack={() => setSelectedVratham(null)} />
            ) : (
              <VrathamsList onSelect={openVratham} />
            )}
          </TabsContent>

          <TabsContent value="settings" className="max-w-lg mx-auto space-y-6" data-testid="tabcontent-settings">
            <Card data-testid="card-display-settings">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  {t("ప్రదర్శన సెట్టింగ్స్", "Display Settings")}
                </CardTitle>
                <CardDescription>
                  {t("భాష మరియు టైమ్‌జోన్ ఎంచుకోండి", "Choose your language and timezone preferences")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">{t("భాష", "Language")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("తెలుగు లేదా ఆంగ్లంలో చూడండి", "View content in Telugu or English")}
                    </p>
                  </div>
                  <LanguageSelector />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">{t("టైమ్‌జోన్", "Timezone")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("మీ స్థానిక సమయ మండలాన్ని ఎంచుకోండి", "Select your local timezone")}
                    </p>
                  </div>
                  <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
                </div>
              </CardContent>
            </Card>

            {user ? (
              <NotificationSettings
                preferences={preferences}
                onSave={(prefs) => savePrefsMutation.mutate(prefs)}
                isLoading={loadingPrefs || savePrefsMutation.isPending}
              />
            ) : (
              <Card data-testid="card-login-prompt">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    {t("నోటిఫికేషన్లు", "Notifications")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "ప్రత్యేక తిథులు మరియు పండుగల గురించి నోటిఫికేషన్లు పొందండి",
                      "Get notifications about special tithis and festivals"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {t(
                      "నోటిఫికేషన్లను ఎనేబుల్ చేయడానికి దయచేసి లాగిన్ అవ్వండి",
                      "Please sign in with Google to enable push notifications for special days like Ekadashi, Chaturthi, and more."
                    )}
                  </p>
                  <Button asChild data-testid="button-login-notifications">
                    <a href="/api/login">
                      {t("Google తో లాగిన్ అవ్వండి", "Sign in with Google")}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <DayDetailModal
        day={selectedDay}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      <ChatWidget />

      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Telugu Panchangam - తెలుగు పంచాంగం
          </p>
          <p className="mt-1">
            Traditional Hindu calendar with tithis, nakshatras, and temple events
          </p>
        </div>
      </footer>
    </div>
  );
}
