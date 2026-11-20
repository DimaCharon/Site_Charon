import { renderToString } from "react-dom/server";
import App from "./App";
import { setPrerenderRoute } from "./config/routes";
export function renderPath(path: string) {
  setPrerenderRoute(path);
  return renderToString(<App />);
}
