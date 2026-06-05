/* ============================================================
   K-뉴딜 100일 캠프 — 렌더 엔진
   state(콘텐츠) → DOM. data-edit 경로로 관리자 인라인 수정 연결.
   ============================================================ */

/* ---- icon set (simple geometric UI icons) ---- */
const IC = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 5 2c1 2 1 3 1 4a5 5 0 1 1-10 0c0-3 2-5 3-7 1.5 1 2 2 2 2 .5-2 0-5-0-7Z"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2-1.1 1.7-2.5 2-2.5.8-2.5 2 1.1 2 2.5 2 2.5-.8 2.5-2"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z"/><path d="M18 3v16"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20M9 20l.5-2h5l.5 2"/></svg>',
  cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.4v5.2M18 9.4v5.2"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  unlock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-1.9"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/* edit-binding helper: produces data-edit attr only when admin can edit */
function ed(path) { return ` data-edit="${path}" `; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

let S; // active state

function $(id) { return document.getElementById(id); }

/* shared partner-logo row (real logos where available, white for dark bg) */
function partnerLogosHTML() {
  return `
    <div class="logo-item text">K-뉴딜</div>
    <div class="logo-item dv"><img src="assets/logo-develocket-white.png" alt="디벨로켓"></div>
    <div class="logo-item nx"><img src="assets/logo-nexon-white.png" alt="NEXON"></div>
    <div class="logo-item text">Claude</div>`;
}

/* ---------------- NAV ---------------- */
function renderNav() {
  const n = S.nav;
  const items = n.items.map((it, i) => `
    <a href="${esc(it.href)}" data-navitem="${i}"><span${ed("nav.items." + i + ".label")}>${esc(it.label)}</span></a>`).join("");
  $("nav").innerHTML = `
    <div class="container nav-inner">
      <a class="brand" href="#" aria-label="디벨로켓 × 넥슨">
        <span class="gov-tag"${ed("nav.govTag")}>${esc(n.govTag)}</span>
        <img class="brand-logo dv" src="assets/logo-develocket.png" alt="디벨로켓">
        <span class="logo-x">×</span>
        <img class="brand-logo nx" src="assets/logo-nexon.png" alt="NEXON">
      </a>
      <nav class="nav-menu" id="navMenu">${items}</nav>
      <button class="nav-lock" data-admin-login title="관리자 로그인">${window.ADMIN ? IC.unlock : IC.lock}</button>
      <button class="btn btn-primary nav-cta desktop" data-scroll="apply"><span${ed("nav.cta")}>${esc(n.cta)}</span></button>
      <button class="nav-burger" id="navBurger" aria-label="메뉴">${IC.menu}</button>
    </div>`;
  // mobile drawer
  $("mobileDrawer").innerHTML = `
    <div class="md-panel">
      <button class="md-close" id="mdClose">${IC.close}</button>
      ${n.items.map((it) => `<a href="${esc(it.href)}" data-mdlink>${esc(it.label)}</a>`).join("")}
      <button class="btn btn-primary btn-block" data-scroll="apply" style="margin-top:14px">${esc(n.cta)}</button>
    </div>`;
}

/* ---------------- HERO ---------------- */
function renderHero() {
  const h = S.hero;
  $("hero").innerHTML = `
    <div class="container hero-grid">
      <div class="hero-copy">
        <span class="hero-quest-tag"><i class="blink"></i><span${ed("hero.questTag")}>${esc(h.questTag)}</span></span>
        <h1><span${ed("hero.title")}>${esc(h.title)}</span><br><span${ed("hero.title2")}>${esc(h.title2)}</span> <span class="hl"${ed("hero.titleHl")}>${esc(h.titleHl)}</span></h1>
        <p class="hero-sub"${ed("hero.sub")}>${esc(h.sub)}</p>
        <div class="hero-cta">
          <button class="btn btn-gold btn-lg" data-scroll="apply"><span${ed("hero.ctaPrimary")}>${esc(h.ctaPrimary)}</span> ${IC.arrow}</button>
          <button class="btn btn-ghost btn-lg" data-scroll="curriculum"><span${ed("hero.ctaSecondary")}>${esc(h.ctaSecondary)}</span></button>
        </div>
        <div class="hero-chips">
          ${h.chips.map((c, i) => `<div class="hero-chip"><b${ed("hero.chips." + i + ".v")}>${esc(c.v)}</b><span${ed("hero.chips." + i + ".k")}>${esc(c.k)}</span></div>`).join("")}
        </div>
      </div>
      <div class="hero-visual">
        <div class="quest-card">
          <div class="qc-float"${ed("hero.cardFloat")}>${esc(h.cardFloat)}</div>
          <div class="qc-art"><video class="qc-video" src="assets/hero.mp4" autoplay loop muted playsinline preload="auto"></video></div>
          <div class="qc-body">
            <div class="qc-row"><span class="qc-title"${ed("hero.cardTitle")}>${esc(h.cardTitle)}</span><span class="qc-lv"${ed("hero.cardLv")}>${esc(h.cardLv)}</span></div>
            <div class="qc-xp"><i></i></div>
            <div class="qc-meta"><span${ed("hero.cardMetaL")}>${esc(h.cardMetaL)}</span><span${ed("hero.cardMetaR")}>${esc(h.cardMetaR)}</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="container trust-strip">
      <div class="tlabel"${ed("hero.trustLabel")}>${esc(h.trustLabel)}</div>
      <div class="logo-row">${partnerLogosHTML()}</div>
    </div>`;
}

/* ---------------- DEFINE ---------------- */
function renderDefine() {
  const d = S.define;
  $("define").innerHTML = `
    <div class="container define-inner">
      <span class="dlabel"${ed("define.label")}>${esc(d.label)}</span>
      <p class="dtext" data-edit-html="define.text">${d.text}</p>
    </div>`;
}

/* ---------------- EMPATHY ---------------- */
function renderEmpathy() {
  const e = S.empathy;
  $("empathy").innerHTML = `
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker"${ed("empathy.kicker")}>${esc(e.kicker)}</span>
        <h2${ed("empathy.title")}>${esc(e.title)}</h2>
        <p${ed("empathy.sub")}>${esc(e.sub)}</p>
      </div>
      <div class="empathy-log reveal">
        <div class="log-head"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="lt"${ed("empathy.logTitle")}>${esc(e.logTitle)}</span></div>
        <div class="empathy-items" data-list="empathy.items">
          ${e.items.map((it, i) => `
            <div class="empathy-item" data-li="${i}">
              <span class="chk">${IC.check}</span>
              <span class="et"${ed("empathy.items." + i)}>${esc(it)}</span>
              ${adminItemBtns("empathy.items", i)}
            </div>`).join("")}
        </div>
        ${adminAddBtn("empathy.items", "공감 항목 추가")}
      </div>
      <div class="empathy-turn reveal">
        <div class="t1"${ed("empathy.turn1")}>${esc(e.turn1)}</div>
        <div class="t2"${ed("empathy.turn2")}>${esc(e.turn2)}</div>
      </div>
    </div>`;
}

/* ---------------- SOLUTION ---------------- */
function renderSolution() {
  const s = S.solution;
  $("solution").innerHTML = `
    <div class="container">
      <span class="pop"${ed("solution.pop")}>${esc(s.pop)}</span>
      <h2><span${ed("solution.title")}>${esc(s.title)}</span><br><span class="hl"${ed("solution.titleHl")}>${esc(s.titleHl)}</span></h2>
      <p class="ssub"${ed("solution.sub")}>${esc(s.sub)}</p>
      <div class="region-row" data-list="solution.regions">
        ${s.regions.map((r, i) => `<span class="region-chip" data-li="${i}">${IC.pin}<span${ed("solution.regions." + i)}>${esc(r)}</span>${adminItemBtns("solution.regions", i)}</span>`).join("")}
      </div>
      ${adminAddBtnCenter("solution.regions", "지역 추가")}
      <div class="snote"${ed("solution.note")}>${esc(s.note)}</div>
    </div>`;
}

/* ---------------- CURRICULUM ---------------- */
function renderCurriculum() {
  const c = S.curriculum;
  $("curriculum").innerHTML = `
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker"${ed("curriculum.kicker")}>${esc(c.kicker)}</span>
        <h2${ed("curriculum.title")}>${esc(c.title)}</h2>
        <p${ed("curriculum.sub")}>${esc(c.sub)}</p>
      </div>
      <div class="quest-path" data-list="curriculum.steps">
        ${c.steps.map((st, i) => `
          <div class="step reveal ${st.hidden ? "hidden" : ""}" data-li="${i}">
            <div class="step-node"><b${ed("curriculum.steps." + i + ".lv")}>${esc((st.lv || "").replace("LV.", ""))}</b></div>
            <div class="step-card">
              <div class="stag"${ed("curriculum.steps." + i + ".tag")}>${esc(st.tag)}</div>
              <h3${ed("curriculum.steps." + i + ".title")}>${esc(st.title)}</h3>
              <p${ed("curriculum.steps." + i + ".desc")}>${esc(st.desc)}</p>
              ${adminItemBtns("curriculum.steps", i)}
            </div>
          </div>`).join("")}
      </div>
      ${adminAddBtnCenter("curriculum.steps", "STEP 추가")}
    </div>`;
}

/* ---------------- REWARDS (수업) ---------------- */
/* per-card accent by icon: 노트북=blue(기술) · Claude=clay(브랜드색) · 장려금=gold(보상) */
const REWARD_ACCENT = { laptop: "blue", sparkle: "clay", coin: "gold", cash: "gold", book: "violet" };
/* highlight the literal "100%" token (admin still edits plain text) */
function hl100(text) { return esc(text).replace(/100\s*%/g, '<span class="hl-100">100%</span>'); }

function renderRewards() {
  const r = S.rewards;
  $("rewards").innerHTML = `
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker"${ed("rewards.kicker")}>${esc(r.kicker)}</span>
        <h2${ed("rewards.title")}>${hl100(r.title)}</h2>
        <p${ed("rewards.sub")}>${esc(r.sub)}</p>
      </div>
      <div class="reward-grid" data-list="rewards.cards">
        ${r.cards.map((c, i) => {
          const acc = REWARD_ACCENT[c.icon] || "blue";
          return `
          <div class="reward-card reveal theme-${acc}" data-li="${i}">
            <span class="rshine ${acc}"></span>
            <span class="rtag">${IC.check}<span${ed("rewards.cards." + i + ".tag")}>${esc(c.tag)}</span></span>
            <div class="ricon ${acc}">${IC[c.icon] || IC.cash}</div>
            <div class="rvalue"><span${ed("rewards.cards." + i + ".value")}>${esc(c.value)}</span> <small${ed("rewards.cards." + i + ".unit")}>${esc(c.unit)}</small></div>
            <h3${ed("rewards.cards." + i + ".title")}>${esc(c.title)}</h3>
            <p${ed("rewards.cards." + i + ".desc")}>${esc(c.desc)}</p>
            ${adminItemBtns("rewards.cards", i)}
          </div>`;
        }).join("")}
      </div>
      ${adminAddBtnCenter("rewards.cards", "혜택 카드 추가")}
    </div>`;
}

/* ---------------- NEXON ---------------- */
function renderNexon() {
  const n = S.nexon;
  $("nexon").innerHTML = `
    <div class="container">
      <div class="section-head reveal">
        <span class="exclusive"${ed("nexon.exclusive")}>${esc(n.exclusive)}</span>
        <h2${ed("nexon.title")}>${esc(n.title)}</h2>
        <p${ed("nexon.sub")}>${esc(n.sub)}</p>
      </div>
      <div class="nexon-grid" data-list="nexon.cards">
        ${n.cards.map((c, i) => `
          <div class="nexon-card reveal" data-li="${i}">
            <div class="nc-art"><image-slot id="${esc(c.slot || "nexon-" + i)}" shape="rect"${c.art ? ` src="${esc(c.art)}"` : ""} placeholder="이미지 드래그"></image-slot></div>
            <div class="nc-body">
              <div class="nc-tag"${ed("nexon.cards." + i + ".tag")}>${esc(c.tag)}</div>
              <div class="nc-strong"${ed("nexon.cards." + i + ".strong")}>${esc(c.strong)}</div>
              <h3${ed("nexon.cards." + i + ".title")}>${esc(c.title)}</h3>
              <p${ed("nexon.cards." + i + ".desc")}>${esc(c.desc)}</p>
              ${adminItemBtns("nexon.cards", i)}
            </div>
          </div>`).join("")}
      </div>
      ${adminAddBtnCenter("nexon.cards", "넥슨 혜택 추가")}
      <div class="maple-banner reveal">
        <div class="mb-logo"><img src="assets/logo-maple.png" alt="메이플스토리"></div>
        <div class="mb-text">
          <span class="mb-tag"${ed("nexon.mapleBanner.tag")}>${esc(n.mapleBanner.tag)}</span>
          <h3${ed("nexon.mapleBanner.title")}>${esc(n.mapleBanner.title)}</h3>
          <p${ed("nexon.mapleBanner.desc")}>${esc(n.mapleBanner.desc)}</p>
        </div>
      </div>
    </div>`;
}

/* ---------------- ELIGIBILITY ---------------- */
function renderEligibility() {
  const e = S.eligibility;
  $("eligibility").innerHTML = `
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker violet"${ed("eligibility.kicker")}>${esc(e.kicker)}</span>
        <h2${ed("eligibility.title")}>${esc(e.title)}</h2>
        <p${ed("eligibility.sub")}>${esc(e.sub)}</p>
      </div>
      <div class="elig-grid" data-list="eligibility.cards">
        ${e.cards.map((c, i) => `
          <div class="elig-card reveal" data-li="${i}">
            <div class="eicon">${IC[c.icon] || IC.pin}</div>
            <h3${ed("eligibility.cards." + i + ".title")}>${esc(c.title)}</h3>
            <p${ed("eligibility.cards." + i + ".desc")}>${esc(c.desc)}</p>
            ${adminItemBtns("eligibility.cards", i)}
          </div>`).join("")}
      </div>
      ${adminAddBtnCenter("eligibility.cards", "지원자격 추가")}
    </div>`;
}

/* ---------------- MID CTA ---------------- */
function renderMidCta() {
  const m = S.midCta;
  $("midCta").innerHTML = `
    <div class="container cb-inner">
      <h2${ed("midCta.title")}>${esc(m.title)}</h2>
      <p${ed("midCta.sub")}>${esc(m.sub)}</p>
      <button class="btn btn-gold btn-lg" data-scroll="apply"><span${ed("midCta.button")}>${esc(m.button)}</span> ${IC.arrow}</button>
    </div>`;
}

/* ---------------- FAQ ---------------- */
function renderFaq() {
  const f = S.faq;
  $("faq").innerHTML = `
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker"${ed("faq.kicker")}>${esc(f.kicker)}</span>
        <h2${ed("faq.title")}>${esc(f.title)}</h2>
        <p${ed("faq.sub")}>${esc(f.sub)}</p>
      </div>
      <div class="faq-list" data-list="faq.items">
        ${f.items.map((it, i) => `
          <div class="faq-item reveal" data-li="${i}">
            <button class="faq-q" data-faq="${i}"><span class="qmark">Q</span><span${ed("faq.items." + i + ".q")}>${esc(it.q)}</span><span class="qchev">${IC.chev}</span></button>
            <div class="faq-a"><div class="inner"${ed("faq.items." + i + ".a")}>${esc(it.a)}</div></div>
            ${adminItemBtns("faq.items", i)}
          </div>`).join("")}
      </div>
      ${adminAddBtnCenter("faq.items", "FAQ 추가")}
      <div class="faq-blog">
        <a href="${esc(f.blogHref)}" target="_blank">${IC.book}<span${ed("faq.blogText")}>${esc(f.blogText)}</span> ${IC.arrow}</a>
      </div>
    </div>`;
}

/* ---------------- APPLY ---------------- */
function renderApply() {
  const a = S.apply;
  const regions = S.solution.regions;
  $("apply").innerHTML = `
    <div class="container apply-wrap">
      <div class="apply-card" id="applyCard">
        <form class="apply-form" id="applyForm">
          <span class="ac-deadline">● <span${ed("apply.deadline")}>${esc(a.deadline)}</span></span>
          <h3${ed("apply.title")}>${esc(a.title)}</h3>
          <p class="ac-sub"${ed("apply.sub")}>${esc(a.sub)}</p>
          <div class="form-grid">
            <div class="field"><label>이름</label><input type="text" required placeholder="홍길동"></div>
            <div class="field"><label>연락처</label><input type="tel" required placeholder="010-0000-0000"></div>
            <div class="field"><label${ed("apply.regionLabel")}>${esc(a.regionLabel)}</label>
              <select required>${regions.map((r) => `<option>${esc(r)}</option>`).join("")}</select></div>
            <div class="field"><label>현재 상태</label>
              <select required><option>구직 중</option><option>미취업 / 휴식 중</option><option>재학 / 졸업 예정</option><option>기타</option></select></div>
          </div>
          <label class="consent"><input type="checkbox" required><span${ed("apply.consent")}>${esc(a.consent)}</span></label>
          <button type="submit" class="btn btn-primary btn-lg btn-block"><span${ed("apply.button")}>${esc(a.button)}</span> ${IC.arrow}</button>
        </form>
        <div class="apply-success">
          <div class="as-badge">${IC.check}</div>
          <h3${ed("apply.successTitle")}>${esc(a.successTitle)}</h3>
          <p${ed("apply.successMsg")}>${esc(a.successMsg)}</p>
        </div>
      </div>
    </div>`;
}

/* ---------------- FOOTER ---------------- */
function renderFooter() {
  const f = S.footer;
  $("footer").innerHTML = `
    <div class="container">
      <div class="footer-top">
        <div>
          <div class="f-brand"${ed("footer.brand")}>${esc(f.brand)}</div>
          <div class="f-desc"${ed("footer.desc")}>${esc(f.desc)}</div>
        </div>
        <div class="footer-logos">${partnerLogosHTML()}</div>
      </div>
      <div class="footer-legal">
        <div class="gov-line"${ed("footer.govLine")}>${esc(f.govLine)}</div>
        <div${ed("footer.legal")}>${esc(f.legal)}</div>
      </div>
    </div>`;
}

/* ---------------- STICKY BAR ---------------- */
function renderSticky() {
  const s = S.sticky;
  $("stickyBar").innerHTML = `
    <div class="container sticky-inner">
      <div class="sb-text"><b${ed("sticky.text")}>${esc(s.text)}</b><span${ed("sticky.sub")}>${esc(s.sub)}</span></div>
      <button class="btn btn-gold" data-scroll="apply"><span${ed("sticky.button")}>${esc(s.button)}</span> ${IC.arrow}</button>
    </div>`;
}

/* ---------------- full render ---------------- */
function renderAll() {
  renderNav(); renderHero(); renderDefine(); renderEmpathy(); renderSolution();
  renderCurriculum(); renderRewards(); renderNexon(); renderEligibility();
  renderMidCta(); renderFaq(); renderApply(); renderFooter(); renderSticky();
  if (window.afterRender) window.afterRender();
}
