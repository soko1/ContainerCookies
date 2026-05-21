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

async function init() {
  await loadContainers();
  $('containerSelect').addEventListener('change', onContainerChange);
  $('refreshBtn').addEventListener('click', () => loadCookies(currentStoreId));
  $('clearAllBtn').addEventListener('click', clearAll);
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
  $('cookieList').innerHTML = '';
  $('cookieList').appendChild(el('div', {class: 'empty', text: 'Loading…'}));
  setStatus('');
  try {
    allCookies = await browser.cookies.getAll({ storeId });
    $('clearAllBtn').disabled = allCookies.length === 0;
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
    const domainDel = el('button', {class: 'domain-del', title: 'Delete all cookies for this domain', text: '✕ all'});
    const header = el('div', {class: 'domain-header'}, chevron, domainName, domainCount, domainDel);

    // items
    const items = el('div', {class: 'cookie-items' + (isOpen ? ' open' : '')});

    for (const cookie of cookies) {
      const preview = cookie.value.length > 38
        ? cookie.value.slice(0, 38) + '…' : (cookie.value || '(empty)');
      const nameSpan = el('span', {class: 'cookie-name', title: cookie.name, text: cookie.name});
      const valSpan  = el('span', {class: 'cookie-val',  title: cookie.value, text: preview});
      const delBtn   = el('button', {class: 'cookie-del', title: 'Delete', text: '✕'});
      const item     = el('div', {class: 'cookie-item'}, nameSpan, valSpan, delBtn);

      delBtn.addEventListener('click', async e => {
        e.stopPropagation();
        await deleteCookie(cookie);
      });
      items.appendChild(item);
    }

    header.addEventListener('click', e => {
      if (e.target === domainDel) return;
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

    domainDel.addEventListener('click', async e => {
      e.stopPropagation();
      for (const c of cookies) await deleteCookie(c, false);
      setStatus(`✓ Deleted all cookies for ${domain}`);
      await loadCookies(currentStoreId);
    });

    group.appendChild(header);
    group.appendChild(items);
    list.appendChild(group);
  }

  $('footerCount').textContent = `${domains.length} domain${domains.length !== 1 ? 's' : ''}`;
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
  for (const c of allCookies) await deleteCookie(c, false);
  setStatus(`✓ Cleared ${count} cookies`);
  await loadCookies(currentStoreId);
}

function setStatus(msg, isErr = false) {
  const el = $('footerStatus');
  el.textContent = msg;
  el.className = isErr ? 'status err' : 'status';
}

init();
