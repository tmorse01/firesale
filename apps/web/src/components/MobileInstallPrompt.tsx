import { useEffect, useState } from "react";
import { usePersistentState } from "../hooks/usePersistentState";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isMobileDevice() {
  const userAgent = window.navigator.userAgent;
  const isTouchMac = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return /Android|iPhone|iPad|iPod/i.test(userAgent) || isTouchMac;
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent;
  const isTouchMac = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return /iPhone|iPad|iPod/i.test(userAgent) || isTouchMac;
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function MobileInstallPrompt() {
  const [dismissed, setDismissed] = usePersistentState("firesale-mobile-install-prompt-dismissed", false);
  const [canRender, setCanRender] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const mobile = isMobileDevice();
    const ios = isIosDevice();
    const standalone = isStandaloneMode();

    setIsIos(ios);
    setCanRender(mobile && !standalone);

    if (standalone) {
      setDismissed(true);
    }
  }, [setDismissed]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDismissed(true);
      setInstallEvent(null);
      setCanRender(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [setDismissed]);

  async function handleInstall() {
    if (!installEvent) {
      return;
    }

    setIsInstalling(true);

    try {
      await installEvent.prompt();
      const outcome = await installEvent.userChoice;

      if (outcome.outcome === "accepted") {
        setDismissed(true);
      }
    } finally {
      setInstallEvent(null);
      setIsInstalling(false);
    }
  }

  if (!canRender || dismissed || (!installEvent && !isIos)) {
    return null;
  }

  return (
    <aside aria-label="Install FireSale" className="install-prompt" role="dialog">
      <div className="install-prompt-copy">
        <p className="install-prompt-title">Keep FireSale on your home screen</p>
        <p className="install-prompt-body">
          {installEvent
            ? "Install the app for faster access to nearby deals."
            : "Open Safari share and choose Add to Home Screen to install the app."}
        </p>
      </div>

      <div className="install-prompt-actions">
        {installEvent ? (
          <button className="button button-primary install-prompt-button" onClick={() => void handleInstall()} type="button">
            {isInstalling ? "Opening..." : "Install app"}
          </button>
        ) : null}
        <button className="button button-secondary install-prompt-button" onClick={() => setDismissed(true)} type="button">
          Not now
        </button>
      </div>
    </aside>
  );
}
