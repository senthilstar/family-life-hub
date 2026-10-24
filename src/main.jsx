import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
createRoot(document.getElementById("root")).render(<App/>);
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

// Ask the browser not to evict our data under storage pressure (important on phones).
try{ navigator.storage?.persist?.().catch(()=>{}); }catch{}
// When a new service worker takes over, reload once so the phone runs the fixed bundle.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  let had=!!navigator.serviceWorker.controller, done=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(had&&!done){ done=true; location.reload(); } had=true; });
}
