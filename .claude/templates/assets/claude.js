/* ------------------------------------------------------------------
   claude.js — shared script for all .claude HTML documents.
   Language switch (EN / VI): sets <html data-lang>, remembers the choice
   in localStorage and wires every .lang-switch button on the page.
   ------------------------------------------------------------------ */
(function () {
  var LANGS = ["en", "vi"];
  var KEY = "claude.docs.lang";
  var root = document.documentElement;

  function current() {
    return root.getAttribute("data-lang") || "en";
  }

  function apply(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage may be blocked */ }
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });
  }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".lang-switch button[data-lang]");
    if (btn) apply(btn.dataset.lang);
  });

  apply(stored() || current());
})();
