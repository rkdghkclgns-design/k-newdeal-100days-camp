/* ============================================================
   K-뉴딜 100일 캠프 — 관리자 모드
   인라인 문구 수정 · 항목(메뉴/STEP/혜택/FAQ) CRUD · localStorage 저장
   ============================================================ */

const STORE_KEY = "knewdeal_landing_content_v4";
const ADMIN_PASS = "0000"; // 관리자 비밀번호

window.ADMIN = false;
let saveTimer = null;

/* ---- deep helpers ---- */
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function deepMerge(base, over) {
  if (Array.isArray(base)) return over !== undefined ? deepClone(over) : deepClone(base);
  if (base && typeof base === "object") {
    const out = {};
    for (const k of Object.keys(base)) out[k] = deepMerge(base[k], over ? over[k] : undefined);
    return out;
  }
  return over !== undefined ? over : base;
}
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, val) {
  const ks = path.split(".");
  let o = obj;
  for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
  o[ks[ks.length - 1]] = val;
}

/* ---- persistence ---- */
function loadState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
  S = saved ? deepMerge(window.DEFAULT_CONTENT, saved) : deepClone(window.DEFAULT_CONTENT);
  // arrays: if saved has them, deepMerge already replaced — but ensure saved arrays win fully
  if (saved) S = mergeArrays(deepClone(window.DEFAULT_CONTENT), saved);
}
function mergeArrays(base, over) {
  for (const k of Object.keys(over || {})) {
    if (Array.isArray(over[k])) base[k] = deepClone(over[k]);
    else if (over[k] && typeof over[k] === "object" && base[k] && typeof base[k] === "object") mergeArrays(base[k], over[k]);
    else if (over[k] !== undefined) base[k] = over[k];
  }
  return base;
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {}
  flashSaved();
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 400); }

/* ---- admin item-control HTML (consumed by render.js) ---- */
function adminItemBtns(listPath, i) {
  if (!window.ADMIN) return "";
  return `<div class="adm-item-ctrl">
    <button class="adm-mini" data-move="up" data-list="${listPath}" data-i="${i}" title="위로">▲</button>
    <button class="adm-mini" data-move="down" data-list="${listPath}" data-i="${i}" title="아래로">▼</button>
    <button class="adm-mini del" data-del data-list="${listPath}" data-i="${i}" title="삭제">✕</button>
  </div>`;
}
function adminAddBtn(listPath, label) {
  if (!window.ADMIN) return "";
  return `<button class="adm-add" data-add data-list="${listPath}">＋ ${label}</button>`;
}
function adminAddBtnCenter(listPath, label) {
  if (!window.ADMIN) return "";
  return `<div class="adm-add-wrap"><button class="adm-add" data-add data-list="${listPath}">＋ ${label}</button></div>`;
}

/* ---- new-item templates ---- */
const NEW_ITEM = {
  "nav.items": () => ({ label: "새 메뉴", href: "#" }),
  "empathy.items": () => "새로운 공감 문구를 입력하세요.",
  "solution.regions": () => "지역",
  "curriculum.steps": () => ({ tag: "STEP", lv: "LV.0", title: "새 퀘스트", desc: "설명을 입력하세요." }),
  "rewards.cards": () => ({ tag: "참여자 100% 지급", icon: "sparkle", value: "NEW", unit: "", title: "새 혜택", desc: "설명을 입력하세요." }),
  "nexon.cards": () => ({ tag: "TAG", strong: "강조 문구", title: "새 혜택", desc: "설명을 입력하세요.", slot: "nexon-x-" + Date.now(), art: "" }),
  "eligibility.cards": () => ({ icon: "user", title: "새 조건", desc: "설명을 입력하세요." }),
  "faq.items": () => ({ q: "질문을 입력하세요.", a: "답변을 입력하세요." })
};

/* ---- list mutations ---- */
function listOp(listPath, op, i) {
  const arr = getPath(S, listPath);
  if (!Array.isArray(arr)) return;
  i = parseInt(i, 10);
  if (op === "del") { if (arr.length <= 1) { alert("최소 1개 항목은 유지해야 해요."); return; } arr.splice(i, 1); }
  else if (op === "up" && i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; }
  else if (op === "down" && i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; }
  else if (op === "add") { const f = NEW_ITEM[listPath]; arr.push(f ? f() : ""); }
  else return;
  saveState();
  renderAll();
}

/* ---- inline editable wiring (called after each render) ---- */
function wireEditable() {
  if (!window.ADMIN) return;
  document.querySelectorAll("[data-edit]").forEach((el) => {
    el.setAttribute("contenteditable", "plaintext-only");
    el.classList.add("adm-editable");
    el.addEventListener("blur", onEditCommit);
    el.addEventListener("input", scheduleSave);
    el.addEventListener("keydown", onEditKey);
  });
  document.querySelectorAll("[data-edit-html]").forEach((el) => {
    el.setAttribute("contenteditable", "true");
    el.classList.add("adm-editable");
    el.addEventListener("blur", onEditHtmlCommit);
    el.addEventListener("input", scheduleSave);
  });
}
function onEditKey(e) {
  // prevent newlines on single-line fields; allow Esc to blur
  if (e.key === "Enter") { e.preventDefault(); e.target.blur(); }
  if (e.key === "Escape") e.target.blur();
}
function onEditCommit(e) {
  const path = e.target.getAttribute("data-edit");
  let val = e.target.innerText.replace(/\u00a0/g, " ").trim();
  setPath(S, path, val);
  saveState();
}
function onEditHtmlCommit(e) {
  const path = e.target.getAttribute("data-edit-html");
  setPath(S, path, e.target.innerHTML.trim());
  saveState();
}

/* ---- admin bar + toggle ---- */
function buildAdminUI() {
  const bar = document.createElement("div");
  bar.className = "adm-bar";
  bar.id = "admBar";
  bar.innerHTML = `
    <div class="container adm-bar-inner">
      <div class="adm-left"><b>관리자 모드</b><span class="adm-hint">문구를 클릭해 바로 수정 · 항목은 ＋ / ✕ / ▲▼ 로 편집</span></div>
      <div class="adm-right">
        <span class="adm-saved" id="admSaved">자동 저장됨</span>
        <button class="adm-btn" id="admReset">초기화</button>
        <button class="adm-btn" id="admExport">내보내기</button>
        <button class="adm-btn primary" id="admExit">편집 종료</button>
      </div>
    </div>`;
  document.body.appendChild(bar);

  // admin login via nav lock button (delegated — nav re-renders)
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-admin-login]")) return;
    if (window.ADMIN) { exitAdmin(); return; }
    const pass = prompt("관리자 비밀번호를 입력하세요");
    if (pass === null) return;
    if (pass !== ADMIN_PASS) { alert("비밀번호가 올바르지 않아요."); return; }
    enterAdmin();
  });
  document.getElementById("admExit").addEventListener("click", exitAdmin);
  document.getElementById("admReset").addEventListener("click", () => {
    if (confirm("모든 수정 내용을 처음 상태로 되돌릴까요?")) {
      localStorage.removeItem(STORE_KEY);
      S = deepClone(window.DEFAULT_CONTENT);
      renderAll(); flashSaved("초기화됨");
    }
  });
  document.getElementById("admExport").addEventListener("click", exportJSON);
}
function enterAdmin() {
  window.ADMIN = true;
  document.body.classList.add("admin-on");
  document.getElementById("admBar").classList.add("show");
  renderAll();
}
function exitAdmin() {
  window.ADMIN = false;
  document.body.classList.remove("admin-on");
  document.getElementById("admBar").classList.remove("show");
  renderAll();
}
function flashSaved(msg) {
  const el = document.getElementById("admSaved");
  if (!el) return;
  el.textContent = msg || "저장됨 ✓";
  el.classList.add("on");
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.classList.remove("on"); el.textContent = "자동 저장됨"; }, 1200);
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "knewdeal-content.json"; a.click();
  URL.revokeObjectURL(url);
}

/* ---- delegated clicks for list ops ---- */
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) { listOp(add.getAttribute("data-list"), "add"); return; }
  const del = e.target.closest("[data-del]");
  if (del) { listOp(del.getAttribute("data-list"), "del", del.getAttribute("data-i")); return; }
  const mv = e.target.closest("[data-move]");
  if (mv) { listOp(mv.getAttribute("data-list"), mv.getAttribute("data-move"), mv.getAttribute("data-i")); return; }
});

/* ---- admin styles (injected) ---- */
(function injectAdminCSS() {
  const css = `
  .adm-launcher{position:fixed;left:18px;bottom:18px;z-index:190;background:#14161d;color:#fff;border:1px solid rgba(255,255,255,.18);
    padding:10px 15px;border-radius:999px;font-family:var(--pixel);font-size:12px;box-shadow:var(--shadow-md);opacity:.65;transition:.16s}
  .adm-launcher:hover{opacity:1;transform:translateY(-2px)}
  .adm-bar{position:fixed;top:0;left:0;right:0;z-index:400;background:#14161d;color:#fff;border-bottom:2px solid var(--gold);
    transform:translateY(-110%);transition:transform .26s ease}
  .adm-bar.show{transform:none}
  .adm-bar-inner{display:flex;align-items:center;gap:16px;height:56px}
  .adm-left b{font-size:14px;margin-right:10px}
  .adm-left .adm-hint{font-size:12.5px;color:rgba(255,255,255,.6)}
  .adm-right{margin-left:auto;display:flex;align-items:center;gap:9px}
  .adm-saved{font-family:var(--pixel);font-size:11px;color:rgba(255,255,255,.45);transition:.2s}
  .adm-saved.on{color:var(--gold)}
  .adm-btn{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700}
  .adm-btn:hover{background:rgba(255,255,255,.18)}
  .adm-btn.primary{background:var(--gold);color:#3a2400;border-color:var(--gold)}
  body.admin-on{padding-top:56px}
  body.admin-on .nav{top:56px}
  .adm-editable{outline:1.5px dashed rgba(47,107,255,.45);outline-offset:3px;border-radius:4px;cursor:text;transition:outline-color .12s}
  .adm-editable:hover{outline-color:var(--blue);background:rgba(47,107,255,.05)}
  .adm-editable:focus{outline:2px solid var(--blue);background:rgba(47,107,255,.08)}
  .sec.dark .adm-editable,.hero .adm-editable,.nexon .adm-editable,.apply .adm-editable{outline-color:rgba(245,166,35,.5)}
  /* item controls */
  [data-li]{position:relative}
  .adm-item-ctrl{position:absolute;top:8px;right:8px;display:flex;gap:4px;z-index:5}
  .empathy-item .adm-item-ctrl{top:50%;transform:translateY(-50%)}
  .region-chip .adm-item-ctrl{position:static;transform:none;margin-left:4px}
  .adm-mini{width:24px;height:24px;border-radius:6px;border:1px solid var(--line);background:#fff;color:var(--ink-2);font-size:10px;
    display:grid;place-items:center;box-shadow:var(--shadow-sm)}
  .adm-mini:hover{border-color:var(--blue);color:var(--blue)}
  .adm-mini.del:hover{border-color:#e5484d;color:#e5484d}
  .nexon-card .adm-mini,.hero .adm-mini{background:#fff}
  .adm-add-wrap{text-align:center;margin-top:22px}
  .adm-add{background:var(--blue-050);color:var(--blue);border:1.5px dashed var(--blue);padding:11px 20px;border-radius:10px;font-weight:700;font-size:14px}
  .adm-add:hover{background:var(--blue);color:#fff}
  .empathy-log .adm-add{margin:6px 10px 12px;display:block;width:calc(100% - 20px)}
  `;
  const s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);
})();
