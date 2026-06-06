let allCookies = [];
let currentStoreId = null;
let openDomains = new Set();

const $ = id => document.getElementById(id);

function containerIcon(color) {
  const m = { blue:'🔵', turquoise:'🟦', green:'🟢', yellow:'🟡',
               orange:'🟠', red:'🔴', pink:'🩷', purple:'🟣' };
  return m[color] || '⚪';
}

function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'title') e.title = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') e.appendChild(document.createTextNode(child));
    else if (child) e.appendChild(child);
  }
  return e;
}

// Two-click confirm for destructive actions.
// 1st click: button text → "Confirm? 3s" (countdown), turns red.
// 2nd click within `timeoutMs`: runs `action()`.
// Otherwise: restores original text/style.
function confirmClick(btn, action, timeoutMs = 3000) {
  if (btn.dataset.confirming) {
    if (btn._confirmTimer) {
      clearTimeout(btn._confirmTimer);
      clearInterval(btn._confirmInterval);
    }
    btn._confirmTimer = btn._confirmInterval = null;
    btn.textContent = btn._originalText;
    btn.classList.remove('confirming');
    delete btn.dataset.confirming;
    action();
    return;
  }
  btn._originalText = btn.textContent;
  btn.dataset.confirming = '1';
  btn.classList.add('confirming');
  let remaining = Math.ceil(timeoutMs / 1000);
  btn.textContent = `Confirm? ${remaining}s`;
  btn._confirmInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) btn.textContent = `Confirm? ${remaining}s`;
  }, 1000);
  btn._confirmTimer = setTimeout(() => {
    clearInterval(btn._confirmInterval);
    btn._confirmTimer = btn._confirmInterval = null;
    btn.textContent = btn._originalText;
    btn.classList.remove('confirming');
    delete btn.dataset.confirming;
  }, timeoutMs);
}

async function init() {
  await loadContainers();
  $('containerSelect').addEventListener('change', onContainerChange);
  $('refreshBtn').addEventListener('click', () => loadCookies(currentStoreId));
  $('copyAllBtn').addEventListener('click', copyAll);
  $('clearAllBtn').addEventListener('click', () => confirmClick($('clearAllBtn'), clearAll));
  $('searchInput').addEventListener('input', render);

  const sel = $('containerSelect');
  if (sel.options.length > 0) {
    sel.selectedIndex = 0;
    onContainerChange();
  }
}

async function loadContainers() {
  const sel = $('containerSelect');
  sel.innerHTML = '';

  const opt = document.createElement('option');
  opt.value = 'firefox-default';
  opt.textContent = '🌐  No container';
  sel.appendChild(opt);

  try {
    const identities = await browser.contextualIdentities.query({});
    for (const c of identities) {
      const o = document.createElement('option');
      o.value = c.cookieStoreId;
      o.textContent = `${containerIcon(c.color)}  ${c.name}`;
      sel.appendChild(o);
    }
  } catch (e) {
    setStatus('Could not load containers: ' + e.message, true);
  }
}

async function onContainerChange() {
  currentStoreId = $('containerSelect').value;
  openDomains.clear();
  await loadCookies(currentStoreId);
}

async function loadCookies(storeId) {
  $('clearAllBtn').disabled = true;
  $('copyAllBtn').disabled = true;
  $('cookieList').innerHTML = '';
  $('cookieList').appendChild(el('div', {class: 'empty', text: 'Loading…'}));
  setStatus('');
  try {
    allCookies = await browser.cookies.getAll({ storeId });
    $('clearAllBtn').disabled = allCookies.length === 0;
    $('copyAllBtn').disabled = allCookies.length === 0;
    render();
  } catch (e) {
    setStatus('Error: ' + e.message, true);
  }
}

function render() {
  const query = $('searchInput').value.toLowerCase().trim();
  const list = $('cookieList');

  const filtered = query
    ? allCookies.filter(c =>
        c.domain.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query))
    : allCookies;

  $('stats').textContent = filtered.length === allCookies.length
    ? `${allCookies.length} cookies`
    : `${filtered.length} of ${allCookies.length} cookies`;

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.appendChild(el('div', {class: 'empty', text: 'No cookies found'}));
    $('footerCount').textContent = '';
    return;
  }

  const byDomain = {};
  for (const c of filtered) {
    const d = c.domain.replace(/^\./, '');
    (byDomain[d] = byDomain[d] || []).push(c);
  }

  const domains = Object.keys(byDomain).sort();

  for (const domain of domains) {
    const cookies = byDomain[domain];
    const isOpen = openDomains.has(domain);

    const group = el('div', {class: 'domain-group'});

    // header
    const chevron = el('span', {class: 'chevron' + (isOpen ? ' open' : ''), text: '▶'});
    const domainName = el('span', {class: 'domain-name', text: domain});
    const domainCount = el('span', {class: 'domain-count', text: String(cookies.length)});
    const domainCopy = el('button', {class: 'domain-copy', title: 'Copy all cookies for this domain (JSON)', text: '📋 copy'});
    const domainDel = el('button', {class: 'domain-del', title: 'Delete all cookies for this domain', text: '✕ delete'});
    const header = el('div', {class: 'domain-header'}, chevron, domainName, domainCount, domainCopy, domainDel);

    // items
    const items = el('div', {class: 'cookie-items' + (isOpen ? ' open' : '')});

    for (const cookie of cookies) {
      const preview = cookie.value.length > 38
        ? cookie.value.slice(0, 38) + '…' : (cookie.value || '(empty)');
      const nameSpan = el('span', {class: 'cookie-name', title: cookie.name, text: cookie.name});
      const valSpan  = el('span', {class: 'cookie-val',  title: cookie.value, text: preview});
      const copyBtn  = el('button', {class: 'cookie-copy', title: 'Copy cookie (JSON)', text: 'copy'});
      const delBtn   = el('button', {class: 'cookie-del', title: 'Delete', text: 'delete'});
      const item     = el('div', {class: 'cookie-item'}, nameSpan, valSpan, copyBtn, delBtn);

      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        confirmClick(delBtn, () => deleteCookie(cookie));
      });
      copyBtn.addEventListener('click', e => {
        e.stopPropagation();
        const text = formatSingleCookie(cookie);
        const ok = copyToClipboard(text);
        flashCopied(copyBtn, ok, 'cookie');
      });
      // Tint the whole row on button hover so the user can visually
      // evaluate what will be copied / deleted.
      copyBtn.addEventListener('mouseenter', () => item.classList.add('preview-copy'));
      copyBtn.addEventListener('mouseleave', () => item.classList.remove('preview-copy'));
      delBtn.addEventListener('mouseenter',  () => item.classList.add('preview-del'));
      delBtn.addEventListener('mouseleave',  () => item.classList.remove('preview-del'));
      nameSpan.addEventListener('click', e => {
        e.stopPropagation();
        const ok = copyToClipboard(cookie.name);
        flashCopiedSpan(nameSpan, ok, 'name');
      });
      valSpan.addEventListener('click', e => {
        e.stopPropagation();
        if (!cookie.value) {
          setStatus('Empty value', true);
          return;
        }
        const ok = copyToClipboard(cookie.value);
        flashCopiedSpan(valSpan, ok, 'value');
      });
      items.appendChild(item);
    }

    header.addEventListener('click', e => {
      if (e.target === domainDel || e.target === domainCopy) return;
      if (openDomains.has(domain)) {
        openDomains.delete(domain);
        items.classList.remove('open');
        chevron.classList.remove('open');
      } else {
        openDomains.add(domain);
        items.classList.add('open');
        chevron.classList.add('open');
      }
    });

    domainDel.addEventListener('click', e => {
      e.stopPropagation();
      confirmClick(domainDel, async () => {
        // Batch + yield: in slow IPC environments (KVM guest, Firefox 140
        // IPC regression) a tight parallel delete loop still freezes the
        // popup. Processing in small batches with an event-loop yield
        // between keeps the popup repainting and clickable during the run.
        const { total, failed } = await deleteCookiesBatched(cookies);
        setStatus(
          failed
            ? `Deleted ${total - failed}/${total} cookies for ${domain}`
            : `✓ Deleted all cookies for ${domain}`,
          failed > 0
        );
        await loadCookies(currentStoreId);
      });
    });

    domainCopy.addEventListener('click', e => {
      e.stopPropagation();
      const text = formatDomainCookies(domain, cookies);
      const ok = copyToClipboard(text);
      flashCopied(domainCopy, ok, `${cookies.length} cookies of ${domain}`);
    });

    // Tint the whole domain group on button hover so the user can
    // visually see exactly which cookies will be copied / deleted.
    domainCopy.addEventListener('mouseenter', () => group.classList.add('preview-copy'));
    domainCopy.addEventListener('mouseleave', () => group.classList.remove('preview-copy'));
    domainDel.addEventListener('mouseenter',  () => group.classList.add('preview-del'));
    domainDel.addEventListener('mouseleave',  () => group.classList.remove('preview-del'));

    group.appendChild(header);
    group.appendChild(items);
    list.appendChild(group);
  }

  $('footerCount').textContent = `${domains.length} domain${domains.length !== 1 ? 's' : ''}`;
}

// Delete many cookies in small parallel batches, yielding to the event
// loop between batches. In a tight delete loop the popup would otherwise
// appear frozen on slow IPC stacks (e.g. Firefox 140 running in a KVM
// guest, where each cookies.remove roundtrip has measurable overhead).
// Returns { total, failed }.
async function deleteCookiesBatched(cookies, batchSize = 8) {
  const args = cookies.map(c => ({
    url: `${c.secure ? 'https' : 'http'}://${c.domain.replace(/^\./, '')}${c.path}`,
    name: c.name,
    storeId: c.storeId,
  }));
  let failed = 0;
  for (let i = 0; i < args.length; i += batchSize) {
    const batch = args.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(a => browser.cookies.remove(a))
    );
    failed += results.filter(r => r.status === 'rejected').length;
    // Yield to the event loop so the popup can repaint and process clicks.
    await new Promise(r => setTimeout(r, 0));
  }
  return { total: cookies.length, failed };
}

async function deleteCookie(cookie, reload = true) {
  const protocol = cookie.secure ? 'https' : 'http';
  const domain = cookie.domain.replace(/^\./, '');
  const url = `${protocol}://${domain}${cookie.path}`;
  try {
    await browser.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId });
    if (reload) {
      setStatus(`✓ Deleted: ${cookie.name}`);
      await loadCookies(currentStoreId);
    }
  } catch (e) {
    setStatus('Delete failed: ' + e.message, true);
  }
}

async function clearAll() {
  const count = allCookies.length;
  $('clearAllBtn').disabled = true;
  // Batch + yield: see deleteCookiesBatched / domainDel handler.
  const { total, failed } = await deleteCookiesBatched(allCookies);
  setStatus(
    failed
      ? `Cleared ${count - failed}/${count} cookies`
      : `✓ Cleared ${count} cookies`,
    failed > 0
  );
  await loadCookies(currentStoreId);
}

function setStatus(msg, isErr = false) {
  const el = $('footerStatus');
  el.textContent = msg;
  el.className = isErr ? 'status err' : 'status';
}

// Universal format: JSON.
// Single cookie & all cookies of a domain share the same shape:
//   { "domain": "...", "cookies": [{ "name": "...", "value": "..." }, ...] }
// All domains of a container are an array of such entries, sorted by domain.
function buildDomainEntry(domain, cookies) {
  return {
    domain,
    cookies: cookies.map(c => ({ name: c.name, value: c.value })),
  };
}

function formatSingleCookie(cookie) {
  const domain = cookie.domain.replace(/^\./, '');
  return JSON.stringify(buildDomainEntry(domain, [cookie]), null, 2);
}

function formatDomainCookies(domain, cookies) {
  return JSON.stringify(buildDomainEntry(domain, cookies), null, 2);
}

function formatContainerCookies(cookies) {
  const byDomain = {};
  for (const c of cookies) {
    const d = c.domain.replace(/^\./, '');
    (byDomain[d] = byDomain[d] || []).push(c);
  }
  const domains = Object.keys(byDomain).sort();
  return JSON.stringify(
    domains.map(d => buildDomainEntry(d, byDomain[d])),
    null, 2
  );
}

function copyAll() {
  const text = formatContainerCookies(allCookies);
  const ok = copyToClipboard(text);
  flashCopied($('copyAllBtn'), ok, `${allCookies.length} cookies of container`);
}

function copyToClipboard(text) {
  // navigator.clipboard works in extension popups in modern Firefox
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return true;
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function flashCopied(btn, ok, label) {
  const original = btn.textContent;
  btn.textContent = ok ? '✓' : '✕';
  btn.classList.add('copied');
  setStatus(ok ? `✓ Copied ${label}` : 'Copy failed', !ok);
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('copied');
  }, 1000);
}

function flashCopiedSpan(span, ok, label) {
  span.classList.add('copied');
  setStatus(ok ? `✓ Copied ${label}` : 'Copy failed', !ok);
  setTimeout(() => span.classList.remove('copied'), 1000);
}

init();
