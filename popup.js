let allCookies = [];
let currentStoreId = null;
let openDomains = new Set();

const $ = id => document.getElementById(id);

function containerIcon(color) {
  const m = { blue:'🔵', turquoise:'🟦', green:'🟢', yellow:'🟡',
               orange:'🟠', red:'🔴', pink:'🩷', purple:'🟣' };
  return m[color] || '⚪';
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
  $('cookieList').innerHTML = '<div class="empty">Loading…</div>';
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

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty">No cookies found</div>';
    $('footerCount').textContent = '';
    return;
  }

  const byDomain = {};
  for (const c of filtered) {
    const d = c.domain.replace(/^\./, '');
    (byDomain[d] = byDomain[d] || []).push(c);
  }

  const domains = Object.keys(byDomain).sort();
  list.innerHTML = '';

  for (const domain of domains) {
    const cookies = byDomain[domain];
    const isOpen = openDomains.has(domain);

    const group = document.createElement('div');
    group.className = 'domain-group';

    const header = document.createElement('div');
    header.className = 'domain-header';
    header.innerHTML = `
      <span class="chevron ${isOpen ? 'open' : ''}">▶</span>
      <span class="domain-name">${domain}</span>
      <span class="domain-count">${cookies.length}</span>
      <button class="domain-del" title="Delete all cookies for this domain">✕ all</button>
    `;

    const items = document.createElement('div');
    items.className = `cookie-items ${isOpen ? 'open' : ''}`;

    for (const cookie of cookies) {
      const item = document.createElement('div');
      item.className = 'cookie-item';
      const preview = cookie.value.length > 38
        ? cookie.value.slice(0, 38) + '…' : (cookie.value || '(empty)');
      item.innerHTML = `
        <span class="cookie-name" title="${cookie.name}">${cookie.name}</span>
        <span class="cookie-val" title="${cookie.value}">${preview}</span>
        <button class="cookie-del" title="Delete">✕</button>
      `;
      item.querySelector('.cookie-del').addEventListener('click', async e => {
        e.stopPropagation();
        await deleteCookie(cookie);
      });
      items.appendChild(item);
    }

    header.addEventListener('click', e => {
      if (e.target.classList.contains('domain-del')) return;
      const chevron = header.querySelector('.chevron');
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

    header.querySelector('.domain-del').addEventListener('click', async e => {
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
