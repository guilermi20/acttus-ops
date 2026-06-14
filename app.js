/* Acttus OS — app editorial (frontend). Lê/escreve via window.Store (data.js). */
(function () {
'use strict';
var S = window.Store, st = S.state;

/* ---------- ícones ---------- */
var ICONS = {
 dashboard:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
 calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
 grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
 building:'<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><path d="M9 22v-4h6v4"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
 check:'<polyline points="20 6 9 17 4 12"/>',
 clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
 chevron:'<polyline points="9 18 15 12 9 6"/>',
 left:'<polyline points="15 18 9 12 15 6"/>',
 right:'<polyline points="9 18 15 12 9 6"/>',
 trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
 x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
 dot:'<circle cx="12" cy="12" r="3"/>',
 edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
 zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
 alert:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
 moon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
 sun:'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
};
function ic(n, s) { return '<svg class="i" width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || ICONS.dot) + '</svg>'; }

/* ---------- helpers ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function onlyDigits(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }
var MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
var MONFULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
var WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

var _t;
function toast(t, kind) { var e = $('#toast'); e.className = 'toast show' + (kind ? ' ' + kind : ''); e.textContent = t; clearTimeout(_t); _t = setTimeout(function () { e.className = 'toast'; }, 3000); }

/* ---------- constantes do domínio ---------- */
var STATUS = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação', 'Finalizado', 'Postado'];
var STATUS_COLOR = { 'Agendado': 'gray', 'Em produção': 'blue', 'Aguardando aprovação': 'amber', 'Modificação': 'red', 'Finalizado': 'purple', 'Postado': 'green' };
var FUNNEL = [
 { key: 'topo', label: 'Topo de funil', short: 'Topo', target: 50, color: 'blue' },
 { key: 'meio', label: 'Meio de funil', short: 'Meio', target: 30, color: 'amber' },
 { key: 'fundo', label: 'Fundo de funil', short: 'Fundo', target: 20, color: 'green' }
];
function funnelMeta(k) { for (var i = 0; i < FUNNEL.length; i++) if (FUNNEL[i].key === k) return FUNNEL[i]; return FUNNEL[0]; }
var TYPES = [{ key: 'carrossel', label: 'Carrossel' }, { key: 'reels', label: 'Reels' }, { key: 'estatico', label: 'Estático' }];
function typeLabel(k) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i].key === k) return TYPES[i].label; return k; }
var CHANNELS = [{ key: 'organico', label: 'Orgânico' }, { key: 'trafego', label: 'Tráfego' }];
function channelLabel(k) { return k === 'trafego' ? 'Tráfego' : 'Orgânico'; }
var TIMES = ['12:00', '18:00'];

/* ---------- util de dados ---------- */
function todayISO() { return String(st.serverNow || new Date().toISOString()).slice(0, 10); }
function postColor(p) { return p && p.is_internal ? 'yellow' : 'pink'; }
function clientById(id) { for (var i = 0; i < st.clients.length; i++) if (st.clients[i].id === id) return st.clients[i]; return null; }
function isOverdue(p) { return p.pub_date && p.pub_date < todayISO() && p.status !== 'Postado'; }
function initials(name) { var parts = String(name || '?').trim().split(/\s+/); return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase(); }
function fmtDay(iso) { if (!iso) return '—'; var p = iso.split('-'); return p[2] + ' ' + MON[+p[1] - 1]; }

function badge(text, color) { return '<span class="bg c-' + color + '"><span class="bgdot"></span>' + esc(text) + '</span>'; }
function avatar(name, sz) { sz = sz || 26; return '<span class="avt" title="' + esc(name || '—') + '" style="width:' + sz + 'px;height:' + sz + 'px;font-size:' + (sz * .4).toFixed(0) + 'px">' + esc(initials(name)) + '</span>'; }

/* ===================================================================
   ROUTER
   =================================================================== */
var NAV = [
 { sec: 'Painel', items: [{ key: 'dashboard', label: 'Visão geral', icon: 'dashboard' }, { key: 'funil', label: 'Funil 50/30/20', icon: 'target' }] },
 { sec: 'Editorial', items: [{ key: 'calendario', label: 'Calendário', icon: 'calendar' }, { key: 'posts', label: 'Posts', icon: 'grid' }] },
 { sec: 'Cadastros', items: [{ key: 'clientes', label: 'Clientes', icon: 'building' }, { key: 'usuarios', label: 'Usuários', icon: 'users' }] }
];
var VIEWS = { dashboard: renderDashboard, funil: renderFunil, calendario: renderCalendario, posts: renderPosts, clientes: renderClientes, usuarios: renderUsuarios };
var route = 'calendario';

function go(v) { route = v; renderNav(); renderView(); }
function renderNav() {
 var h = '';
 NAV.forEach(function (g) {
  h += '<div class="navsec">' + esc(g.sec) + '</div>';
  g.items.forEach(function (it) {
   var cnt = navCount(it.key);
   h += '<div class="navitem' + (route === it.key ? ' on' : '') + '" data-go="' + it.key + '">' + ic(it.icon, 18) + '<span>' + esc(it.label) + '</span>' + (cnt ? '<span class="cnt">' + cnt + '</span>' : '') + '</div>';
  });
 });
 $('#nav').innerHTML = h;
 $$('#nav .navitem').forEach(function (n) { n.onclick = function () { go(n.getAttribute('data-go')); }; });
}
function navCount(k) {
 if (k === 'posts') return st.posts.length;
 if (k === 'clientes') return st.clients.length;
 if (k === 'usuarios') return st.users.length;
 return '';
}
function renderView() { var el = $('#view'); (VIEWS[route] || renderDashboard)(el); }

/* ===================================================================
   HEAD (título + ações)
   =================================================================== */
function head(title, sub, actions) {
 return '<div class="phead"><div class="tt"><h1>' + esc(title) + '</h1>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div><div class="acts">' + (actions || '') + '</div></div>';
}
function kpi(label, value, desc, color) {
 return '<div class="kpi"><div class="ktop"><div class="kl">' + esc(label) + '</div></div><div class="kv ' + (color ? 'c-' + color : '') + '">' + value + '</div><div class="kd">' + esc(desc || '') + '</div></div>';
}

/* ===================================================================
   DASHBOARD — visão geral
   =================================================================== */
function renderDashboard(el) {
 var posts = st.posts;
 var total = posts.length;
 var agendados = posts.filter(function (p) { return p.status === 'Agendado'; }).length;
 var postados = posts.filter(function (p) { return p.status === 'Postado'; }).length;
 var vencidos = posts.filter(isOverdue).length;
 var byStatus = STATUS.map(function (s) { return { label: s, n: posts.filter(function (p) { return p.status === s; }).length, color: STATUS_COLOR[s] }; });

 var kpis = '<div class="kpis">' +
  kpi('Posts', total, 'no total') +
  kpi('Agendados', agendados, 'aguardando publicação', 'blue') +
  kpi('Postados', postados, 'já publicados', 'green') +
  kpi('Vencidos', vencidos, 'data passou, não postado', vencidos ? 'red' : 'gray') + '</div>';

 var statusPanel = '<div class="panel"><div class="hd"><h3>Posts por status</h3></div><div class="bd">' +
  byStatus.map(function (s) {
   var pc = total ? Math.round(s.n / total * 100) : 0;
   return '<div class="hb"><span class="hbl">' + badge(s.label, s.color) + '</span><span class="hbar"><i class="c-' + s.color + '" style="width:' + pc + '%"></i></span><span class="hbv">' + s.n + '</span></div>';
  }).join('') + '</div></div>';

 var upcoming = posts.filter(function (p) { return p.pub_date && p.pub_date >= todayISO() && p.status !== 'Postado'; })
  .sort(function (a, b) { return (a.pub_date + a.pub_time) < (b.pub_date + b.pub_time) ? -1 : 1; }).slice(0, 6);
 var upPanel = '<div class="panel"><div class="hd"><h3>Próximas publicações</h3></div><div class="bd">' +
  (upcoming.length ? upcoming.map(postRow).join('') : '<div class="empty">Nada agendado à frente.</div>') + '</div></div>';

 el.innerHTML = head('Visão geral', 'Acompanhe a operação do calendário editorial em tempo real.',
  '<button class="btn pri" data-new="1">' + ic('plus') + ' Novo post</button>') +
  '<div class="livebar">' + ic('zap', 15) + ' Atualização ao vivo a cada 8s</div>' +
  kpis + '<div class="cols2">' + statusPanel + upPanel + '</div>';

 bindNew(el); bindPostRows(el);
}
function postRow(p) {
 var c = postColor(p);
 return '<div class="arow" data-post="' + p.id + '"><span class="cdot c-' + c + '"></span>' +
  '<div class="tx"><div class="t">' + esc(p.title) + '</div><div class="m">' + esc(p.client_name || 'Sem cliente') + ' · ' + typeLabel(p.post_type) + ' · ' + funnelMeta(p.funnel_stage).short + '</div></div>' +
  '<div class="rt">' + badge(p.status, STATUS_COLOR[p.status]) + '<div class="dt">' + fmtDay(p.pub_date) + (p.pub_time ? ' · ' + p.pub_time : '') + '</div></div></div>';
}
function bindPostRows(el) { $$('[data-post]', el).forEach(function (r) { r.onclick = function () { var p = postById(r.getAttribute('data-post')); if (p) openPostModal(p); }; }); }
function postById(id) { for (var i = 0; i < st.posts.length; i++) if (st.posts[i].id === id) return st.posts[i]; return null; }

/* ===================================================================
   FUNIL 50/30/20
   =================================================================== */
var funilClient = '';
function renderFunil(el) {
 var posts = funilClient ? st.posts.filter(function (p) { return p.client_id === funilClient; }) : st.posts;
 var total = posts.length;
 var counts = { topo: 0, meio: 0, fundo: 0 };
 posts.forEach(function (p) { counts[p.funnel_stage] = (counts[p.funnel_stage] || 0) + 1; });

 var bars = FUNNEL.map(function (f) {
  var n = counts[f.key] || 0, pc = total ? Math.round(n / total * 100) : 0;
  var diff = pc - f.target, ok = Math.abs(diff) <= 7;
  return '<div class="fn">' +
   '<div class="fn-top"><span class="fn-name">' + badge(f.label, f.color) + '</span>' +
   '<span class="fn-pct">' + pc + '% <small>· meta ' + f.target + '%</small></span></div>' +
   '<div class="fn-track"><i class="c-' + f.color + '" style="width:' + pc + '%"></i><span class="fn-target" style="left:' + f.target + '%"></span></div>' +
   '<div class="fn-foot"><span>' + n + ' post' + (n === 1 ? '' : 's') + '</span>' +
   '<span class="fn-verdict ' + (ok ? 'ok' : 'off') + '">' + (ok ? ic('check', 14) + ' na meta' : ic('alert', 14) + (diff > 0 ? ' +' : ' ') + diff + 'pp') + '</span></div></div>';
 }).join('');

 var globalOk = FUNNEL.every(function (f) { var pc = total ? Math.round((counts[f.key] || 0) / total * 100) : 0; return Math.abs(pc - f.target) <= 7; });

 // por cliente
 var rows = st.clients.map(function (cl) {
  var cp = st.posts.filter(function (p) { return p.client_id === cl.id; });
  if (!cp.length) return '';
  var t = cp.length;
  var cells = FUNNEL.map(function (f) { var n = cp.filter(function (p) { return p.funnel_stage === f.key; }).length; return '<td>' + (t ? Math.round(n / t * 100) : 0) + '%</td>'; }).join('');
  var ok = FUNNEL.every(function (f) { var n = cp.filter(function (p) { return p.funnel_stage === f.key; }).length; return Math.abs((t ? Math.round(n / t * 100) : 0) - f.target) <= 10; });
  return '<tr><td class="cn"><span class="cdot c-' + (cl.is_internal ? 'yellow' : 'pink') + '"></span>' + esc(cl.name) + '</td>' + cells + '<td>' + t + '</td><td>' + (ok ? '<span class="tag ok">ok</span>' : '<span class="tag off">ajustar</span>') + '</td></tr>';
 }).join('');

 var clientOpts = '<option value="">Todos os clientes</option>' + st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === funilClient ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');

 el.innerHTML = head('Funil 50/30/20', 'Distribuição dos posts por etapa de funil vs. a meta 50% topo / 30% meio / 20% fundo.',
  '<select class="select" id="fnCli">' + clientOpts + '</select>') +
  '<div class="meta-banner ' + (globalOk ? 'ok' : 'off') + '">' + (globalOk ? ic('check') + ' Dentro da meta 50/30/20' : ic('alert') + ' Fora da meta 50/30/20 — ajuste o mix de conteúdo') + '<span class="mb-total">' + total + ' posts</span></div>' +
  '<div class="panel"><div class="bd fn-wrap">' + (total ? bars : '<div class="empty">Sem posts para este filtro.</div>') + '</div></div>' +
  '<div class="panel"><div class="hd"><h3>Por cliente</h3></div><div class="bd"><table class="tbl"><thead><tr><th>Cliente</th><th>Topo</th><th>Meio</th><th>Fundo</th><th>Total</th><th>Meta</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">Sem dados.</td></tr>') + '</tbody></table></div></div>';

 $('#fnCli', el).onchange = function () { funilClient = this.value; renderFunil(el); };
}

/* ===================================================================
   CALENDÁRIO unificado
   =================================================================== */
var calY, calM, calClient = '';
function calInit() { if (calY == null) { var t = todayISO().split('-'); calY = +t[0]; calM = +t[1] - 1; } }
function renderCalendario(el) {
 calInit();
 var first = new Date(Date.UTC(calY, calM, 1));
 var startW = first.getUTCDay();
 var days = new Date(Date.UTC(calY, calM + 1, 0)).getUTCDate();
 var posts = (calClient ? st.posts.filter(function (p) { return p.client_id === calClient; }) : st.posts).filter(function (p) { return p.pub_date; });
 var byDay = {};
 posts.forEach(function (p) { var d = p.pub_date.split('-'); if (+d[0] === calY && +d[1] - 1 === calM) { var k = +d[2]; (byDay[k] = byDay[k] || []).push(p); } });
 Object.keys(byDay).forEach(function (k) { byDay[k].sort(function (a, b) { return (a.pub_time || '') < (b.pub_time || '') ? -1 : 1; }); });

 var cells = '';
 for (var i = 0; i < startW; i++) cells += '<div class="cal-cell out"></div>';
 var todays = todayISO();
 for (var d = 1; d <= days; d++) {
  var iso = calY + '-' + String(calM + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  var list = byDay[d] || [];
  var evs = list.map(function (p) {
   return '<div class="cal-ev c-' + postColor(p) + '" data-post="' + p.id + '" title="' + esc(p.title) + '">' + (p.pub_time ? '<b>' + p.pub_time + '</b> ' : '') + esc(p.title) + '</div>';
  }).join('');
  cells += '<div class="cal-cell' + (iso === todays ? ' today' : '') + '" data-day="' + iso + '">' +
   '<div class="cal-h"><span class="cal-d">' + d + '</span><button class="cal-add" data-add="' + iso + '">+</button></div>' +
   '<div class="cal-evs">' + evs + '</div></div>';
 }

 var clientOpts = '<option value="">Todos os clientes</option>' + st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === calClient ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');

 el.innerHTML = head('Calendário', 'Todos os clientes num só lugar. Amarelo = Acttus (interno) · Rosa = clientes.',
  '<select class="select" id="calCli">' + clientOpts + '</select>' +
  '<button class="btn pri" data-new="1">' + ic('plus') + ' Novo post</button>') +
  '<div class="cal-bar"><button class="btn icon" id="calPrev">' + ic('left') + '</button>' +
  '<div class="cal-title">' + MONFULL[calM] + ' ' + calY + '</div>' +
  '<button class="btn icon" id="calNext">' + ic('right') + '</button>' +
  '<button class="btn sm" id="calToday">Hoje</button>' +
  '<span class="cal-legend"><span class="cdot c-yellow"></span>Acttus &nbsp;<span class="cdot c-pink"></span>Clientes</span></div>' +
  '<div class="cal-grid head">' + WD.map(function (w) { return '<div class="cal-wd">' + w + '</div>'; }).join('') + '</div>' +
  '<div class="cal-grid">' + cells + '</div>';

 $('#calPrev', el).onclick = function () { calM--; if (calM < 0) { calM = 11; calY--; } renderCalendario(el); };
 $('#calNext', el).onclick = function () { calM++; if (calM > 11) { calM = 0; calY++; } renderCalendario(el); };
 $('#calToday', el).onclick = function () { var t = todayISO().split('-'); calY = +t[0]; calM = +t[1] - 1; renderCalendario(el); };
 $('#calCli', el).onchange = function () { calClient = this.value; renderCalendario(el); };
 $$('[data-post]', el).forEach(function (e) { e.onclick = function (ev) { ev.stopPropagation(); var p = postById(e.getAttribute('data-post')); if (p) openPostModal(p); }; });
 $$('[data-add]', el).forEach(function (e) { e.onclick = function (ev) { ev.stopPropagation(); openPostModal(null, { pub_date: e.getAttribute('data-add'), client_id: calClient || '' }); }; });
 bindNew(el);
}

/* ===================================================================
   POSTS — board com os 6 status (drag & drop)
   =================================================================== */
var boardCli = '', boardFunnel = '';
var dragId = null;
function renderPosts(el) {
 var posts = st.posts.filter(function (p) {
  if (boardCli && p.client_id !== boardCli) return false;
  if (boardFunnel && p.funnel_stage !== boardFunnel) return false;
  return true;
 });
 var clientOpts = '<option value="">Todos os clientes</option>' + st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === boardCli ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
 var funnelOpts = '<option value="">Todo o funil</option>' + FUNNEL.map(function (f) { return '<option value="' + f.key + '"' + (f.key === boardFunnel ? ' selected' : '') + '>' + f.label + '</option>'; }).join('');

 var cols = STATUS.map(function (s) {
  var list = posts.filter(function (p) { return p.status === s; });
  var cards = list.map(postCard).join('') || '<div class="kc-empty">—</div>';
  return '<div class="kcol" data-status="' + esc(s) + '"><div class="kcol-h">' + badge(s, STATUS_COLOR[s]) + '<span class="kcnt">' + list.length + '</span></div><div class="kcol-b" data-drop="' + esc(s) + '">' + cards + '</div></div>';
 }).join('');

 el.innerHTML = head('Posts', 'Arraste os cards entre as colunas para mudar o status.',
  '<select class="select" id="bCli">' + clientOpts + '</select>' +
  '<select class="select" id="bFun">' + funnelOpts + '</select>' +
  '<button class="btn pri" data-new="1">' + ic('plus') + ' Novo post</button>') +
  '<div class="board">' + cols + '</div>';

 $('#bCli', el).onchange = function () { boardCli = this.value; renderPosts(el); };
 $('#bFun', el).onchange = function () { boardFunnel = this.value; renderPosts(el); };
 bindNew(el);
 $$('.kc', el).forEach(function (c) {
  c.onclick = function () { var p = postById(c.getAttribute('data-id')); if (p) openPostModal(p); };
  c.ondragstart = function (e) { dragId = c.getAttribute('data-id'); c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; };
  c.ondragend = function () { dragId = null; c.classList.remove('dragging'); };
 });
 $$('[data-drop]', el).forEach(function (z) {
  z.ondragover = function (e) { e.preventDefault(); z.classList.add('over'); };
  z.ondragleave = function () { z.classList.remove('over'); };
  z.ondrop = function (e) {
   e.preventDefault(); z.classList.remove('over');
   var status = z.getAttribute('data-drop'); var id = dragId;
   if (!id) return; var p = postById(id); if (!p || p.status === status) return;
   S.updatePost(id, { status: status }).then(function () { toast('Status: ' + status); }).catch(function (er) { toast(er.message, 'err'); });
  };
 });
}
function postCard(p) {
 var c = postColor(p);
 return '<div class="kc" draggable="true" data-id="' + p.id + '">' +
  '<div class="kc-t">' + esc(p.title) + '</div>' +
  '<div class="kc-m"><span class="cdot c-' + c + '"></span>' + esc(p.client_name || 'Sem cliente') + '</div>' +
  '<div class="kc-tags"><span class="ptag c-' + funnelMeta(p.funnel_stage).color + '">' + funnelMeta(p.funnel_stage).short + '</span><span class="ptag">' + typeLabel(p.post_type) + '</span><span class="ptag">' + channelLabel(p.channel) + '</span></div>' +
  '<div class="kc-f">' + (isOverdue(p) ? '<span class="overdue">' + ic('alert', 13) + ' vencido</span>' : '<span class="kc-dt">' + ic('clock', 13) + ' ' + fmtDay(p.pub_date) + (p.pub_time ? ' ' + p.pub_time : '') + '</span>') + avatar(p.responsible_name, 22) + '</div></div>';
}

/* ===================================================================
   CLIENTES
   =================================================================== */
function renderClientes(el) {
 var rows = st.clients.map(function (c) {
  var n = st.posts.filter(function (p) { return p.client_id === c.id; }).length;
  return '<div class="lrow"><span class="cdot c-' + (c.is_internal ? 'yellow' : 'pink') + '"></span><div class="tx"><div class="t">' + esc(c.name) + '</div><div class="m">' + (c.is_internal ? 'Interno (Acttus)' : 'Cliente') + '</div></div><div class="rt"><span class="sub">' + n + ' posts</span></div></div>';
 }).join('') || '<div class="empty">Nenhum cliente ainda.</div>';
 el.innerHTML = head('Clientes', 'Clientes do calendário editorial. "Acttus - Interno" aparece em amarelo.',
  '<button class="btn pri" id="newCli">' + ic('plus') + ' Novo cliente</button>') +
  '<div class="panel"><div class="bd">' + rows + '</div></div>';
 $('#newCli', el).onclick = openClientModal;
}
function openClientModal() {
 openModal('Novo cliente', ic('building'),
  '<label class="fld"><span>Nome do cliente</span><input id="cNome" placeholder="Ex.: Escritório Silva"></label>' +
  '<label class="chk"><input type="checkbox" id="cInt"> É interno (Acttus) — aparece em amarelo</label>',
  function () {
   var name = $('#cNome').value.trim(); if (!name) { toast('Informe o nome', 'err'); return false; }
   S.createClient({ name: name, is_internal: $('#cInt').checked }).then(function () { toast('Cliente criado'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, 'Criar cliente');
}

/* ===================================================================
   USUÁRIOS
   =================================================================== */
function renderUsuarios(el) {
 var rows = st.users.map(function (u) {
  return '<div class="lrow">' + avatar(u.name, 30) + '<div class="tx"><div class="t">' + esc(u.name) + '</div><div class="m">' + esc(u.email) + '</div></div></div>';
 }).join('') || '<div class="empty">Nenhum usuário ainda.</div>';
 el.innerHTML = head('Usuários', 'Quem acessa o sistema. O login é feito com CPF + email.',
  '<button class="btn pri" id="newUsr">' + ic('plus') + ' Novo usuário</button>') +
  '<div class="note">' + ic('alert', 15) + ' Cada usuário entra com o <b>CPF</b> e o <b>email</b> cadastrados aqui. Guarde esses dados.</div>' +
  '<div class="panel"><div class="bd">' + rows + '</div></div>';
 $('#newUsr', el).onclick = openUserModal;
}
function openUserModal() {
 openModal('Novo usuário', ic('users'),
  '<label class="fld"><span>Nome</span><input id="uNome" placeholder="Nome completo"></label>' +
  '<label class="fld"><span>CPF</span><input id="uCpf" inputmode="numeric" placeholder="000.000.000-00"></label>' +
  '<label class="fld"><span>Email</span><input id="uEmail" type="email" placeholder="pessoa@acttus.com.br"></label>',
  function () {
   var name = $('#uNome').value.trim(), cpf = onlyDigits($('#uCpf').value), email = $('#uEmail').value.trim();
   if (!name || !cpf || !email) { toast('Preencha nome, CPF e email', 'err'); return false; }
   if (cpf.length !== 11) { toast('CPF deve ter 11 dígitos', 'err'); return false; }
   S.createUser({ name: name, cpf: cpf, email: email }).then(function () { toast('Usuário criado'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, 'Criar usuário');
}

/* ===================================================================
   MODAL DE POST (criar/editar)
   =================================================================== */
function bindNew(el) { $$('[data-new]', el).forEach(function (b) { b.onclick = function () { openPostModal(null); }; }); }

function seg(name, options, current) {
 return '<div class="seg" data-seg="' + name + '">' + options.map(function (o) {
  return '<button type="button" class="' + (o.key === current ? 'on' : '') + '" data-v="' + o.key + '">' + esc(o.label) + '</button>';
 }).join('') + '</div>';
}
function openPostModal(post, defaults) {
 var p = post || {};
 var d = defaults || {};
 var editing = !!post;
 var cur = {
  client_id: p.client_id || d.client_id || (st.clients[0] && st.clients[0].id) || '',
  funnel_stage: p.funnel_stage || 'topo',
  post_type: p.post_type || 'estatico',
  channel: p.channel || 'organico',
  status: p.status || 'Agendado',
  pub_time: p.pub_time || '12:00'
 };
 var clientOpts = st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cur.client_id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
 var userOpts = '<option value="">Sem responsável</option>' + st.users.map(function (u) { return '<option value="' + u.id + '"' + (u.id === (p.responsible_id || '') ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('');
 var statusOpts = STATUS.map(function (s) { return '<option value="' + esc(s) + '"' + (s === cur.status ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('');
 var timeOpts = TIMES.map(function (t) { return '<option value="' + t + '"' + (t === cur.pub_time ? ' selected' : '') + '>' + t + '</option>'; }).join('');

 var body =
  '<label class="fld"><span>Título do post</span><input id="pTitle" value="' + esc(p.title || '') + '" placeholder="Ex.: 3 dúvidas sobre..."></label>' +
  '<div class="mrow2"><label class="fld"><span>Cliente</span><select id="pClient">' + (clientOpts || '<option value="">Crie um cliente antes</option>') + '</select></label>' +
  '<label class="fld"><span>Responsável</span><select id="pResp">' + userOpts + '</select></label></div>' +
  '<div class="fld"><span>Etapa do funil</span>' + seg('funnel_stage', FUNNEL.map(function (f) { return { key: f.key, label: f.short }; }), cur.funnel_stage) + '</div>' +
  '<div class="mrow2"><div class="fld"><span>Tipo</span>' + seg('post_type', TYPES, cur.post_type) + '</div>' +
  '<div class="fld"><span>Canal</span>' + seg('channel', CHANNELS, cur.channel) + '</div></div>' +
  '<div class="mrow3"><label class="fld"><span>Data</span><input type="date" id="pDate" value="' + esc(p.pub_date || d.pub_date || '') + '"></label>' +
  '<label class="fld"><span>Horário</span><select id="pTime">' + timeOpts + '</select></label>' +
  '<label class="fld"><span>Status</span><select id="pStatus">' + statusOpts + '</select></label></div>' +
  '<label class="fld"><span>Observações</span><textarea id="pNotes" rows="3" placeholder="Briefing, links, referências...">' + esc(p.notes || '') + '</textarea></label>';

 var extra = editing ? '<button class="btn danger" id="pDel">' + ic('trash', 15) + ' Excluir</button>' : '';
 openModal(editing ? 'Editar post' : 'Novo post', ic('calendar'), body, function () {
  var payload = {
   title: $('#pTitle').value.trim(),
   client_id: $('#pClient').value || null,
   responsible_id: $('#pResp').value || null,
   funnel_stage: cur.funnel_stage, post_type: cur.post_type, channel: cur.channel,
   status: $('#pStatus').value, pub_date: $('#pDate').value || null, pub_time: $('#pTime').value || null,
   notes: $('#pNotes').value
  };
  if (!payload.title) { toast('Informe o título', 'err'); return false; }
  var op = editing ? S.updatePost(post.id, payload) : S.createPost(payload);
  op.then(function () { toast(editing ? 'Post atualizado' : 'Post criado'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
  return false;
 }, editing ? 'Salvar' : 'Criar post', extra);

 // segmented controls
 $$('#mboxc .seg').forEach(function (sg) {
  var name = sg.getAttribute('data-seg');
  $$('button', sg).forEach(function (b) { b.onclick = function () { cur[name] = b.getAttribute('data-v'); $$('button', sg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }; });
 });
 if (editing) $('#pDel').onclick = function () {
  if (!confirm('Excluir este post?')) return;
  S.deletePost(post.id).then(function () { toast('Post excluído'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
 };
}

/* ===================================================================
   MODAL genérico
   =================================================================== */
var _modalSubmit = null;
function openModal(title, icon, bodyHTML, onSubmit, okLabel, extraLeft) {
 _modalSubmit = onSubmit;
 $('#mboxc').innerHTML =
  '<div class="mhd"><span class="mic">' + (icon || ic('plus')) + '</span><h3>' + esc(title) + '</h3><button class="mx" id="mClose">' + ic('x', 18) + '</button></div>' +
  '<form id="mForm" class="mbd">' + bodyHTML + '</form>' +
  '<div class="mft">' + (extraLeft || '<span></span>') + '<div class="mft-r"><button type="button" class="btn" id="mCancel">Cancelar</button><button type="submit" form="mForm" class="btn pri">' + esc(okLabel || 'Salvar') + '</button></div></div>';
 $('#modal').classList.add('show');
 $('#mClose').onclick = closeModal; $('#mCancel').onclick = closeModal;
 $('#mForm').onsubmit = function (e) { e.preventDefault(); if (_modalSubmit) _modalSubmit(); };
 var f = $('#mboxc input, #mboxc select, #mboxc textarea'); if (f) setTimeout(function () { f.focus(); }, 30);
}
function closeModal() { $('#modal').classList.remove('show'); $('#mboxc').innerHTML = ''; _modalSubmit = null; }
$('#modalBg').onclick = closeModal;
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); $('#notifpop').hidden = true; } });

/* ===================================================================
   NOTIFICAÇÕES (sino)
   =================================================================== */
function renderBell() {
 var unread = st.notifications.filter(function (n) { return !n.read_at; }).length;
 var dot = $('#bellDot'); dot.hidden = !unread; dot.textContent = unread;
 $('#bellIc').innerHTML = ic('bell', 18);
}
function toggleNotifs() {
 var p = $('#notifpop');
 if (!p.hidden) { p.hidden = true; return; }
 var list = st.notifications;
 p.innerHTML = '<div class="np-h">' + ic('bell', 16) + ' Notificações <button class="np-clr" id="npClr">marcar lidas</button></div>' +
  '<div class="np-l">' + (list.length ? list.map(function (n) {
   return '<div class="nrow' + (n.read_at ? '' : ' unread') + '"><span class="nic c-' + (n.kind === 'due' ? 'amber' : 'blue') + '">' + ic(n.kind === 'due' ? 'alert' : 'bell', 15) + '</span><div><div class="nt">' + esc(n.text) + '</div><div class="nd">' + esc(n.date || '') + '</div></div></div>';
  }).join('') : '<div class="empty">Sem notificações.</div>') + '</div>';
 p.hidden = false;
 var clr = $('#npClr'); if (clr) clr.onclick = function () { S.markNotifsRead().then(function () { toggleNotifs(); toggleNotifs(); }); };
}

/* ===================================================================
   LOGIN + BOOT
   =================================================================== */
/* ---------- tema (dark padrão / claro opcional) ---------- */
function currentTheme() { try { return localStorage.getItem('acttus_theme') || 'dark'; } catch (e) { return 'dark'; } }
function applyTheme(t) {
 var dark = t !== 'light';
 document.body.classList.toggle('light', !dark);
 var sw = $('#themeSwitch'); if (sw) sw.classList.toggle('on', dark);
 var ti = $('#themeIc'); if (ti) ti.innerHTML = ic(dark ? 'moon' : 'sun', 16);
}
function setTheme(t) { try { localStorage.setItem('acttus_theme', t); } catch (e) {} applyTheme(t); }

function showApp() {
 $('#login').style.display = 'none';
 $('#app').hidden = false;
 $('#btnCriar').innerHTML = ic('plus') + ' Novo post';
 $('#bellIc').innerHTML = ic('bell', 18);
 $('#outIc').innerHTML = ic('logout', 16);
 $('#btnCriar').onclick = function () { openPostModal(null); };
 $('#btnBell').onclick = toggleNotifs;
 $('#logout').onclick = function () { S.logout(); location.reload(); };
 var sw = $('#themeSwitch'); if (sw) sw.onclick = function () { setTheme(document.body.classList.contains('light') ? 'dark' : 'light'); };
 applyTheme(currentTheme());
 renderMe(); renderNav(); renderView(); renderBell();
}
function renderMe() {
 var u = st.user || {};
 $('#meRow').innerHTML = avatar(u.name, 30) + '<div class="me-tx"><div class="me-n">' + esc(u.name || '—') + '</div><div class="me-e">' + esc(u.email || '') + '</div></div>';
}
function showLogin(msg) {
 $('#app').hidden = true;
 $('#login').style.display = 'flex';
 if (msg) { var e = $('#loginErr'); e.textContent = msg; e.style.display = 'block'; }
}

function bindLogin() {
 $('#loginForm').onsubmit = function (e) {
  e.preventDefault();
  var cpf = onlyDigits($('#loginCpf').value), email = $('#loginEmail').value.trim();
  var err = $('#loginErr'); err.style.display = 'none';
  if (!cpf || !email) { err.textContent = 'Informe CPF e email.'; err.style.display = 'block'; return; }
  var btn = $('#loginBtn'); btn.disabled = true; btn.textContent = 'Entrando...';
  S.login(cpf, email).then(function () { return boot(); }).catch(function (er) {
   btn.disabled = false; btn.textContent = 'Entrar';
   err.textContent = er.message || 'Falha no login'; err.style.display = 'block';
  });
 };
}

var booted = false;
function boot() {
 return S.loadAll().then(function () {
  if (!booted) { S.subscribe(onStoreChange); S.startPolling(); booted = true; }
  showApp();
 }).catch(function (e) {
  if (String(e.message).indexOf('Sessão') >= 0 || !S.isAuthed()) { showLogin(); }
  else { showLogin('Não foi possível carregar os dados: ' + e.message); }
 });
}
function onStoreChange() {
 if (!S.isAuthed()) { showLogin(); return; }
 renderNav(); renderView(); renderBell();
}

applyTheme(currentTheme());
bindLogin();
if (S.isAuthed()) { boot(); } else { showLogin(); }

})();
