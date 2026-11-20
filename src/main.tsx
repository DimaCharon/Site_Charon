import { createRoot } from "react-dom/client";
import App from "./App";
document.documentElement.dataset.client = "true";
createRoot(document.getElementById("root")!).render(<App />);
