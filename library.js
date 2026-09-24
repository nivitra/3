(() => {
  const controls = document.querySelector('.library-controls');
  if (!controls) return;
  const search = document.querySelector('#paper-search');
  const lab = document.querySelector('#lab-filter');
  const format = document.querySelector('#format-filter');
  const sort = document.querySelector('#sort-order');
  const counter = document.querySelector('#result-count');
  const selectedSection = document.querySelector('#important');
  const allSection = document.querySelector('#reading-list');
  const container = document.querySelector('#paper-results');
  const empty = document.querySelector('.empty-results');
  const chips = [...document.querySelectorAll('[data-topic]')];
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const records = [...container.querySelectorAll('.paper')].map(el => ({
    el, title: el.dataset.title, date: el.dataset.date,
    text: normalize(el.dataset.search), topics: JSON.parse(el.dataset.topics),
    labs: JSON.parse(el.dataset.labs), kind: el.dataset.kind,
    url: el.querySelector('.read-link').getAttribute('href')
  }));
  const picks = [...document.querySelectorAll('.pick')].map(el => ({el, urls: [...el.querySelectorAll('.read-link')].map(a => a.getAttribute('href'))}));
  let topic = '';
  let view = 'selected';
  let timer;

  function readLocation() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    topic = chips.some(chip => chip.dataset.topic === params.get('topic')) ? params.get('topic') : '';
    lab.value = params.get('lab') || '';
    format.value = params.get('format') || '';
    sort.value = params.get('sort') || 'newest';
    if (!sort.value) sort.value = 'newest';
    view = params.get('view') === 'all' || search.value || topic || lab.value || format.value || location.hash === '#reading-list' ? 'all' : 'selected';
    if (params.get('view') === 'selected') view = 'selected';
  }

  function render(save = true) {
    const words = normalize(search.value).split(' ').filter(Boolean);
    const matches = records.filter(row =>
      words.every(word => row.text.includes(word)) &&
      (!topic || row.topics.includes(topic)) &&
      (!lab.value || row.labs.includes(lab.value)) &&
      (!format.value || row.kind === format.value)
    );
    const matched = new Set(matches);
    const urls = new Set(matches.map(row => row.url));
    const order = [...records].sort((a,b) => sort.value === 'title'
      ? a.title.localeCompare(b.title)
      : sort.value === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    const fragment = document.createDocumentFragment();
    let position = 0;
    order.forEach(row => {
      row.el.hidden = !matched.has(row);
      if (!row.el.hidden) row.el.querySelector('.number').textContent = String(++position).padStart(2, '0');
      fragment.append(row.el);
    });
    container.append(fragment);
    let visiblePicks = 0;
    picks.forEach(pick => {
      pick.el.hidden = !pick.urls.some(url => urls.has(url));
      if (!pick.el.hidden) visiblePicks++;
    });
    selectedSection.hidden = view !== 'selected';
    allSection.hidden = view !== 'all';
    const none = view === 'selected' ? visiblePicks === 0 : matches.length === 0;
    empty.hidden = !none;
    // Keep the no-results action visible in either reading view.
    (view === 'selected' ? selectedSection : allSection).append(empty);
    counter.textContent = view === 'selected'
      ? `${visiblePicks} of ${picks.length} selected picks`
      : `${matches.length} of ${records.length} reads`;
    chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.topic === topic)));
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    if (save) {
      const params = new URLSearchParams();
      if (search.value.trim()) params.set('q', search.value.trim());
      if (topic) params.set('topic', topic);
      if (lab.value) params.set('lab', lab.value);
      if (format.value) params.set('format', format.value);
      if (sort.value !== 'newest') params.set('sort', sort.value);
      params.set('view', view);
      try { history.replaceState(null, '', `${location.pathname}?${params}${location.hash}`); } catch {}
    }
  }

  function reset() {
    clearTimeout(timer);
    search.value = '';
    lab.value = '';
    format.value = '';
    topic = '';
    sort.value = 'newest';
    view = 'all';
    render();
    search.focus({preventScroll:true});
  }
  search.addEventListener('input', () => {
    clearTimeout(timer);
    view = 'all';
    timer = setTimeout(render, 100);
  });
  search.addEventListener('keydown', event => { if (event.key === 'Enter') { clearTimeout(timer); view = 'all'; render(); } });
  [lab, format, sort].forEach(select => select.addEventListener('change', () => { view = 'all'; render(); }));
  chips.forEach(chip => chip.addEventListener('click', () => { topic = chip.dataset.topic; view = 'all'; render(); }));
  viewButtons.forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
  document.querySelectorAll('[data-nav-view]').forEach(link => link.addEventListener('click', () => {
    clearTimeout(timer);
    search.value = ''; lab.value = ''; format.value = ''; topic = '';
    view = link.dataset.navView;
    render();
  }));
  document.querySelector('#clear-search').addEventListener('click', reset);
  document.querySelector('#empty-reset').addEventListener('click', reset);
  addEventListener('popstate', () => { readLocation(); render(false); });
  readLocation();
  render(false);
  controls.hidden = false;
})();
