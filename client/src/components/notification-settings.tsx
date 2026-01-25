import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { NotificationPreference } from "@shared/schema";

interface NotificationSettingsProps {
  preferences?: NotificationPreference;
  onSave: (preferences: Omit<NotificationPreference, "id">) => void;
  isLoading?: boolean;
}

async function urlBase64ToUint8Array(base64String: string): Promise<Uint8Array> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      const subscribeResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existingSubscription.toJSON()),
      });
      if (subscribeResponse.ok) {
        return existingSubscription;
      }
    }
    
    const response = await fetch("/api/push/vapid-public-key");
    const { publicKey } = await response.json();
    
    if (!publicKey) {
      console.error("No VAPID public key available");
      return null;
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await urlBase64ToUint8Array(publicKey),
    });
    
    const subscribeResponse = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    
    if (!subscribeResponse.ok) {
      throw new Error("Failed to save subscription");
    }
    
    return subscription;
  } catch (error) {
    console.error("Push subscription failed:", error);
    return null;
  }
}

async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      
      await subscription.unsubscribe();
    }
    
    return true;
  } catch (error) {
    console.error("Push unsubscribe failed:", error);
    return false;
  }
}

export function NotificationSettings({ preferences, onSave, isLoading }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [settings, setSettings] = useState({
    enabled: preferences?.enabled ?? false,
    notifyEkadashi: preferences?.notifyEkadashi ?? true,
    notifyChaturthi: preferences?.notifyChaturthi ?? true,
    notifyShashthi: preferences?.notifyShashthi ?? true,
    notifyAshtami: preferences?.notifyAshtami ?? true,
    notifyPurnima: preferences?.notifyPurnima ?? true,
    notifyAmavasya: preferences?.notifyAmavasya ?? true,
    notifyTempleEvents: preferences?.notifyTempleEvents ?? true,
    notifyTime: preferences?.notifyTime ?? "06:00",
  });

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
    }
  }, []);

  useEffect(() => {
    if (preferences) {
      setSettings({
        enabled: preferences.enabled,
        notifyEkadashi: preferences.notifyEkadashi,
        notifyChaturthi: preferences.notifyChaturthi,
        notifyShashthi: preferences.notifyShashthi,
        notifyAshtami: preferences.notifyAshtami,
        notifyPurnima: preferences.notifyPurnima,
        notifyAmavasya: preferences.notifyAmavasya,
        notifyTempleEvents: preferences.notifyTempleEvents,
        notifyTime: preferences.notifyTime,
      });
    }
  }, [preferences]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        if (pushSupported) {
          const subscription = await subscribeToPush();
          if (subscription) {
            setSettings((prev) => ({ ...prev, enabled: true }));
            toast({
              title: "Notifications enabled",
              description: "You'll receive daily reminders about special days, even when the app is closed",
            });
          } else {
            toast({
              title: "Partial setup",
              description: "Notifications enabled but background push may not work",
              variant: "destructive",
            });
          }
        } else {
          setSettings((prev) => ({ ...prev, enabled: true }));
          toast({
            title: "Notifications enabled",
            description: "You'll receive notifications when the app is open",
          });
        }
      } else {
        toast({
          title: "Permission denied",
          description: "You won't receive notifications. You can change this in browser settings.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleToggleEnabled = async (checked: boolean) => {
    if (checked && pushSupported && notificationPermission === "granted") {
      setIsSubscribing(true);
      try {
        const subscription = await subscribeToPush();
        if (subscription) {
          setSettings((prev) => ({ ...prev, enabled: true }));
        }
      } finally {
        setIsSubscribing(false);
      }
    } else if (!checked) {
      await unsubscribeFromPush();
      setSettings((prev) => ({ ...prev, enabled: false }));
    } else {
      setSettings((prev) => ({ ...prev, enabled: checked }));
    }
  };

  const handleSave = () => {
    onSave(settings);
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated",
    });
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test sent!",
          description: result.message,
        });
      } else {
        toast({
          title: "Test failed",
          description: result.message || "Could not send test notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return { value: `${hour}:00`, label: `${hour}:00` };
  });

  return (
    <Card data-testid="card-notification-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {settings.enabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Notification Settings
        </CardTitle>
        <CardDescription>
          Get daily notifications about special days and temple events
          {pushSupported && " (works even when app is closed)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationPermission !== "granted" && (
          <div className="p-4 rounded-md bg-muted">
            <p className="text-sm mb-3">
              Enable notifications to receive daily reminders about special tithis like Ekadashi, Shashthi, and more.
              {pushSupported && " Notifications will work even when the app is closed."}
            </p>
            <Button 
              onClick={requestNotificationPermission} 
              disabled={isSubscribing}
              data-testid="button-enable-notifications"
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Enable Notifications"
              )}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off all notifications
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={handleToggleEnabled}
              disabled={notificationPermission !== "granted" || isSubscribing}
              data-testid="switch-notifications-enabled"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-ekadashi">Ekadashi (ఏకాదశి)</Label>
              <p className="text-sm text-muted-foreground">
                11th day of lunar fortnight
              </p>
            </div>
            <Switch
              id="notify-ekadashi"
              checked={settings.notifyEkadashi}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifyEkadashi: checked }))
              }
              disabled={!settings.enabled}
              data-testid="switch-notify-ekadashi"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-chaturthi">Chaturthi (చవితి)</Label>
              <p className="text-sm text-muted-foreground">
                4th day, sacred to Lord Ganesha
              </p>
            </div>
            <Switch
              id="notify-chaturthi"
              checked={settings.notifyChaturthi}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifyChaturthi: checked }))
              }
              disabled={!settings.enabled}
              data-testid="switch-notify-chaturthi"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-shashthi">Shashthi (షష్ఠి)</Label>
              <p className="text-sm text-muted-foreground">
                6th day, sacred to Lord Subrahmanya
              </p>
            </div>
            <Switch
              id="notify-shashthi"
              checked={settings.notifyShashthi}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifyShashthi: checked }))
              }
              disabled={!settings.enabled}
              data-testid="switch-notify-shashthi"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-ashtami">Ashtami (అష్టమి)</Label>
              <p className="text-sm text-muted-foreground">
                8th day, sacred to Goddess Durga
              </p>
            </div>
            <Switch
              id="notify-ashtami"
              checked={settings.notifyAshtami}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifyAshtami: checked }))
              }
              disabled={!settings.enabled}
              data-testid="switch-notify-ashtami"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-purnima">Purnima (పూర్ణిమ)</Label>
              <p className="text-sm text-muted-foreground">
                Full moon day
              </p>
            </div>
            <Switch
              id="notify-purnima"
              checked={settings.notifyPurnima}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifyPurnima: checked }))
              }
              disabled={!settings.enabled}
              data-testid="switch-notify-purnima"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-amavasya">Amavasya (అమావాస్య)</Label>
              <p className="text-sm text-muted-foreground">
                New moon day
              </p>
            </div>
            <Switch
              id="notify-amavasya"
              checked={settings.notifyAmavasya}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifyAmavasya: checked }))
              }
              disabled={!settings.enabled}
              data-testid="switch-notify-amavasya"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-temple-events">Temple Events</Label>
              <p className="text-sm text-muted-foreground">
                Major temple festivals and events
              </p>
            </div>
            <Switch
              id="notify-temple-events"
              checked={settings.notifyTempleEvents}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifyTempleEvents: checked }))
              }
              disabled={!settings.enabled}
              data-testid="switch-notify-temple-events"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Notification Time
              </Label>
              <p className="text-sm text-muted-foreground">
                When to receive daily notifications
              </p>
            </div>
            <Select
              value={settings.notifyTime}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, notifyTime: value }))
              }
              disabled={!settings.enabled}
            >
              <SelectTrigger className="w-28" data-testid="select-notify-time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSave} className="flex-1" disabled={isLoading} data-testid="button-save-settings">
            Save Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestNotification} 
            disabled={!settings.enabled || isTesting}
            data-testid="button-test-notification"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Test Notification
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
