'use strict';

(() => {
  const token = document.querySelector('meta[name="bmh-team-token"]')?.content || '';
  const $ = id => document.getElementById(id);
  const pending = new Set();
  const terminal = new Set(['ready', 'complete', 'completed', 'done', 'stopped', 'cancelled', 'canceled', 'error', 'failed']);
  const statusNames = { preparing: 'Chuẩn bị', queued: 'Chuẩn bị', planning: 'Phân việc', running: 'Hai Codex đang làm', working: 'Hai Codex đang làm', integrating: 'Ghép code', merging: 'Ghép code', checking: 'Kiểm tra', testing: 'Kiểm tra', ready: 'Sẵn sàng xem lại', complete: 'Sẵn sàng xem lại', completed: 'Sẵn sàng xem lại', done: 'Sẵn sàng xem lại', stopped: 'Đã dừng', cancelled: 'Đã dừng', canceled: 'Đã dừng', error: 'Cần xử lý', failed: 'Cần xử lý' };
  const stageIndex = { preparing: 0, queued: 0, planning: 1, running: 2, working: 2, integrating: 3, merging: 3, checking: 4, testing: 4, ready: 5, complete: 5, completed: 5, done: 5 };
  const workerNames = { one: 'Tài khoản 1', two: 'Tài khoản 2', coordinator: 'Điều phối' };
  let state = null;
  let stateInFlight = false;
  let connectionError = false;
  let repoTouched = false;
  let sourceModeInitialized = false;
  let sourceModeTouched = false;
  let previousRunId = null;
  let previousEvents = '';
  let previousPlan = '';
  let previousResults = '';
  const loginSignatures = new Map();
  const selectSignatures = new Map();
  let previousSettingsWarning = null;
  const settingsPending = () => ['one', 'two'].some(id => pending.has(`settings:${id}`));

  const bounded = (value, max = 24000) => String(value ?? '').slice(0, max);
  const displayValue = (value, max = 48000) => bounded(typeof value === 'string' ? value : JSON.stringify(value, null, 2), max);
  const activeRun = () => Boolean(state?.run && !terminal.has(state.run.status));
  const notice = (message, error = false) => {
    const el = $('notice');
    el.textContent = bounded(message, 3000);
    el.classList.toggle('notice-error', error);
    el.hidden = !message;
  };
  const setText = (element, value) => { if (element.textContent !== String(value ?? '')) element.textContent = value ?? ''; };
  const loginUrl = value => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return null;
      if (!['openai.com', 'auth.openai.com', 'chatgpt.com'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return null;
      return url.href;
    } catch { return null; }
  };

  async function request(path, body) {
    const response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(body === undefined ? 12000 : 60000),
      headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-BMH-Team': token },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let data;
    try { data = await response.json(); } catch { throw new Error('Máy chủ trả về kết quả không đọc được.'); }
    if (!response.ok || data.ok === false) throw new Error(data.error || `Không thực hiện được yêu cầu (${response.status}).`);
    return data;
  }

  function renderLogin(worker, element) {
    const login = worker.login;
    const signature = JSON.stringify(login || null);
    if (loginSignatures.get(worker.id) === signature) return;
    loginSignatures.set(worker.id, signature);
    element.replaceChildren();
    element.hidden = !login;
    if (!login) return;
    const url = loginUrl(login.authUrl);
    const instruction = document.createElement('p');
    instruction.textContent = 'Mở trang OpenAI và chọn đúng tài khoản. Bảng này sẽ cập nhật khi đăng nhập xong.';
    element.append(instruction);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'button button-secondary';
      link.textContent = 'Mở đăng nhập OpenAI ↗';
      element.append(link);
      const hint = document.createElement('p');
      hint.textContent = worker.id === 'two' ? 'Mở liên kết trong hồ sơ Chrome của tài khoản thứ hai hoặc cửa sổ ẩn danh. Đừng đăng nhập lại tài khoản thứ nhất.' : 'Nếu trình duyệt chọn nhầm tài khoản, mở liên kết trong hồ sơ Chrome của tài khoản cần dùng.';
      hint.style.margin = '9px 0 0';
      element.append(hint);
    } else {
      const hint = document.createElement('p');
      hint.textContent = 'Chưa nhận được liên kết đăng nhập chính thức. Thử đăng nhập lại hoặc xem cửa sổ khởi chạy.';
      element.append(hint);
    }
  }

  function renderAccounts() {
    const workers = state.workers || [];
    const emails = workers.filter(w => w.account && w.connected).map(w => w.account.email?.trim().toLowerCase()).filter(Boolean);
    const repeatedAccount = emails.length === 2 && emails[0] === emails[1];
    const count = new Set(emails).size;
    setText($('account-count'), `${count}/2 tài khoản khác nhau`);
    $('account-warning').hidden = !repeatedAccount;
    for (const id of ['one', 'two']) {
      const worker = workers.find(w => w.id === id) || { id, connected: false, account: null, login: null };
      const card = document.querySelector(`[data-account="${id}"]`);
      const field = key => card.querySelector(`[data-field="${key}"]`);
      const loggedIn = Boolean(worker.account);
      const connected = loggedIn && Boolean(worker.connected);
      setText(field('email'), bounded(worker.account?.email || (loggedIn ? 'Đã đăng nhập ChatGPT' : 'Chưa đăng nhập'), 200));
      setText(field('plan'), worker.account?.planType ? `Gói ${bounded(worker.account.planType, 60)} · phiên Codex riêng` : loggedIn ? 'Phiên Codex đã có tài khoản.' : 'Dùng đăng nhập ChatGPT chính thức.');
      for (const [key, options] of [['model', state.modelOptions], ['reasoningEffort', state.reasoningOptions]]) {
        const select = card.querySelector(`[data-setting="${key}"]`);
        const signature = JSON.stringify(options || []);
        if (selectSignatures.get(select.id) !== signature) {
          selectSignatures.set(select.id, signature);
          select.replaceChildren(...(options || []).map(option => {
            const element = document.createElement('option');
            element.value = option.id; element.textContent = option.label; return element;
          }));
        }
        if (!pending.has(`settings:${id}`)) select.value = worker.modelSettings?.[key] || '';
        select.disabled = activeRun() || state.busy || settingsPending() || pending.has('run') || connectionError;
      }
      setText(field('model-save'), pending.has(`settings:${id}`) ? 'Đang lưu lựa chọn…' : `${worker.modelSettings?.model || '—'} · ${worker.modelSettings?.reasoningEffort || '—'}`);
      const duplicate = repeatedAccount && id === 'two';
      setText(field('status'), pending.has(`login:${id}`) ? 'Đang mở đăng nhập' : duplicate ? 'Trùng tài khoản' : connected ? 'Đã kết nối' : worker.login ? 'Chờ đăng nhập' : loggedIn ? 'Chờ kết nối' : 'Chưa kết nối');
      field('status').classList.toggle('connected', connected && !duplicate);
      field('status').classList.toggle('failed', duplicate);
      field('status').classList.toggle('running', Boolean(worker.login || pending.has(`login:${id}`)));
      field('error').hidden = !worker.error;
      setText(field('error'), bounded(worker.error, 1800));
      renderLogin(worker, field('login'));
      const loginButton = card.querySelector('[data-action="login"]');
      const logoutButton = card.querySelector('[data-action="logout"]');
      loginButton.hidden = connected;
      loginButton.disabled = activeRun() || pending.has(`login:${id}`) || pending.has(`logout:${id}`);
      setText(loginButton, worker.login ? 'Lấy lại liên kết' : loggedIn ? 'Kết nối lại' : 'Đăng nhập');
      logoutButton.hidden = !loggedIn && !worker.login;
      logoutButton.disabled = activeRun() || pending.has(`logout:${id}`);
      setText(logoutButton, pending.has(`logout:${id}`) ? 'Đang đăng xuất…' : worker.login && !loggedIn ? 'Hủy đăng nhập' : 'Đăng xuất');
    }
    return count;
  }

  function capability(name, label) {
    const value = state.capabilities?.[name];
    const available = typeof value === 'object' ? Boolean(value?.available ?? value?.ok) : Boolean(value);
    const element = $(`${name}-status`);
    setText(element, `${label} · ${available ? 'sẵn sàng' : 'chưa có'}`);
    element.classList.toggle('available', available);
    element.classList.toggle('missing', !available);
    return available;
  }

  function renderSourceMode() {
    const select = $('source-mode');
    const options = state.sourceModeOptions || [{ id: 'fetch', label: 'Git tự lấy bản mới' }, { id: 'desktop', label: 'GitHub Desktop — đã Fetch origin' }];
    const signature = JSON.stringify(options);
    const currentValue = select.value;
    if (selectSignatures.get(select.id) !== signature) {
      selectSignatures.set(select.id, signature);
      select.replaceChildren(...options.map(option => {
        const element = document.createElement('option');
        element.value = option.id; element.textContent = option.label; return element;
      }));
      if ((sourceModeInitialized || sourceModeTouched) && options.some(option => option.id === currentValue)) select.value = currentValue;
    }
    if (!sourceModeInitialized && !sourceModeTouched) {
      const defaultMode = state.sourceModeDefault || 'fetch';
      select.value = options.some(option => option.id === defaultMode) ? defaultMode : 'fetch';
      sourceModeInitialized = true;
    }
    select.disabled = activeRun() || state.busy || settingsPending() || pending.has('run') || connectionError;
    setText($('source-hint'), select.value === 'desktop'
      ? 'Trong GitHub Desktop, chọn D:\\KBL\\build-my-home và bấm Fetch origin ngay trước khi giao việc. Chỉ nhận lần Fetch có FETCH_HEAD khớp origin/main, trong 15 phút.'
      : 'BMH Team chạy Git để lấy origin/main mới trước khi tạo nhánh làm việc. Nếu Fetch lỗi, công việc dừng và hiện nguyên nhân.');
  }

  function renderDiagnostic(diagnostic) {
    $('run-diagnostic').hidden = !diagnostic;
    if (!diagnostic) return;
    setText($('diagnostic-summary'), bounded(diagnostic.summary || 'Chưa chuẩn bị được mã nguồn dự án.', 1500));
    const operation = [diagnostic.operation, diagnostic.exitCode !== undefined && diagnostic.exitCode !== null ? `mã thoát ${diagnostic.exitCode}` : ''].filter(Boolean).join(' · ');
    $('diagnostic-operation').hidden = !operation;
    setText($('diagnostic-operation'), bounded(operation, 800));
    $('diagnostic-details-group').hidden = !diagnostic.details;
    setText($('diagnostic-details'), displayValue(diagnostic.details || '', 16000));
    const help = Array.isArray(diagnostic.help) ? diagnostic.help.join('\n') : diagnostic.help || '';
    $('diagnostic-help').hidden = !help;
    setText($('diagnostic-help'), bounded(help, 6000));
    $('diagnostic-log').hidden = !diagnostic.logPath;
    setText($('diagnostic-log-path'), bounded(diagnostic.logPath, 1200));
  }

  function renderEvents(events) {
    const list = Array.isArray(events) ? events.slice(-250) : [];
    const signature = JSON.stringify(list);
    if (signature === previousEvents) return;
    previousEvents = signature;
    const log = $('event-log');
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 70;
    const fragment = document.createDocumentFragment();
    for (const event of list) {
      const item = document.createElement('li');
      const time = document.createElement('time');
      const date = new Date(event.at);
      time.textContent = Number.isFinite(date.getTime()) ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
      if (Number.isFinite(date.getTime())) time.dateTime = date.toISOString();
      const who = document.createElement('b');
      who.textContent = workerNames[event.worker] || 'Điều phối';
      who.className = event.worker === 'two' ? 'worker-two' : event.worker === 'one' ? 'worker-one' : 'worker-coordinator';
      const message = document.createElement('span');
      message.className = 'log-text';
      message.textContent = bounded(event.message, 6000);
      item.append(time, who, message);
      fragment.append(item);
    }
    log.replaceChildren(fragment);
    if (atBottom) log.scrollTop = log.scrollHeight;
    setText($('log-count'), `${list.length} cập nhật${Array.isArray(events) && events.length > list.length ? ' gần nhất' : ''}`);
  }

  function renderResults(results) {
    const signature = JSON.stringify(results ?? null);
    if (signature === previousResults) return;
    previousResults = signature;
    const target = $('worker-results');
    target.replaceChildren();
    $('result-details').hidden = !results || (Array.isArray(results) && !results.length);
    if (!results) return;
    const entries = Array.isArray(results) ? results.map((v, i) => [v.worker || v.id || (i === 0 ? 'one' : 'two'), v]) : typeof results === 'object' ? Object.entries(results) : [['coordinator', results]];
    for (const [key, value] of entries.slice(0, 6)) {
      const article = document.createElement('article');
      const title = document.createElement('h4');
      title.textContent = workerNames[key] || bounded(key, 100);
      const output = document.createElement('pre');
      output.textContent = displayValue(value?.summary ?? value?.output ?? value?.result ?? value, 40000);
      article.append(title, output);
      target.append(article);
    }
  }

  function renderRun() {
    const run = state.run;
    $('run-empty').hidden = Boolean(run);
    $('run-content').hidden = !run;
    const status = run?.status;
    const currentStage = stageIndex[status];
    setText($('run-status'), run ? statusNames[status] || bounded(status, 80) : 'Chưa có công việc');
    $('run-status').classList.toggle('running', Boolean(run && !terminal.has(status)));
    $('run-status').classList.toggle('connected', currentStage === 5);
    $('run-status').classList.toggle('failed', ['error', 'failed'].includes(status));
    for (const element of document.querySelectorAll('[data-stage]')) {
      const index = Number(element.dataset.stage);
      element.classList.toggle('done', currentStage !== undefined && index < currentStage);
      element.classList.toggle('active', currentStage === index);
      if (currentStage === index) element.setAttribute('aria-current', 'step'); else element.removeAttribute('aria-current');
    }
    if (!run) return;
    setText($('run-models'), Object.entries(run.modelSettings || {}).map(([id, selected]) => `${workerNames[id] || id}: ${selected.model} · ${selected.reasoningEffort}`).join(' / '));
    if (previousRunId !== run.id) {
      previousRunId = run.id;
      previousEvents = '';
      previousPlan = '';
      previousResults = '';
      $('plan-details').open = false;
      $('result-details').open = false;
    }
    setText($('active-goal'), bounded(run.goal, 12000));
    $('run-error').hidden = !run.error || Boolean(run.diagnostic);
    setText($('run-error'), bounded(run.error, 5000));
    renderDiagnostic(run.diagnostic);
    $('run-source').hidden = !run.source;
    if (run.source) {
      const fetchedDate = new Date(run.source.fetchedAt);
      const fetchedAt = run.source.fetchedAt && Number.isFinite(fetchedDate.getTime()) ? fetchedDate.toLocaleString('vi-VN') : '';
      setText($('run-source'), [run.source.mode === 'desktop' ? 'Nguồn: Fetch của GitHub Desktop' : 'Nguồn: Git đã Fetch origin/main', run.source.baseCommit ? `main ${bounded(run.source.baseCommit, 12)}` : '', fetchedAt].filter(Boolean).join(' · '));
    }
    const plan = displayValue(run.plan || '', 36000);
    if (plan !== previousPlan) { setText($('plan-output'), plan); previousPlan = plan; }
    $('plan-details').hidden = !run.plan;
    renderResults(run.results);
    renderEvents(run.events);
    $('run-result').hidden = run.workspaceReady !== true || (!run.branch && !run.path);
    setText($('result-title'), currentStage === 5 ? 'Code đã sẵn sàng để xem lại' : terminal.has(status) ? 'Thư mục công việc để kiểm tra' : 'Nhánh đang làm việc');
    setText($('result-branch'), bounded(run.branch || '—', 500));
    setText($('result-path'), bounded(run.path || '—', 1000));
  }

  function render() {
    if (!state) return;
    if (state.settingsWarning && state.settingsWarning !== previousSettingsWarning) notice(state.settingsWarning, true);
    previousSettingsWarning = state.settingsWarning;
    const accountCount = renderAccounts();
    const gitReady = capability('git', 'Git');
    const codexReady = capability('codex', 'Codex');
    const accountEmails = (state.workers || []).map(worker => worker.account?.email?.trim().toLowerCase()).filter(Boolean);
    const repeatedAccount = accountEmails.length === 2 && accountEmails[0] === accountEmails[1];
    if (!repoTouched && !$('repo-path').value && state.repoDefault) $('repo-path').value = state.repoDefault;
    renderSourceMode();
    const working = activeRun();
    const canStart = accountCount === 2 && !repeatedAccount && gitReady && codexReady && !working && !state.busy && !state.settingsWarning && !settingsPending() && !pending.has('run') && !connectionError;
    $('run-button').disabled = !canStart;
    // Preserve the decorative arrow while updating the action label.
    const actionLabel = pending.has('run') ? 'Đang chuẩn bị…' : working ? 'Đội đang làm việc…' : 'Phân việc & làm song song';
    if ($('run-button').dataset.label !== actionLabel) {
      $('run-button').dataset.label = actionLabel;
      const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
      $('run-button').replaceChildren(arrow, document.createTextNode(actionLabel));
    }
    $('stop-button').hidden = !working;
    $('stop-button').disabled = pending.has('stop');
    $('repo-path').disabled = working;
    $('goal').disabled = working;
    setText($('run-hint'), working ? 'Ông có thể theo dõi tiến độ bên dưới hoặc dừng công việc.' : state.settingsWarning ? state.settingsWarning : settingsPending() ? 'Đang lưu model. Chờ một chút trước khi giao việc.' : repeatedAccount ? 'Hai thẻ đang dùng cùng email. Đăng xuất thẻ thứ hai rồi chọn tài khoản khác.' : accountCount < 2 ? 'Đăng nhập đủ hai tài khoản để bắt đầu.' : !gitReady || !codexReady ? 'Hoàn tất Git và Codex CLI trước khi bắt đầu.' : state.busy ? 'Đang chuẩn bị kết nối, ông chờ một chút.' : 'Tạo nhánh cục bộ để xem lại; chưa tự ghép main hay triển khai web.');
    renderRun();
  }

  async function refresh() {
    if (stateInFlight) return;
    stateInFlight = true;
    try {
      const incoming = await request('/api/state');
      if (!state || (incoming.settingsRevision || 0) >= (state.settingsRevision || 0)) state = incoming;
      if (connectionError) notice('Đã nối lại với bộ điều phối trên máy.');
      connectionError = false;
      render();
    } catch (error) {
      if (!connectionError) notice(`Không nối được bộ điều phối. Giữ cửa sổ khởi chạy mở rồi tải lại trang. ${error.message}`, true);
      connectionError = true;
      $('run-button').disabled = true;
      $('source-mode').disabled = true;
    } finally { stateInFlight = false; }
  }

  async function mutate(key, path, body, success) {
    if (pending.has(key)) return;
    pending.add(key);
    render();
    try {
      const result = await request(path, body);
      if (result.state) { state = result.state; render(); }
      if (success) notice(typeof success === 'function' ? success(result) : success);
      await refresh();
    } catch (error) { notice(error.message, true); }
    finally { pending.delete(key); render(); }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const worker = button.dataset.worker;
    if (!['one', 'two'].includes(worker)) return;
    if (button.dataset.action === 'login') mutate(`login:${worker}`, '/api/login', { worker }, 'Mở liên kết OpenAI trong thẻ tài khoản và hoàn tất đăng nhập.');
    if (button.dataset.action === 'logout') mutate(`logout:${worker}`, '/api/logout', { worker }, 'Phiên tài khoản này đã được đăng xuất khỏi BMH Team.');
  });
  document.addEventListener('change', event => {
    const select = event.target.closest('select[data-setting]');
    if (!select || select.disabled) return;
    const card = select.closest('[data-account]');
    const worker = card?.dataset.account;
    if (!['one', 'two'].includes(worker)) return;
    const model = card.querySelector('[data-setting="model"]').value;
    const reasoningEffort = card.querySelector('[data-setting="reasoningEffort"]').value;
    mutate(`settings:${worker}`, '/api/settings', { worker, model, reasoningEffort }, 'Đã lưu model và mức suy luận cho tài khoản này.')
      .finally(() => { if (!select.disabled && document.activeElement === document.body) select.focus({ preventScroll: true }); });
  });
  $('repo-path').addEventListener('input', () => { repoTouched = true; });
  $('source-mode').addEventListener('change', () => { sourceModeTouched = true; renderSourceMode(); });
  $('run-form').addEventListener('submit', event => {
    event.preventDefault();
    if ($('run-button').disabled) return;
    const repo = $('repo-path').value.trim();
    const goal = $('goal').value.trim();
    if (!repo || !goal) { notice('Nhập thư mục repo và mục tiêu công việc.', true); return; }
    const sourceMode = $('source-mode').value;
    mutate('run', '/api/run', { repo, goal, sourceMode }, 'Đã nhận mục tiêu. Bộ điều phối đang chuẩn bị phần việc.');
  });
  $('stop-button').addEventListener('click', () => mutate('stop', '/api/stop', {}, 'Đã gửi yêu cầu dừng. Xem nhật ký để biết công việc nào đã hoàn tất.'));
  window.addEventListener('focus', refresh);
  refresh();
  setInterval(refresh, 1500);
})();
