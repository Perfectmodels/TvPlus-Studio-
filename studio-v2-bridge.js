/* TVPlus V2 -> TVPlus Studio: secure, opt-in contextual handoff.
   No credentials, no cookies and no article storage on the Studio server. */
(function () {
  "use strict";
  const TAG = "tvplus-studio-bridge-v1";
  const $ = (id) => document.getElementById(id);
  const getParentOrigin = () => {
    try { return new URL(document.referrer).origin; } catch (_) { return ""; }
  };
  function allowed(origin) {
    try {
      const url = new URL(origin);
      const host = url.hostname;
      if (url.protocol !== "https:" || url.pathname !== "/") return false;
      return ["tvplusafrique.com", "www.tvplusafrique.com", "tvplusafriquev2.vercel.app",
        "tvplusafriquev2-git-integration-s-bde519-perfectmodels-projects.vercel.app"]
        .includes(host) ||
        /^tvplusafriquev2-[a-z0-9-]+-perfectmodels-projects\.vercel\.app$/.test(host);
    } catch (_) { return false; }
  }
  function updateField(id, value) {
    const field = $(id);
    if (!field) return;
    field.value = String(value || "");
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function applyCategories(categories, chosen) {
    const select = $("category");
    if (!select || !Array.isArray(categories) || categories.length === 0) return;
    const entries = categories
      .filter((c) => c && typeof c.name === "string" && c.name.length <= 80)
      .slice(0, 60);
    if (!entries.length) return;
    const selected = chosen?.name || "";
    select.replaceChildren(...entries.map((category) => {
      const option = document.createElement("option");
      const upper = category.name.toLocaleUpperCase("fr");
      option.value = upper === "FAITS DIVERS" ? "FAIT DIVERS" : upper;
      option.textContent = category.name;
      return option;
    }));
    const matching = entries.find((category) => category.name === selected);
    if (matching) {
      const value = matching.name.toLocaleUpperCase("fr");
      select.value = value === "FAITS DIVERS" ? "FAIT DIVERS" : value;
    }
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelectorAll(".tvplus-category-hint").forEach((hint) => {
      hint.textContent = "Catégories synchronisées avec TVPlus V2";
    });
    const label = document.querySelector('label[for="category"] .hint');
    if (label) label.textContent = entries.length + " rubriques en base";
  }
  async function applyCover(raw) {
    if (typeof raw !== "string" || !raw) return;
    let url;
    try { url = new URL(raw); } catch (_) { return; }
    if (url.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
        !url.pathname.startsWith("/storage/v1/object/public/media/")) return;
    try {
      const response = await fetch(url.toString(), { mode: "cors", credentials: "omit" });
      if (!response.ok) return;
      const blob = await response.blob();
      if (!/^image\/(jpeg|png|webp|avif)$/.test(blob.type) || blob.size > 5_242_880) return;
      const fileInput = $("photoInput");
      if (!fileInput || typeof DataTransfer === "undefined") return;
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], "couverture-tvplus." + blob.type.split("/")[1], { type: blob.type }));
      fileInput.files = transfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (_) {
      // A missing/CORS-blocked image must never prevent title/content handoff.
    }
  }

  const parentOrigin = getParentOrigin();
  if (!allowed(parentOrigin) || window.parent === window) return;

  const announce = () => window.parent.postMessage({ type: "TVPLUS_STUDIO_READY", tag: TAG }, parentOrigin);
  window.addEventListener("message", async (event) => {
    if (event.source !== window.parent || event.origin !== parentOrigin ||
        !allowed(event.origin) || event.data?.type !== "TVPLUS_V2_CONTEXT" ||
        event.data?.tag !== TAG) return;

    const input = event.data.payload;
    if (!input || typeof input !== "object" || typeof input.title !== "string" ||
        input.title.length > 200 || typeof input.body !== "string" || input.body.length > 100_000) return;

    const wanted = ["pastille", "alerte", "verbatim"].includes(input.format) ? input.format : "pastille";
    $(wanted + "Btn")?.click();
    applyCategories(input.categories, input.category);
    updateField("headline", input.title);
    updateField("studioArticleBody", input.body);
    updateField("studioCaptionTitle", input.title.slice(0, 75));
    if (wanted === "verbatim") {
      updateField("speaker", input.speaker || "");
      updateField("role", input.speakerRole || "");
    }
    // Input triggers the existing Studio rendering system; do not fork the canvas.
    await applyCover(input.coverUrl);
    window.parent.postMessage({ type: "TVPLUS_STUDIO_CONTEXT_APPLIED", tag: TAG }, parentOrigin);
  });

  const label = $("verbatimBtn");
  if (label) {
    const title = label.querySelector(".tab-title");
    if (title) title.textContent = "Ligne Rouge";
    else label.textContent = "Ligne Rouge";
    label.title = "Ligne Rouge — citations et prises de parole";
  }
  function renameLineRouge() {
    const tab = $("verbatimBtn");
    const heading = tab?.querySelector(".tab-title");
    if (heading) heading.textContent = "Ligne Rouge";
    else if (tab) tab.textContent = "Ligne Rouge";
    const mobile = $("mobileModelChip");
    if (mobile && mobile.textContent?.trim() === "Verbatim") mobile.textContent = "Ligne Rouge";
  }
  window.addEventListener("load", () => { renameLineRouge(); announce(); }, { once: true });
  announce();
})();
