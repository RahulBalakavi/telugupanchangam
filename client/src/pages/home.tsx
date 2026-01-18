import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TodayPanchang } from "@/components/today-panchang";
import { CalendarGrid } from "@/components/calendar-grid";
import { FestivalsList } from "@/components/festivals-list";
import { TempleEvents } from "@/components/temple-events";
import { NotificationSettings } from "@/components/notification-settings";
import { DayDetailModal } from "@/components/day-detail-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Bell, Sparkles } from "lucide-react";
import type { CalendarDay, PanchangData, Festival, TempleEvent, NotificationPreference } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: todayPanchang, isLoading: loadingToday } = useQuery<PanchangData>({
    queryKey: ["/api/panchang/today"],
  });

  const { data: monthData, isLoading: loadingMonth } = useQuery<{
    days: CalendarDay[];
    festivals: Festival[];
    templeEvents: TempleEvent[];
  }>({
    queryKey: ["/api/calendar", currentMonth.getFullYear(), currentMonth.getMonth()],
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
                తెలుగు పంచాంగం
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Telugu Panchangam
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3" data-testid="tabs-main">
            <TabsTrigger value="calendar" className="gap-2" data-testid="tab-calendar">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2" data-testid="tab-events">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
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

          <TabsContent value="notifications" className="max-w-lg mx-auto" data-testid="tabcontent-notifications">
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
