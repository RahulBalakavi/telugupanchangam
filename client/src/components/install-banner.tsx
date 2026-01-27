import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem("install-banner-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      setShowBanner(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("install-banner-dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-r from-primary/90 to-accent/90 text-white p-4 rounded-lg mb-4 shadow-lg"
      data-testid="install-banner"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-lg shrink-0">
          <Smartphone className="h-6 w-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">
            {t("యాప్‌ను ఇన్‌స్టాల్ చేయండి", "Install the App")}
          </h3>
          <p className="text-sm text-white/90 mt-1">
            {isIOS ? (
              t(
                "Safari లో షేర్ బటన్ నొక్కి \"Add to Home Screen\" ఎంచుకోండి",
                "Tap the Share button in Safari, then select \"Add to Home Screen\""
              )
            ) : (
              t(
                "మీ హోమ్ స్క్రీన్‌కు జోడించండి - ఆఫ్‌లైన్‌లో పని చేస్తుంది మరియు నోటిఫికేషన్‌లు వస్తాయి",
                "Add to your home screen for offline access and push notifications"
              )
            )}
          </p>
          
          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstall}
              variant="secondary"
              size="sm"
              className="mt-3 bg-white text-primary hover:bg-white/90"
              data-testid="button-install-app"
            >
              <Download className="h-4 w-4 mr-2" />
              {t("ఇన్‌స్టాల్ చేయండి", "Install Now")}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="shrink-0 text-white/80 hover:text-white hover:bg-white/20"
          data-testid="button-dismiss-install"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
