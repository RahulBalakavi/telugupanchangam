import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)", offset: "+5:30" },
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "+4:00" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", offset: "+8:00" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "+9:00" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", offset: "+8:00" },
  { value: "Europe/London", label: "London (GMT/BST)", offset: "+0:00" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "+1:00" },
  { value: "Europe/Berlin", label: "Berlin (CET)", offset: "+1:00" },
  { value: "America/New_York", label: "New York (EST)", offset: "-5:00" },
  { value: "America/Chicago", label: "Chicago (CST)", offset: "-6:00" },
  { value: "America/Denver", label: "Denver (MST)", offset: "-7:00" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)", offset: "-8:00" },
  { value: "America/Toronto", label: "Toronto (EST)", offset: "-5:00" },
  { value: "Australia/Sydney", label: "Sydney (AEST)", offset: "+10:00" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)", offset: "+10:00" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)", offset: "+12:00" },
];

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]" data-testid="select-timezone">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value} data-testid={`timezone-option-${tz.value}`}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function getStoredTimezone(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("selectedTimezone");
    if (stored) return stored;
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
}

export function setStoredTimezone(timezone: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("selectedTimezone", timezone);
  }
}
