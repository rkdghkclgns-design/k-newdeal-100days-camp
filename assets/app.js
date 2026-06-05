/* ============================================================
   K-뉴딜 100일 캠프 — 앱 인터랙션 & 초기화
   ============================================================ */

/* smooth scroll to a section id */
function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - (window.ADMIN ? 124 : 76);
  window.scrollTo({ top: y, behavior: "smooth" });
}

/* delegated interactions (survive re-render) */
document.addEventListener("click", (e) => {
  const sc = e.target.closest("[data-scroll]");
  if (sc) { scrollToId(sc.getAttribute("data-scroll")); closeDrawer(); return; }

  const fq = e.target.closest("[data-faq]");
  if (fq && !window.ADMIN) {
    const item = fq.closest(".faq-item");
    const a = item.querySelector(".faq-a");
    const open = item.classList.toggle("open");
    a.style.maxHeight = open ? a.querySelector(".inner").scrollHeight + 40 + "px" : "0";
    return;
  }

  if (e.target.closest("#navBurger")) { openDrawer(); return; }
  if (e.target.closest("#mdClose") || e.target.closest("[data-mdlink]")) { closeDrawer(); return; }
  if (e.target.id === "mobileDrawer") { closeDrawer(); return; }
});

function openDrawer() { document.getElementById("mobileDrawer").classList.add("open"); }
function closeDrawer() { document.getElementById("mobileDrawer").classList.remove("open"); }

/* apply form submit (front-end only) */
document.addEventListener("submit", (e) => {
  if (e.target.id === "applyForm") {
    e.preventDefault();
    document.getElementById("applyCard").classList.add("done");
    setTimeout(() => scrollToId("apply"), 60);
  }
});

/* reveal-on-scroll (rebind after each render) */
let revealObs;
function bindReveals() {
  if (revealObs) revealObs.disconnect();
  revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => revealObs.observe(el));
}

/* sticky bottom bar visibility */
function bindSticky() {
  const bar = document.getElementById("stickyBar");
  const onScroll = () => {
    const apply = document.getElementById("apply");
    const footer = document.getElementById("footer");
    const past = window.scrollY > 620;
    const applyTop = apply ? apply.getBoundingClientRect().top : 9999;
    const nearApply = applyTop < window.innerHeight + 120;
    bar.classList.toggle("show", past && !nearApply && !window.ADMIN);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* nav shadow on scroll */
function bindNav() {
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    nav.style.boxShadow = window.scrollY > 10 ? "0 4px 20px rgba(20,22,29,.07)" : "none";
  }, { passive: true });
}

/* empathy: sequential checkbox tick → when all on, pop the turn line → loop */
let empathyTimers = [];
function clearEmpathyTimers() { empathyTimers.forEach(clearTimeout); empathyTimers = []; }
function startEmpathyLoop() {
  clearEmpathyTimers();
  const boxes = [...document.querySelectorAll("#empathy .empathy-item")];
  const turn = document.querySelector("#empathy .empathy-turn");
  if (!boxes.length) return;
  const set = (el, on) => { el.classList.toggle("on", on); const c = el.querySelector(".chk"); if (c) c.classList.toggle("on", on); };

  if (window.ADMIN) { boxes.forEach((b) => set(b, true)); if (turn) turn.classList.remove("pop"); return; }

  const STEP = 620, START = 600, HOLD = 1700;
  function run() {
    clearEmpathyTimers();
    boxes.forEach((b) => set(b, false));
    if (turn) turn.classList.remove("pop");
    boxes.forEach((b, i) => empathyTimers.push(setTimeout(() => set(b, true), START + i * STEP)));
    const allOn = START + boxes.length * STEP + 120;
    empathyTimers.push(setTimeout(() => { if (turn) turn.classList.add("pop"); }, allOn));
    empathyTimers.push(setTimeout(run, allOn + HOLD));
  }
  run();
}

/* hook called by renderAll after DOM is built */
window.afterRender = function () {
  if (window.wireEditable) wireEditable();
  bindReveals();
  // ensure hero video autoplays (muted) across browsers
  const v = document.querySelector(".qc-video");
  if (v) { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  startEmpathyLoop();
};

/* ---- init ---- */
function init() {
  loadState();        // admin.js — sets global S from defaults + localStorage
  buildAdminUI();     // admin.js — launcher + bar
  renderAll();        // render.js
  bindSticky();
  bindNav();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
