import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    const dismissed = localStorage.getItem('ios-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    if (isIOS && !isInStandaloneMode && daysSinceDismissed > 7) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t shadow-lg animate-in slide-in-from-bottom duration-300"
      data-testid="ios-install-prompt"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={handleDismiss}
        data-testid="button-dismiss-install"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-4 pr-8">
        <img 
          src="/icons/icon-72.png" 
          alt="App Icon" 
          className="w-12 h-12 rounded-xl shadow"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install Telugu Panchangam</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add to your home screen for quick access
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Tap</span>
            <Share className="h-4 w-4 text-primary" />
            <span>then</span>
            <PlusSquare className="h-4 w-4 text-primary" />
            <span className="font-medium">"Add to Home Screen"</span>
          </div>
        </div>
      </div>
    </div>
  );
}
