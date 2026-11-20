export const blankOffer = () => ({
  audience: "",
  result: "",
  sale: "showcase",
  price: "",
  terms: "",
  buyUrl: "",
  demo: "none",
  demoUrl: "",
  docsUrl: "",
});
// Links are navigation only: never embed untrusted pages, accept checkout data, or fetch these URLs on the server.
export function httpsLink(v) {
  if (
    typeof v !== "string" ||
    !v ||
    v.length > 1200 ||
    !/^https:\/\//i.test(v) ||
    /[\s\\\u0000-\u001f\u007f-\u009f]/u.test(v)
  )
    return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      u.hostname.includes(".") &&
      u.href.length <= 1200
      ? u.href
      : null;
  } catch {
    return null;
  }
}
