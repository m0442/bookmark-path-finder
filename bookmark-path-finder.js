javascript:(async function () {
  const MAX_CONCURRENCY = 8;
  const TIMEOUT_MS = 8000;
  const MAX_TEXT_SIZE = 2_000_000; // 2MB per resource
  const EXCLUDE_EXT = /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|mp4|mp3|pdf)(\?|#|$)/i;

  // ---------- UI ----------
  const old = document.getElementById("__path_scanner_panel__");
  if (old) old.remove();

  const panel = document.createElement("div");
  panel.id = "__path_scanner_panel__";
  panel.style.cssText = `
    position:fixed; inset:auto 12px 12px 12px;
    max-height:55vh; background:#0b0f14; color:#e6edf3;
    z-index:999999; border:1px solid rgba(255,255,255,.12);
    border-radius:14px; box-shadow:0 18px 50px rgba(0,0,0,.55);
    font: 13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial;
    overflow:hidden;
  `;
  panel.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08);">
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div style="font-weight:700;font-size:14px;">🔎 Path Scanner</div>
        <div id="__ps_status__" style="opacity:.8;font-size:12px;">Starting…</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="__ps_copy__" style="cursor:pointer;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e6edf3;">Copy</button>
        <button id="__ps_close__" style="cursor:pointer;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e6edf3;">Close</button>
      </div>
    </div>

    <div style="padding:12px 14px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;border-bottom:1px solid rgba(255,255,255,.08);">
      <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);">
        <div style="opacity:.75;font-size:12px;">Resources</div><div id="__ps_res__" style="font-weight:800;font-size:18px;">0</div>
      </div>
      <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);">
        <div style="opacity:.75;font-size:12px;">Fetched OK</div><div id="__ps_ok__" style="font-weight:800;font-size:18px;">0</div>
      </div>
      <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);">
        <div style="opacity:.75;font-size:12px;">Failed</div><div id="__ps_fail__" style="font-weight:800;font-size:18px;">0</div>
      </div>
      <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);">
        <div style="opacity:.75;font-size:12px;">Unique Paths</div><div id="__ps_paths__" style="font-weight:800;font-size:18px;">0</div>
      </div>
    </div>

    <div style="padding:10px 14px;display:flex;gap:10px;align-items:center;border-bottom:1px solid rgba(255,255,255,.08);">
      <input id="__ps_search__" placeholder="Filter paths… (/api, .js, assets…)" style="flex:1;min-width:0;padding:9px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e6edf3;outline:none;">
      <div style="display:flex;gap:6px;">
        <button class="__ps_tab__" data-tab="all" style="cursor:pointer;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.12);color:#e6edf3;">All</button>
        <button class="__ps_tab__" data-tab="api" style="cursor:pointer;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e6edf3;">API</button>
        <button class="__ps_tab__" data-tab="assets" style="cursor:pointer;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e6edf3;">Assets</button>
        <button class="__ps_tab__" data-tab="imports" style="cursor:pointer;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e6edf3;">Imports</button>
        <button class="__ps_tab__" data-tab="other" style="cursor:pointer;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e6edf3;">Other</button>
      </div>
    </div>

    <div style="padding:12px 14px;overflow:auto;max-height:calc(55vh - 176px);">
      <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
        <thead>
          <tr style="text-align:left;opacity:.8;font-size:12px;">
            <th style="padding:0 10px;">Type</th>
            <th style="padding:0 10px;">Path</th>
            <th style="padding:0 10px;">Source</th>
          </tr>
        </thead>
        <tbody id="__ps_tbody__"></tbody>
      </table>
      <div id="__ps_empty__" style="display:none;opacity:.7;padding:10px;">No results.</div>
    </div>
  `;
  document.body.appendChild(panel);

  const statusEl = panel.querySelector("#__ps_status__");
  const resEl = panel.querySelector("#__ps_res__");
  const okEl = panel.querySelector("#__ps_ok__");
  const failEl = panel.querySelector("#__ps_fail__");
  const pathsEl = panel.querySelector("#__ps_paths__");
  const tbody = panel.querySelector("#__ps_tbody__");
  const emptyEl = panel.querySelector("#__ps_empty__");
  const searchEl = panel.querySelector("#__ps_search__");

  panel.querySelector("#__ps_close__").onclick = () => panel.remove();

  // ---------- Helpers ----------
  function classify(path) {
    const p = path.toLowerCase();
    if (p.startsWith("/api") || p.includes("/api/")) return "api";
    if (/\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|mp4|mp3|pdf)(\?|#|$)/i.test(p) || p.includes("/assets") || p.includes("/static")) return "assets";
    if (/\.(js|mjs|cjs|css|map|json)(\?|#|$)/i.test(p) || p.startsWith("./") || p.startsWith("../")) return "imports";
    return "other";
  }

  function isLikelyTextResource(url) {
    if (!url) return false;
    if (EXCLUDE_EXT.test(url)) return false;
    return true;
  }

  function cleanPath(raw) {
    if (!raw) return null;
    let s = raw.trim();

    // remove trailing punctuation
    s = s.replace(/[),;]+$/g, "");

    // normalize
    if (s.length < 2 || s.length > 300) return null;

    // allow: relative, root paths, and template strings
    const ok =
      s.startsWith("/") ||
      s.startsWith("./") ||
      s.startsWith("../") ||
      s.startsWith("api/") ||
      s.includes("/api/");

    if (!ok) return null;

    // no spaces
    if (/\s/.test(s)) return null;

    return s;
  }

  function extractPaths(text) {
    const out = new Set();

    // 1) quoted relative/root paths
    const reQuoted = /['"]((?:\/|\.\.\/|\.\/)[^'"]{1,300})['"]/g;
    for (const m of text.matchAll(reQuoted)) out.add(m[1]);

    // 2) template strings with root/relative paths
    const reTpl = /`((?:\/|\.\.\/|\.\/)[^`]{1,300})`/g;
    for (const m of text.matchAll(reTpl)) out.add(m[1]);

    // 3) fetch / axios / jquery patterns: fetch("..."), axios.get("..."), $.get("...")
    const reHttpCalls = /\b(?:fetch|axios\.(?:get|post|put|delete|patch)|\$\.(?:get|post))\s*\(\s*([`'"])(.{1,300}?)\1/g;
    for (const m of text.matchAll(reHttpCalls)) out.add(m[2]);

    // 4) XHR open: xhr.open("GET", "/api/..")
    const reXhr = /\.open\s*\(\s*['"](GET|POST|PUT|DELETE|PATCH)['"]\s*,\s*([`'"])(.{1,300}?)\2/g;
    for (const m of text.matchAll(reXhr)) out.add(m[3]);

    // 5) import/require
    const reImport = /\b(?:import\s+(?:[^'"]+\s+from\s+)?|require\s*\()\s*([`'"])(.{1,300}?)\1/g;
    for (const m of text.matchAll(reImport)) out.add(m[2]);

    // cleanup & filter
    const cleaned = [];
    for (const p of out) {
      const cp = cleanPath(p);
      if (cp) cleaned.push(cp);
    }
    return cleaned;
  }

  async function fetchText(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(url, { signal: controller.signal, credentials: "include" });
      if (!r.ok) return { ok: false, text: null, status: r.status };
      const ct = (r.headers.get("content-type") || "").toLowerCase();

      // If it looks like binary, skip
      if (ct.includes("image/") || ct.includes("font/") || ct.includes("audio/") || ct.includes("video/") || ct.includes("application/pdf")) {
        return { ok: false, text: null, status: "binary" };
      }

      const text = await r.text();
      if (text.length > MAX_TEXT_SIZE) return { ok: false, text: null, status: "too_large" };
      return { ok: true, text, status: r.status };
    } catch (e) {
      return { ok: false, text: null, status: e && e.name === "AbortError" ? "timeout" : "error" };
    } finally {
      clearTimeout(timer);
    }
  }

  function uniqPush(map, path, source) {
    const key = path;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(source);
  }

  function render(rows, currentTab, q) {
    tbody.innerHTML = "";
    emptyEl.style.display = "none";

    const query = (q || "").trim().toLowerCase();
    let filtered = rows;

    if (currentTab !== "all") filtered = filtered.filter(r => r.type === currentTab);
    if (query) {
      filtered = filtered.filter(r =>
        r.path.toLowerCase().includes(query) || r.source.toLowerCase().includes(query) || r.type.includes(query)
      );
    }

    if (!filtered.length) {
      emptyEl.style.display = "block";
      return;
    }

    for (const r of filtered) {
      const tr = document.createElement("tr");
      tr.style.cssText = `
        background:rgba(255,255,255,.04);
        border:1px solid rgba(255,255,255,.08);
      `;
      tr.innerHTML = `
        <td style="padding:10px;border-radius:12px 0 0 12px;white-space:nowrap;">
          <span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);font-size:12px;">
            ${r.type.toUpperCase()}
          </span>
        </td>
        <td style="padding:10px;word-break:break-word;font-weight:650;">${escapeHtml(r.path)}</td>
        <td style="padding:10px;border-radius:0 12px 12px 0;opacity:.85;word-break:break-word;">
          ${escapeHtml(r.source)}
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
  }

  // ---------- Tabs ----------
  let currentTab = "all";
  for (const btn of panel.querySelectorAll(".__ps_tab__")) {
    btn.onclick = () => {
      for (const b of panel.querySelectorAll(".__ps_tab__")) b.style.background = "rgba(255,255,255,.06)";
      btn.style.background = "rgba(255,255,255,.12)";
      currentTab = btn.dataset.tab;
      render(globalRows, currentTab, searchEl.value);
    };
  }
  searchEl.oninput = () => render(globalRows, currentTab, searchEl.value);

  // ---------- Copy ----------
  panel.querySelector("#__ps_copy__").onclick = async () => {
    try {
      const lines = globalRows.map(r => `${r.type}\t${r.path}\t${r.source}`);
      await navigator.clipboard.writeText(lines.join("\n"));
      statusEl.textContent = "✅ Copied to clipboard";
      setTimeout(() => (statusEl.textContent = lastStatus), 1200);
    } catch {
      alert("Copy failed. (Clipboard permission denied)");
    }
  };

  // ---------- Scan ----------
  let okCount = 0, failCount = 0;
  let lastStatus = "";

  function setStatus(msg) {
    lastStatus = msg;
    statusEl.textContent = msg;
  }

  // 1) resources list
  const resources = performance.getEntriesByType("resource").map(r => r.name).filter(Boolean);
  resEl.textContent = String(resources.length);

  // 2) map path -> sources
  const pathToSources = new Map();

  // 3) scan current HTML too (very useful)
  setStatus("Scanning current DOM/HTML…");
  const htmlText = document.documentElement ? document.documentElement.outerHTML : "";
  for (const p of extractPaths(htmlText)) uniqPush(pathToSources, p, "DOM/HTML");

  // 4) scan resources (text-likely only)
  const targets = resources.filter(isLikelyTextResource);
  setStatus(`Scanning ${targets.length} text-like resources…`);

  // simple concurrency pool
  let idx = 0;
  const seenResources = new Set();

  async function worker() {
    while (idx < targets.length) {
      const url = targets[idx++];
      if (seenResources.has(url)) continue;
      seenResources.add(url);

      const r = await fetchText(url);
      if (!r.ok || !r.text) {
        failCount++;
        failEl.textContent = String(failCount);
        continue;
      }

      okCount++;
      okEl.textContent = String(okCount);

      const paths = extractPaths(r.text);
      for (const p of paths) uniqPush(pathToSources, p, url);

      // live update
      pathsEl.textContent = String(pathToSources.size);
      setStatus(`OK: ${okCount}, Failed: ${failCount}, Paths: ${pathToSources.size}`);
    }
  }

  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, targets.length) }, () => worker());
  await Promise.all(workers);

  // 5) flatten rows with best source
  const rows = [];
  for (const [path, sourcesSet] of pathToSources.entries()) {
    const sources = Array.from(sourcesSet);
    const type = classify(path);

    // choose a short source display: show DOM first, else first resource
    let source = sources.includes("DOM/HTML") ? "DOM/HTML" : sources[0];
    if (sources.length > 1) source += ` (+${sources.length - 1})`;

    rows.push({ type, path, source });
  }

  // sort: API first, then assets, then imports, then other, alphabetically
  const order = { api: 0, assets: 1, imports: 2, other: 3 };
  rows.sort((a, b) => (order[a.type] - order[b.type]) || a.path.localeCompare(b.path));

  // expose to UI
  window.__PATH_SCANNER_RESULTS__ = rows;

  // store global for render/copy
  var globalRows = rows;

  pathsEl.textContent = String(rows.length);
  setStatus(`Done ✅ — Found ${rows.length} unique paths`);
  render(globalRows, currentTab, "");

})(); 
