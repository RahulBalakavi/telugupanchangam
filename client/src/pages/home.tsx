import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TodayPanchang } from "@/components/today-panchang";
import { CalendarGrid } from "@/components/calendar-grid";
import { FestivalsList } from "@/components/festivals-list";
import { TempleEvents } from "@/components/temple-events";
import { NotificationSettings } from "@/components/notification-settings";
import { DayDetailModal } from "@/components/day-detail-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimezoneSelector, getStoredTimezone, setStoredTimezone } from "@/components/timezone-selector";
import { LanguageSelector } from "@/components/language-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Bell, Sparkles, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import type { CalendarDay, PanchangData, Festival, TempleEvent, NotificationPreference } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [timezone, setTimezone] = useState(getStoredTimezone());

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
    return monthData.days.map((day) => ({
      ...day,
      date: new Date(day.date),
    }));
  }, [monthData]);

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const selectedDate = useMemo(() => {
    const today = new Date();
    return calendarDays.find(
      (d) => d.date.toDateString() === today.toDateString()
    )?.date;
  }, [calendarDays]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🙏</span>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground" data-testid="text-app-title">
                {t("తెలుగు పంచాంగం", "Telugu Panchangam")}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t("Telugu Panchangam", "Hindu Calendar")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden sm:block">
              <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
            </div>
            {user && (
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
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild data-testid="button-logout">
              <a href="/api/logout" title="Logout">
                <LogOut className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3" data-testid="tabs-main">
            <TabsTrigger value="calendar" className="gap-2" data-testid="tab-calendar">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t("క్యాలెండర్", "Calendar")}</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2" data-testid="tab-events">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t("పండుగలు", "Events")}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t("సెట్టింగ్స్", "Settings")}</span>
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
                  isLoading={loadingMonth}
                />
              </div>
              <div className="space-y-6">
                <FestivalsList
                  festivals={upcomingFestivals || []}
                  title="Upcoming Festivals"
                  isLoading={loadingFestivals}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6" data-testid="tabcontent-events">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FestivalsList
                festivals={upcomingFestivals || []}
                title="All Upcoming Festivals"
                isLoading={loadingFestivals}
              />
              <TempleEvents events={upcomingEvents || []} isLoading={loadingEvents} />
            </div>
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

            <NotificationSettings
              preferences={preferences}
              onSave={(prefs) => savePrefsMutation.mutate(prefs)}
              isLoading={loadingPrefs || savePrefsMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </main>

      <DayDetailModal
        day={selectedDay}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

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
