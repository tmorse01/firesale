import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/global.css";

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => registration.update())
        .catch(() => undefined);
    });
  } else {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => {
        if (!("caches" in window)) {
          return;
        }

        return caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys.filter((key) => key.startsWith("firesale-")).map((key) => caches.delete(key))
            )
          );
      })
      .catch(() => undefined);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
