// Prototype runtime: hash-based screen switching + tiny in-memory state.
// No framework on purpose — mockups must stay trivially editable by the designer agent.
(function () {
  const screens = Array.from(document.querySelectorAll(".screen"));
  const links = Array.from(document.querySelectorAll("[data-screen]"));
  const defaultScreen = screens[0]?.id;

  // Shared fake state for the prototype (seed data goes here).
  window.proto = { state: {}, go: show };

  function show(id) {
    if (!document.getElementById(id)) id = defaultScreen;
    screens.forEach((s) => s.classList.toggle("active", s.id === id));
    links.forEach((a) => a.classList.toggle("active", a.dataset.screen === id));
    const title = document.getElementById(id)?.dataset.title;
    if (title) document.title = `${title} · prototype`;
    if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  }

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) { e.preventDefault(); show(go.dataset.go); }
  });
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  show(location.hash.slice(1) || defaultScreen);
})();
