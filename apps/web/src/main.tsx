import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/global.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.update())
      .catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
