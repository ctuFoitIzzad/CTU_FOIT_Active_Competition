// ==== CONFIGURE THIS ====
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT844GE0oFCVQ5uxs1Ci4jWxv_HVCtxS_kvRL5tCix6kz9-NU8F8v4PMpFZaP2BXXniRYo-ROJRg0uK/pub?gid=1536941286&single=true&output=csv";
// ========================

function parseDateFlexible(s) {
  if (!s) return null;
  s = s.toString().trim();
  let d = new Date(s);
  if (!isNaN(d)) return d;

  const parts1 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (parts1) {
    d = new Date(parts1[3], parts1[2]-1, parts1[1]);
    if (!isNaN(d)) return d;
  }

  return null;
}

function normalizeKey(h) {
  return h.trim().toLowerCase().replace(/\s+/g,'_');
}

function todayAtStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDate(d) {
  return d ? d.toLocaleDateString() : '';
}

function renderCards(items) {
  const container = document.getElementById('list');
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = "<p style='grid-column:1/-1'>No active competitions.</p>";
    return;
  }

  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = it.thumbnail || '';
    img.onerror = () => img.src = 'https://via.placeholder.com/600x400?text=No+Image';
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';

    body.innerHTML = `
      <h3 class="title">${it.name_of_competition || '-'}</h3>
      <div class="meta">
        <div><strong>Type:</strong> ${it.type_of_competition || '-'}</div>
        <div><strong>Mode:</strong> ${it.mode || '-'}</div>
        <div><strong>Location:</strong> ${it.location || '-'}</div>
      </div>
      <div class="small">
        <div><strong>Competition Start:</strong> ${formatDate(parseDateFlexible(it.start_date_competition))}</div>
        <div><strong>End Registration:</strong> ${formatDate(parseDateFlexible(it.end_registration))}</div>
      </div>
      <div class="small"><strong>Fees:</strong> ${it.fees || 'Free'}</div>
      <div class="cta">
        <a class="btn" href="${it.competition_link_for_registration || '#'}" target="_blank">Register</a>
      </div>
    `;

    card.appendChild(body);
    container.appendChild(card);
  });
}

function loadAndRender() {
  fetch(CSV_URL)
    .then(r => r.text())
    .then(csv => {
      const parsed = Papa.parse(csv, { header:true, skipEmptyLines:true });
      const items = parsed.data.map(row => {
        const obj = {};
        Object.keys(row).forEach(k => obj[normalizeKey(k)] = row[k]?.trim());
        return obj;
      });

      const today = todayAtStart();
      const active = items.filter(it => {
        const end = parseDateFlexible(it.end_registration);
        return end && end >= today;
      });

      renderCards(active);
    })
    .catch(err => {
      document.getElementById('list').textContent = 'Error loading data';
      console.error(err);
    });
}

loadAndRender();
setInterval(loadAndRender, 5 * 60 * 1000);
