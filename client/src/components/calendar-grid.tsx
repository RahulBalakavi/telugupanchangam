import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarGridProps {
  days: CalendarDay[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDayClick: (day: CalendarDay) => void;
  selectedDate?: Date;
  highlightedDate?: string | null;
  isLoading?: boolean;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekDaysTelugu = ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"];

export function CalendarGrid({
  days,
  currentMonth,
  onMonthChange,
  onDayClick,
  selectedDate,
  highlightedDate,
  isLoading,
}: CalendarGridProps) {
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <Card data-testid="card-calendar-loading">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4 flex-wrap">
          <Skeleton className="h-8 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-calendar">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4 flex-wrap">
        <CardTitle className="font-display text-lg tracking-[0.12em] uppercase" data-testid="text-month-year">
          {monthYear}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            data-testid="button-today"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 md:p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={cn(
                "text-center py-2 text-sm font-medium",
                i === 0 && "text-destructive"
              )}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysTelugu[i]}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isSelected = selectedDate && 
              day.date.toDateString() === selectedDate.toDateString();
            const dayDateStr = day.date instanceof Date && !isNaN(day.date.getTime()) 
              ? day.date.toISOString().split('T')[0] 
              : '';
            const isHighlighted = highlightedDate && dayDateStr === highlightedDate;
            const dayOfWeek = day.date.getDay();
            const isSunday = dayOfWeek === 0;
            
            return (
              <button
                key={index}
                onClick={() => onDayClick(day)}
                className={cn(
                  "relative p-1.5 md:p-2 min-h-[60px] md:min-h-[80px] rounded-lg transition-all border border-transparent text-left",
                  day.isToday
                    ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md"
                    : "hover-elevate active-elevate-2 hover:border-primary/40",
                  !day.isCurrentMonth && "opacity-40",
                  isSelected && !isHighlighted && !day.isToday && "bg-primary/10 border-primary/30",
                  isHighlighted && "ring-2 ring-accent ring-offset-2 bg-accent/15 animate-pulse",
                  isSunday && !day.isToday && "text-destructive"
                )}
                data-testid={`button-day-${dayDateStr || index}`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between gap-1">
                    <span className={cn("text-sm md:text-base font-semibold")}>
                      {day.date.getDate()}
                    </span>
                    {day.panchang && (
                      <span className={cn(
                        "text-[10px] md:text-xs font-telugu",
                        day.isToday ? "text-primary-foreground/90" : "text-muted-foreground"
                      )}>
                        {day.panchang.teluguDate}
                      </span>
                    )}
                  </div>

                  {day.panchang && (
                    <div className="mt-auto pt-1 space-y-0.5">
                      <p className={cn(
                        "text-[9px] md:text-[10px] font-telugu truncate",
                        day.isToday ? "text-primary-foreground/90" : "text-muted-foreground"
                      )}>
                        {day.panchang.tithiTelugu}
                      </p>
                      {day.panchang.isSpecialDay && !day.isToday && (
                        <Badge
                          variant="secondary"
                          className="text-[8px] md:text-[9px] px-1 py-0 h-auto"
                        >
                          {day.panchang.specialDayInfo?.split(' ')[0]}
                        </Badge>
                      )}
                    </div>
                  )}

                  {day.festivals.length > 0 && (
                    <div className="absolute bottom-1.5 right-1.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        day.isToday ? "bg-primary-foreground" : "bg-primary shadow-[0_0_6px_hsl(var(--saffron))]"
                      )} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
