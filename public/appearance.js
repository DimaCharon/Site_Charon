// Parser-blocking by design: apply the saved surface before even the static page is painted.
(() => {
  try {
    const saved = JSON.parse(localStorage.getItem("charon.ui.v2") || "null");
    const light = saved?.theme === "light";
    document.documentElement.dataset.theme = light ? "light" : "dark";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", light ? "#ffffff" : "#000000");
  } catch {
    // Blocked storage or an invalid setting leaves the default black surface intact.
  }
})();
