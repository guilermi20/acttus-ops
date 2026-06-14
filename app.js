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
 book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
 folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 chart:'<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
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
function toast(t, kind) { var e = $('#toast'); e.className = 'toast show' + (kind ? ' ' + kind : ''); e.textContent = t; e.title = 'Clique para fechar'; e.onclick = function () { e.className = 'toast'; clearTimeout(_t); }; clearTimeout(_t); _t = setTimeout(function () { e.className = 'toast'; }, kind === 'err' ? 6000 : 3000); }

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
var OPEN_STATUS = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação'];
function isOpen(p) { return OPEN_STATUS.indexOf(p.status) >= 0; }
function isOverdue(p) { return p.due_date && p.due_date < todayISO() && p.status !== 'Postado'; }
function diffDays(aIso, bIso) { var a = new Date(aIso + 'T00:00:00Z'), b = new Date(bIso + 'T00:00:00Z'); return Math.round((b - a) / 86400000); }
function initials(name) { var parts = String(name || '?').trim().split(/\s+/); return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase(); }
function fmtDay(iso) { if (!iso) return '—'; var p = iso.split('-'); return p[2] + ' ' + MON[+p[1] - 1]; }
function fmtFull(iso) { if (!iso) return '—'; var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function userById(id) { for (var i = 0; i < st.users.length; i++) if (st.users[i].id === id) return st.users[i]; return null; }

function badge(text, color) { return '<span class="bg c-' + color + '"><span class="bgdot"></span>' + esc(text) + '</span>'; }
function avatar(name, sz) { sz = sz || 26; return '<span class="avt" title="' + esc(name || '—') + '" style="width:' + sz + 'px;height:' + sz + 'px;font-size:' + (sz * .4).toFixed(0) + 'px">' + esc(initials(name)) + '</span>'; }

/* ===================================================================
   ROUTER
   =================================================================== */
var NAV = [
 { sec: 'Painel', admin: true, items: [{ key: 'dashboard', label: 'Visão geral', icon: 'dashboard' }, { key: 'funil', label: 'Funil 50/30/20', icon: 'target' }, { key: 'dashboards', label: 'Dashboards', icon: 'chart' }] },
 { sec: 'Editorial', items: [{ key: 'calendario', label: 'Calendário', icon: 'calendar' }, { key: 'posts', label: 'Posts', icon: 'grid' }, { key: 'minhas', label: 'Minhas demandas', icon: 'check' }, { key: 'rotinas', label: 'Rotinas', icon: 'clock' }, { key: 'ideias', label: 'Banco de ideias', icon: 'zap' }] },
 { sec: 'Operação', items: [{ key: 'projetos', label: 'Projetos', icon: 'folder' }, { key: 'reunioes', label: 'Reuniões', icon: 'book' }] },
 { sec: 'Cadastros', items: [{ key: 'clientes', label: 'Clientes', icon: 'building' }, { key: 'usuarios', label: 'Usuários', icon: 'users' }] }
];
var VIEWS = { dashboard: renderDashboard, funil: renderFunil, dashboards: renderDashboards, calendario: renderCalendario, posts: renderPosts, minhas: renderMinhas, rotinas: renderRotinas, ideias: renderIdeias, projetos: renderProjetos, projeto: renderProjeto, reunioes: renderReunioes, clientes: renderClientes, cliente: renderCliente, usuarios: renderUsuarios };
var ADMIN_ROUTES = { dashboard: 1, funil: 1, dashboards: 1 };
var route = 'calendario';

function isAdmin() { return !!(st.user && st.user.role === 'admin'); }
function go(v) { if (ADMIN_ROUTES[v] && !isAdmin()) v = 'calendario'; route = v; renderNav(); renderView(); }
function renderNav() {
 var h = '';
 NAV.forEach(function (g) {
  if (g.admin && !isAdmin()) return;
  h += '<div class="navsec">' + esc(g.sec) + '</div>';
  g.items.forEach(function (it) {
   if (it.admin && !isAdmin()) return;
   var cnt = navCount(it.key);
   var on = route === it.key || (route === 'cliente' && it.key === 'clientes') || (route === 'projeto' && it.key === 'projetos');
   h += '<div class="navitem' + (on ? ' on' : '') + '" data-go="' + it.key + '">' + ic(it.icon, 18) + '<span>' + esc(it.label) + '</span>' + (cnt ? '<span class="cnt">' + cnt + '</span>' : '') + '</div>';
  });
 });
 $('#nav').innerHTML = h;
 $$('#nav .navitem').forEach(function (n) { n.onclick = function () { go(n.getAttribute('data-go')); }; });
}
function navCount(k) {
 if (k === 'posts') return st.posts.length;
 if (k === 'minhas') return st.posts.filter(function (p) { return st.user && p.responsible_id === st.user.id; }).length;
 if (k === 'rotinas') return st.routines.filter(function (r) { return st.user && r.owner_id === st.user.id && !r.done; }).length;
 if (k === 'ideias') return st.ideas.filter(function (i) { return i.status === 'nova'; }).length;
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
  return '<tr><td class="cn"><span class="cdot c-' + (cl.is_internal ? 'yellow' : 'pink') + '"></span><button class="linklike" data-cli="' + cl.id + '">' + esc(cl.name) + '</button></td>' + cells + '<td>' + t + '</td><td><button class="tag ' + (ok ? 'ok' : 'off') + '" data-cli="' + cl.id + '" title="Abrir calendário do cliente">' + (ok ? 'ok ' : 'Ajustar ') + ic('right', 12) + '</button></td></tr>';
 }).join('');

 var clientOpts = '<option value="">Todos os clientes</option>' + st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === funilClient ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');

 el.innerHTML = head('Funil 50/30/20', 'Distribuição dos posts por etapa de funil vs. a meta 50% topo / 30% meio / 20% fundo.',
  '<select class="select" id="fnCli">' + clientOpts + '</select>') +
  '<div class="meta-banner ' + (globalOk ? 'ok' : 'off') + '">' + (globalOk ? ic('check') + ' Dentro da meta 50/30/20' : ic('alert') + ' Fora da meta 50/30/20 — ajuste o mix de conteúdo') + '<span class="mb-total">' + total + ' posts</span></div>' +
  '<div class="panel"><div class="bd fn-wrap">' + (total ? bars : '<div class="empty">Sem posts para este filtro.</div>') + '</div></div>' +
  '<div class="panel"><div class="hd"><h3>Por cliente</h3></div><div class="bd"><table class="tbl"><thead><tr><th>Cliente</th><th>Topo</th><th>Meio</th><th>Fundo</th><th>Total</th><th>Meta</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">Sem dados.</td></tr>') + '</tbody></table></div></div>';

 $('#fnCli', el).onchange = function () { funilClient = this.value; renderFunil(el); };
 $$('[data-cli]', el).forEach(function (b) { b.onclick = function () { openCliente(b.getAttribute('data-cli')); }; });
}

/* ===================================================================
   CALENDÁRIO unificado
   =================================================================== */
var calY, calM, calClient = '', calDragId = null;
function calInit() { if (calY == null) { var t = todayISO().split('-'); calY = +t[0]; calM = +t[1] - 1; } }
// Monta a grade do mês (barra + dias) para uma lista de posts já filtrada.
function calGridHTML(posts) {
 calInit();
 var first = new Date(Date.UTC(calY, calM, 1));
 var startW = first.getUTCDay();
 var days = new Date(Date.UTC(calY, calM + 1, 0)).getUTCDate();
 var byDay = {};
 posts.filter(function (p) { return p.pub_date; }).forEach(function (p) { var d = p.pub_date.split('-'); if (+d[0] === calY && +d[1] - 1 === calM) { var k = +d[2]; (byDay[k] = byDay[k] || []).push(p); } });
 Object.keys(byDay).forEach(function (k) { byDay[k].sort(function (a, b) { return (a.pub_time || '') < (b.pub_time || '') ? -1 : 1; }); });

 var cells = '';
 for (var i = 0; i < startW; i++) cells += '<div class="cal-cell out"></div>';
 var todays = todayISO();
 for (var d = 1; d <= days; d++) {
  var iso = calY + '-' + String(calM + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  var list = byDay[d] || [];
  var evs = list.map(function (p) {
   return '<div class="cal-ev c-' + postColor(p) + '" draggable="true" data-post="' + p.id + '" title="' + esc(p.title + ' — ' + (p.client_name || 'Sem cliente') + ' — ' + typeLabel(p.post_type)) + '">' +
    '<div class="ce-t">' + (p.pub_time ? '<b>' + p.pub_time + '</b> ' : '') + esc(p.title) + '</div>' +
    '<div class="ce-m">' + esc(p.client_name || 'Sem cliente') + ' · ' + typeLabel(p.post_type) + '</div></div>';
  }).join('');
  cells += '<div class="cal-cell' + (iso === todays ? ' today' : '') + '" data-day="' + iso + '">' +
   '<div class="cal-h"><span class="cal-d">' + d + '</span><button class="cal-add" data-add="' + iso + '">+</button></div>' +
   '<div class="cal-evs">' + evs + '</div></div>';
 }
 return '<div class="cal-bar"><button class="btn icon" id="calPrev">' + ic('left') + '</button>' +
  '<div class="cal-title">' + MONFULL[calM] + ' ' + calY + '</div>' +
  '<button class="btn icon" id="calNext">' + ic('right') + '</button>' +
  '<button class="btn sm" id="calToday">Hoje</button>' +
  '<span class="cal-legend"><span class="cdot c-yellow"></span>Acttus &nbsp;<span class="cdot c-pink"></span>Clientes</span></div>' +
  '<div class="cal-grid head">' + WD.map(function (w) { return '<div class="cal-wd">' + w + '</div>'; }).join('') + '</div>' +
  '<div class="cal-grid">' + cells + '</div>';
}
// Liga navegação do mês + clique nos eventos. rerender re-desenha a view atual.
function bindCal(el, rerender, addClientId) {
 $('#calPrev', el).onclick = function () { calM--; if (calM < 0) { calM = 11; calY--; } rerender(); };
 $('#calNext', el).onclick = function () { calM++; if (calM > 11) { calM = 0; calY++; } rerender(); };
 $('#calToday', el).onclick = function () { var t = todayISO().split('-'); calY = +t[0]; calM = +t[1] - 1; rerender(); };
 $$('[data-post]', el).forEach(function (e) {
  e.onclick = function (ev) { ev.stopPropagation(); var p = postById(e.getAttribute('data-post')); if (p) openPostModal(p); };
  e.ondragstart = function (ev) { calDragId = e.getAttribute('data-post'); e.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; ev.stopPropagation(); };
  e.ondragend = function () { calDragId = null; e.classList.remove('dragging'); };
 });
 $$('[data-day]', el).forEach(function (cell) {
  cell.ondragover = function (ev) { ev.preventDefault(); cell.classList.add('over'); };
  cell.ondragleave = function () { cell.classList.remove('over'); };
  cell.ondrop = function (ev) {
   ev.preventDefault(); cell.classList.remove('over');
   var id = calDragId, day = cell.getAttribute('data-day'); if (!id || !day) return;
   var p = postById(id); if (!p || p.pub_date === day) return;
   S.updatePost(id, { pub_date: day }).then(function () { toast('Publicação movida para ' + fmtDay(day)); }).catch(function (er) { toast(er.message, 'err'); });
  };
 });
 $$('[data-add]', el).forEach(function (e) { e.onclick = function (ev) { ev.stopPropagation(); openPostModal(null, { pub_date: e.getAttribute('data-add'), client_id: addClientId || '' }); }; });
}
function renderCalendario(el) {
 var posts = calClient ? st.posts.filter(function (p) { return p.client_id === calClient; }) : st.posts;
 var clientOpts = '<option value="">Todos os clientes</option>' + st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === calClient ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
 el.innerHTML = head('Calendário', 'Todos os clientes num só lugar. Amarelo = Acttus (interno) · Rosa = clientes.',
  '<select class="select" id="calCli">' + clientOpts + '</select>' +
  '<button class="btn pri" data-new="1">' + ic('plus') + ' Novo post</button>') +
  calGridHTML(posts);
 $('#calCli', el).onchange = function () { calClient = this.value; renderCalendario(el); };
 bindCal(el, function () { renderCalendario(el); }, calClient);
 bindNew(el);
}

// ---- página de um cliente: kanban em cima + calendário embaixo ----
var clienteId = '';
function openCliente(id) { clienteId = id; route = 'cliente'; renderNav(); renderView(); var sc = document.querySelector('.scroll'); if (sc) sc.scrollTop = 0; }
function renderCliente(el) {
 var cl = clientById(clienteId);
 if (!cl) { go('clientes'); return; }
 calInit();
 var ymPlan = calY + '-' + String(calM + 1).padStart(2, '0');
 var planned = (cl.planned_months || []).indexOf(ymPlan) >= 0;
 var posts = st.posts.filter(function (p) { return p.client_id === cl.id; });
 var t = posts.length, counts = { topo: 0, meio: 0, fundo: 0 };
 posts.forEach(function (p) { counts[p.funnel_stage] = (counts[p.funnel_stage] || 0) + 1; });
 var mix = FUNNEL.map(function (f) { return funnelMeta(f.key).short + ' ' + (t ? Math.round((counts[f.key] || 0) / t * 100) : 0) + '%'; }).join(' · ');
 el.innerHTML = head(cl.name, (cl.is_internal ? 'Interno (Acttus) · ' : '') + t + ' post' + (t === 1 ? '' : 's') + (t ? ' · ' + mix : ''),
  '<button class="btn" data-back="1">' + ic('left') + ' Voltar</button>' +
  '<button class="btn" data-clilink="' + esc(cl.share_token || '') + '">' + ic('link', 15) + ' Link do painel</button>' +
  '<button class="btn" data-cliedit2="1">' + ic('edit', 15) + ' Editar</button>' +
  '<button class="btn pri" data-newc="1">' + ic('plus') + ' Novo post</button>') +
  '<div class="panel"><div class="hd"><h3>Kanban</h3><span class="sp"></span><span class="sub">arraste para mudar o status</span></div><div class="bd"><div class="board">' + statusColumns(posts) + '</div></div></div>' +
  '<div class="panel"><div class="hd"><h3>Calendário</h3><span class="sp"></span>' +
   (planned ? '<span class="bg c-green"><span class="bgdot"></span>Mês planejado</span>' : '') +
   '<button class="btn sm' + (planned ? ' pri' : '') + '" id="togglePlan">' + (planned ? ic('check', 14) + ' Planejado' : 'Marcar mês como planejado') + '</button>' +
   '</div><div class="bd">' + calGridHTML(posts) + '</div></div>';
 $('[data-back]', el).onclick = function () { go('clientes'); };
 var tp = $('#togglePlan', el); if (tp) tp.onclick = function () { S.togglePlan(cl.id, ymPlan).then(function () { toast(planned ? 'Mês desmarcado' : 'Mês marcado como planejado'); renderCliente(el); }).catch(function (e) { toast(e.message, 'err'); }); };
 var clk = $('[data-clilink]', el); if (clk) clk.onclick = function () { copyPanelLink(cl.share_token); };
 var ced = $('[data-cliedit2]', el); if (ced) ced.onclick = function () { openClientModal(cl); };
 $$('[data-newc]', el).forEach(function (b) { b.onclick = function () { openPostModal(null, { client_id: cl.id }); }; });
 bindBoard(el);
 bindCal(el, function () { renderCliente(el); }, cl.id);
}

/* ===================================================================
   POSTS — board com os 6 status (drag & drop)
   =================================================================== */
var boardCli = '', boardFunnel = '';
var dragId = null;
// Colunas de status para um conjunto de posts (reutilizado em Posts, Minhas demandas e Cliente).
function statusColumns(posts) {
 return STATUS.map(function (s) {
  var list = posts.filter(function (p) { return p.status === s; });
  var cards = list.map(postCard).join('') || '<div class="kc-empty">—</div>';
  return '<div class="kcol" data-status="' + esc(s) + '"><div class="kcol-h">' + badge(s, STATUS_COLOR[s]) + '<span class="kcnt">' + list.length + '</span></div><div class="kcol-b" data-drop="' + esc(s) + '">' + cards + '</div></div>';
 }).join('');
}
function bindBoard(el) {
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
   S.updatePost(id, { status: status }).then(function () { toast('Status: ' + status + ' · grupo avisado no WhatsApp'); }).catch(function (er) { toast(er.message, 'err'); });
  };
 });
}
function renderPosts(el) {
 var posts = st.posts.filter(function (p) {
  if (boardCli && p.client_id !== boardCli) return false;
  if (boardFunnel && p.funnel_stage !== boardFunnel) return false;
  return true;
 });
 var clientOpts = '<option value="">Todos os clientes</option>' + st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === boardCli ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
 var funnelOpts = '<option value="">Todo o funil</option>' + FUNNEL.map(function (f) { return '<option value="' + f.key + '"' + (f.key === boardFunnel ? ' selected' : '') + '>' + f.label + '</option>'; }).join('');

 el.innerHTML = head('Posts', 'Arraste os cards entre as colunas — a mudança de status é avisada no grupo do WhatsApp.',
  '<select class="select" id="bCli">' + clientOpts + '</select>' +
  '<select class="select" id="bFun">' + funnelOpts + '</select>' +
  '<button class="btn pri" data-new="1">' + ic('plus') + ' Novo post</button>') +
  '<div class="board">' + statusColumns(posts) + '</div>';

 $('#bCli', el).onchange = function () { boardCli = this.value; renderPosts(el); };
 $('#bFun', el).onchange = function () { boardFunnel = this.value; renderPosts(el); };
 bindNew(el); bindBoard(el);
}
// Linha de demanda priorizada (mostra o prazo de CONCLUSÃO).
function priorityRow(p) {
 var c = postColor(p);
 var dd = p.due_date ? 'concluir ' + fmtDay(p.due_date) : 'sem prazo';
 return '<div class="arow" data-post="' + p.id + '"><span class="cdot c-' + c + '"></span>' +
  '<div class="tx"><div class="t">' + esc(p.title) + '</div><div class="m">' + esc(p.client_name || 'Sem cliente') + ' · ' + typeLabel(p.post_type) + '</div></div>' +
  '<div class="rt">' + badge(p.status, STATUS_COLOR[p.status]) + '<div class="dt">' + dd + (p.pub_time ? ' · ' + p.pub_time : '') + '</div></div></div>';
}
// 6 blocos por proximidade do prazo de conclusão (mais perto = mais prioritário).
var PRIO_DEFS = [
 { t: '🔴 Atrasadas', c: 'red' },
 { t: 'Vence hoje', c: 'amber' },
 { t: 'Vence amanhã', c: 'amber' },
 { t: 'Em 2 dias', c: 'blue' },
 { t: 'Em 3 dias', c: 'blue' },
 { t: 'Mais pra frente / sem prazo', c: 'gray' }
];
function prioBucket(p, today) {
 if (!p.due_date) return 5;
 var d = diffDays(today, p.due_date);
 if (d < 0) return 0; if (d === 0) return 1; if (d === 1) return 2; if (d === 2) return 3; if (d === 3) return 4;
 return 5;
}
function renderMinhas(el) {
 var me = st.user || {}, today = todayISO();
 var mine = st.posts.filter(function (p) { return p.responsible_id === me.id; });
 var groups = [[], [], [], [], [], []];
 mine.forEach(function (p) { groups[prioBucket(p, today)].push(p); });
 groups.forEach(function (g) { g.sort(function (a, b) { return (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1; }); });
 var blocks = PRIO_DEFS.map(function (d, i) {
  if (!groups[i].length) return '';
  return '<div class="prioblock"><div class="priohd"><span class="bg c-' + d.c + '"><span class="bgdot"></span>' + esc(d.t) + '</span><span class="kcnt">' + groups[i].length + '</span></div>' +
   groups[i].map(priorityRow).join('') + '</div>';
 }).join('') || '<div class="empty">Nenhum post atribuído a você.</div>';
 el.innerHTML = head('Minhas demandas', 'Seus posts por prazo de conclusão — os mais próximos de vencer primeiro' + (me.name ? ' — ' + esc(me.name) : '') + '.',
  '<button class="btn pri" data-newmine="1">' + ic('plus') + ' Novo post</button>') +
  '<div class="panel"><div class="bd">' + blocks + '</div></div>';
 $$('[data-newmine]', el).forEach(function (b) { b.onclick = function () { openPostModal(null, { responsible_id: me.id }); }; });
 bindPostRows(el);
}
function renderRotinas(el) {
 var me = st.user || {};
 var myR = st.routines.filter(function (r) { return r.owner_id === me.id; });
 var pend = myR.filter(function (r) { return !r.done; }).length;
 el.innerHTML = head('Rotinas', 'Suas tarefas de rotina (pessoais — não são posts)' + (me.name ? ' — ' + esc(me.name) : '') + '.',
  '<button class="btn pri" id="newRot">' + ic('plus') + ' Nova rotina</button>') +
  '<div class="kpis">' + kpi('Pendentes', pend, 'a fazer', pend ? 'amber' : 'green') + kpi('Concluídas', myR.length - pend, 'feitas', 'green') + kpi('Total', myR.length, 'no total') + '</div>' +
  '<div class="panel"><div class="bd">' + routinesHTML(myR) + '</div></div>';
 $('#newRot', el).onclick = function () { openRoutineModal(null); };
 bindRoutines(el);
}
function routinesHTML(list) {
 if (!list.length) return '<div class="empty">Sem rotinas ainda. Clique em "Nova".</div>';
 return list.map(function (r) {
  return '<div class="rrow' + (r.done ? ' done' : '') + (isOverdueRoutine(r) ? ' late' : '') + '">' +
   '<input type="checkbox" class="rchk" data-rdone="' + r.id + '"' + (r.done ? ' checked' : '') + '>' +
   '<div class="tx" data-redit="' + r.id + '"><div class="t">' + esc(r.title) + '</div>' + (r.due_date ? '<div class="m">' + ic('clock', 12) + ' ' + fmtFull(r.due_date) + '</div>' : '') + '</div>' +
   '<button class="iconbtn" data-rdel="' + r.id + '" title="Excluir">' + ic('trash', 14) + '</button></div>';
 }).join('');
}
function isOverdueRoutine(r) { return !r.done && r.due_date && r.due_date < todayISO(); }
function bindRoutines(el) {
 $$('[data-rdone]', el).forEach(function (c) { c.onclick = function () { S.updateRoutine(c.getAttribute('data-rdone'), { done: c.checked }).then(function () { toast(c.checked ? 'Concluída' : 'Reaberta'); }).catch(function (e) { toast(e.message, 'err'); }); }; });
 $$('[data-redit]', el).forEach(function (t) { t.onclick = function () { var id = t.getAttribute('data-redit'), r = null; for (var i = 0; i < st.routines.length; i++) if (st.routines[i].id === id) r = st.routines[i]; if (r) openRoutineModal(r); }; });
 $$('[data-rdel]', el).forEach(function (b) { b.onclick = function () { if (!confirm('Excluir esta rotina?')) return; S.deleteRoutine(b.getAttribute('data-rdel')).then(function () { toast('Rotina excluída'); }).catch(function (e) { toast(e.message, 'err'); }); }; });
}
function openRoutineModal(rt) {
 var r = rt || {}, editing = !!rt;
 openModal(editing ? 'Editar rotina' : 'Nova rotina', ic('check'),
  '<label class="fld"><span>Título</span><input id="rtTitle" value="' + esc(r.title || '') + '" placeholder="Ex.: Responder comentários do dia"></label>' +
  '<label class="fld"><span>Prazo</span><input type="date" id="rtDue" value="' + esc(r.due_date || '') + '"></label>' +
  '<label class="fld"><span>Notas</span><textarea id="rtNotes" rows="3" placeholder="Detalhes (opcional)">' + esc(r.notes || '') + '</textarea></label>',
  function () {
   var title = $('#rtTitle').value.trim(); if (!title) { toast('Informe o título', 'err'); return false; }
   var payload = { title: title, due_date: $('#rtDue').value || null, notes: $('#rtNotes').value };
   var op = editing ? S.updateRoutine(rt.id, payload) : S.createRoutine(payload);
   op.then(function () { toast(editing ? 'Rotina salva' : 'Rotina criada'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, editing ? 'Salvar' : 'Criar rotina', editing ? '<button class="btn danger" id="rtDel">' + ic('trash', 15) + ' Excluir</button>' : '');
 if (editing) $('#rtDel').onclick = function () { if (!confirm('Excluir esta rotina?')) return; S.deleteRoutine(rt.id).then(function () { toast('Rotina excluída'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); }); };
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
function clientAvatar(c, sz) {
 sz = sz || 30;
 if (c.avatar_url) return '<span class="cliav" style="width:' + sz + 'px;height:' + sz + 'px;background-image:url(' + JSON.stringify(c.avatar_url) + ')"></span>';
 return '<span class="cliav ph c-' + (c.is_internal ? 'yellow' : 'pink') + '" style="width:' + sz + 'px;height:' + sz + 'px;font-size:' + Math.round(sz * 0.42) + 'px">' + esc((c.name || '?').charAt(0).toUpperCase()) + '</span>';
}
function copyPanelLink(token) {
 if (!token) { toast('Cliente sem link ainda', 'err'); return; }
 var url = location.origin + '/cliente?t=' + token;
 if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('Link do painel copiado', url); }).catch(function () { prompt('Link do painel do cliente:', url); });
 else prompt('Link do painel do cliente:', url);
}
function renderClientes(el) {
 var rows = st.clients.map(function (c) {
  var n = st.posts.filter(function (p) { return p.client_id === c.id; }).length;
  return '<div class="lrow click" data-cli="' + c.id + '">' + clientAvatar(c, 32) +
   '<div class="tx"><div class="t">' + esc(c.name) + '</div><div class="m">' + (c.is_internal ? 'Interno (Acttus)' : 'Cliente') + ' · ' + n + ' posts</div></div>' +
   '<div class="rt rowacts">' +
    '<button class="iconbtn" data-clilink="' + esc(c.share_token || '') + '" title="Copiar link do painel do cliente">' + ic('link', 16) + '</button>' +
    '<button class="iconbtn" data-cliedit="' + c.id + '" title="Editar cliente">' + ic('edit', 16) + '</button>' +
    '<span class="open-link">abrir ' + ic('right', 13) + '</span></div></div>';
 }).join('') || '<div class="empty">Nenhum cliente ainda.</div>';
 el.innerHTML = head('Clientes', 'Clique no cliente para o kanban e o calendário dele. Use o 🔗 para compartilhar o painel (só visualização).',
  '<button class="btn pri" id="newCli">' + ic('plus') + ' Novo cliente</button>') +
  '<div class="panel"><div class="bd">' + rows + '</div></div>';
 $('#newCli', el).onclick = function () { openClientModal(null); };
 $$('[data-cli]', el).forEach(function (r) { r.onclick = function () { openCliente(r.getAttribute('data-cli')); }; });
 $$('[data-cliedit]', el).forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var c = clientById(b.getAttribute('data-cliedit')); if (c) openClientModal(c); }; });
 $$('[data-clilink]', el).forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); copyPanelLink(b.getAttribute('data-clilink')); }; });
}
// Upload de arquivo direto para o Vercel Blob → retorna a URL.
function uploadBlob(file) {
 return import('https://esm.sh/@vercel/blob@2.4.0/client').then(function (mod) {
  return mod.upload('uploads/' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_'), file, { access: 'public', handleUploadUrl: '/api/posts?action=upload', clientPayload: st.token });
 }).then(function (blob) { return blob.url; });
}
// Widget de imagem com preview + enviar/trocar/remover.
function imgUploader(box, getUrl, setUrl) {
 function paint() {
  var u = getUrl();
  box.innerHTML = (u ? '<span class="imgup-prev" style="background-image:url(' + JSON.stringify(u) + ')"></span>' : '<span class="imgup-prev ph">' + ic('plus', 16) + '</span>') +
   '<label class="btn sm">' + (u ? 'Trocar' : 'Enviar imagem') + '<input type="file" accept="image/*" hidden></label>' +
   (u ? '<button type="button" class="iconbtn" data-rm="1" title="Remover">' + ic('x', 14) + '</button>' : '');
  box.querySelector('input[type=file]').onchange = function () {
   var f = this.files && this.files[0]; if (!f) return; this.value = '';
   toast('Enviando imagem…');
   uploadBlob(f).then(function (url) { setUrl(url); paint(); toast('Imagem enviada'); }).catch(function (e) { toast('Falha: ' + (e.message || e), 'err'); });
  };
  var rm = box.querySelector('[data-rm]'); if (rm) rm.onclick = function () { setUrl(''); paint(); };
 }
 paint();
}
function openClientModal(cli) {
 var c = cli || {}, editing = !!cli;
 var avatarUrl = c.avatar_url || '', coverUrl = c.cover_url || '';
 openModal(editing ? 'Editar cliente' : 'Novo cliente', ic('building'),
  '<label class="fld"><span>Nome do cliente</span><input id="cNome" value="' + esc(c.name || '') + '" placeholder="Ex.: Escritório Silva"></label>' +
  '<label class="chk"><input type="checkbox" id="cInt"' + (c.is_internal ? ' checked' : '') + '> É interno (Acttus) — aparece em amarelo</label>' +
  '<div class="fld"><span>Foto de perfil</span><div class="imgup" id="avUp"></div></div>' +
  '<div class="fld"><span>Capa</span><div class="imgup" id="cvUp"></div></div>',
  function () {
   var name = $('#cNome').value.trim(); if (!name) { toast('Informe o nome', 'err'); return false; }
   var payload = { name: name, is_internal: $('#cInt').checked, avatar_url: avatarUrl || null, cover_url: coverUrl || null };
   var op = editing ? S.updateClient(cli.id, payload) : S.createClient(payload);
   op.then(function () { toast(editing ? 'Cliente salvo' : 'Cliente criado'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, editing ? 'Salvar' : 'Criar cliente');
 imgUploader($('#avUp'), function () { return avatarUrl; }, function (u) { avatarUrl = u; });
 imgUploader($('#cvUp'), function () { return coverUrl; }, function (u) { coverUrl = u; });
}

/* ===================================================================
   USUÁRIOS
   =================================================================== */
function renderUsuarios(el) {
 var rows = st.users.map(function (u) {
  return '<div class="lrow click" data-usr="' + u.id + '">' + avatar(u.name, 30) + '<div class="tx"><div class="t">' + esc(u.name) + '</div><div class="m">' + esc(u.email) + '</div></div><div class="rt"><span class="open-link">editar ' + ic('edit', 13) + '</span></div></div>';
 }).join('') || '<div class="empty">Nenhum usuário ainda.</div>';
 el.innerHTML = head('Usuários', 'Quem acessa o sistema. Clique num usuário para editar. Login = CPF + email.',
  '<button class="btn pri" id="newUsr">' + ic('plus') + ' Novo usuário</button>') +
  '<div class="note">' + ic('alert', 15) + ' Cada usuário entra com o <b>CPF</b> e o <b>email</b> cadastrados aqui. Guarde esses dados.</div>' +
  '<div class="panel"><div class="bd">' + rows + '</div></div>';
 $('#newUsr', el).onclick = function () { openUserModal(null); };
 $$('[data-usr]', el).forEach(function (r) { r.onclick = function () { var id = r.getAttribute('data-usr'), u = null; for (var i = 0; i < st.users.length; i++) if (st.users[i].id === id) u = st.users[i]; if (u) openUserModal(u); }; });
}
function openUserModal(user) {
 var u = user || {}, editing = !!user;
 openModal(editing ? 'Editar usuário' : 'Novo usuário', ic('users'),
  '<label class="fld"><span>Nome</span><input id="uNome" value="' + esc(u.name || '') + '" placeholder="Nome completo"></label>' +
  '<label class="fld"><span>CPF</span><input id="uCpf" inputmode="numeric" value="' + esc(u.cpf || '') + '" placeholder="000.000.000-00"></label>' +
  '<label class="fld"><span>Email</span><input id="uEmail" type="email" value="' + esc(u.email || '') + '" placeholder="pessoa@acttus.com.br"></label>' +
  '<label class="fld"><span>Telefone (com DDI — usado nos avisos de rotina no WhatsApp)</span><input id="uPhone" inputmode="numeric" value="' + esc(u.phone || '') + '" placeholder="5511999999999"></label>' +
  (isAdmin() ? '<label class="fld"><span>Perfil</span><select id="uRole"><option value="member"' + (u.role !== 'admin' ? ' selected' : '') + '>Membro</option><option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin (vê dashboards)</option></select></label>' : ''),
  function () {
   var name = $('#uNome').value.trim(), cpf = onlyDigits($('#uCpf').value), email = $('#uEmail').value.trim();
   if (!name || !cpf || !email) { toast('Preencha nome, CPF e email', 'err'); return false; }
   if (cpf.length !== 11) { toast('CPF deve ter 11 dígitos', 'err'); return false; }
   var roleEl = $('#uRole');
   var payload = { name: name, cpf: cpf, email: email, phone: onlyDigits($('#uPhone').value), role: roleEl ? roleEl.value : (u.role || 'member') };
   var op = editing ? S.updateUser(user.id, payload) : S.createUser(payload);
   op.then(function () { toast(editing ? 'Usuário atualizado' : 'Usuário criado'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, editing ? 'Salvar' : 'Criar usuário');
}

/* ===================================================================
   REUNIÕES (anotações estilo Notion)
   =================================================================== */
function renderReunioes(el) {
 var cards = st.meetings.map(function (m) {
  var parts = (m.participants || []).map(function (id) { var u = userById(id); return u ? u.name : null; }).filter(Boolean);
  return '<div class="mtcard" data-meet="' + m.id + '">' +
   '<div class="mtcard-h"><h4>' + esc(m.title) + '</h4>' + (m.category ? '<span class="bg c-blue">' + esc(m.category) + '</span>' : '') + '</div>' +
   '<div class="mtcard-meta">' + ic('calendar', 14) + ' ' + (m.meeting_date ? fmtFull(m.meeting_date) : 'sem data') + (parts.length ? ' &nbsp;·&nbsp; ' + ic('users', 14) + ' ' + esc(parts.join(', ')) : '') + '</div>' +
   '<div class="mtcard-notes' + (m.notes ? '' : ' empty-notes') + '">' + (m.notes ? esc(m.notes.slice(0, 240)) + (m.notes.length > 240 ? '…' : '') : 'Sem anotações ainda.') + '</div>' +
   '</div>';
 }).join('') || '<div class="empty">Nenhuma reunião registrada. Clique em "Nova pauta" para começar.</div>';
 el.innerHTML = head('Reuniões', 'Anotações de pautas e assuntos discutidos — simples como um bloco de notas.',
  '<button class="btn pri" id="newMeet">' + ic('plus') + ' Nova pauta</button>') +
  '<div class="mtgrid">' + cards + '</div>';
 $('#newMeet', el).onclick = function () { openMeetingModal(null); };
 $$('[data-meet]', el).forEach(function (c) { c.onclick = function () { var id = c.getAttribute('data-meet'), m = null; for (var i = 0; i < st.meetings.length; i++) if (st.meetings[i].id === id) m = st.meetings[i]; if (m) openMeetingModal(m); }; });
}
function openMeetingModal(meet) {
 var m = meet || {}, editing = !!meet, sel = m.participants || [];
 var partChecks = st.users.length ? st.users.map(function (u) {
  return '<label class="pchk"><input type="checkbox" value="' + u.id + '"' + (sel.indexOf(u.id) >= 0 ? ' checked' : '') + '> ' + esc(u.name) + '</label>';
 }).join('') : '<div class="sub">Nenhum usuário cadastrado ainda.</div>';
 var body =
  '<label class="fld"><span>Título</span><input id="mtTitle" value="' + esc(m.title || '') + '" placeholder="Ex.: Planejamento de conteúdo — julho"></label>' +
  '<div class="mrow2"><label class="fld"><span>Data</span><input type="date" id="mtDate" value="' + esc(m.meeting_date || '') + '"></label>' +
  '<label class="fld"><span>Categoria</span><input id="mtCat" value="' + esc(m.category || '') + '" placeholder="Ex.: Planejamento, Cliente, Interna"></label></div>' +
  '<div class="fld"><span>Participantes</span><div class="pchks">' + partChecks + '</div></div>' +
  '<label class="fld"><span>Pauta / anotações</span><textarea id="mtNotes" rows="9" placeholder="Assuntos discutidos, decisões, próximos passos...">' + esc(m.notes || '') + '</textarea></label>';
 var extra = editing ? '<button class="btn danger" id="mtDel">' + ic('trash', 15) + ' Excluir</button>' : '';
 openModal(editing ? 'Editar pauta' : 'Nova pauta', ic('book'), body, function () {
  var title = $('#mtTitle').value.trim();
  if (!title) { toast('Informe o título', 'err'); return false; }
  var parts = $$('#mboxc .pchks input:checked').map(function (i) { return i.value; });
  var payload = { title: title, meeting_date: $('#mtDate').value || null, category: $('#mtCat').value.trim(), participants: parts, notes: $('#mtNotes').value };
  var op = editing ? S.updateMeeting(meet.id, payload) : S.createMeeting(payload);
  op.then(function () { toast(editing ? 'Pauta salva' : 'Pauta criada'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
  return false;
 }, editing ? 'Salvar' : 'Criar pauta', extra);
 if (editing) $('#mtDel').onclick = function () { if (!confirm('Excluir esta pauta?')) return; S.deleteMeeting(meet.id).then(function () { toast('Pauta excluída'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); }); };
}

/* ===================================================================
   PROJETOS (internos)
   =================================================================== */
var PT_STATUS = ['A fazer', 'Em andamento', 'Concluída'];
var projetoId = '';
function projStatusColor(s) { return s === 'Concluído' ? 'green' : s === 'Pausado' ? 'amber' : 'blue'; }
function renderProjetos(el) {
 var cards = st.projects.map(function (p) {
  return '<div class="card" data-proj="' + p.id + '"><div class="ct">' + ic('folder', 20) + '</div>' +
   '<h4>' + esc(p.name) + '</h4>' + (p.description ? '<div class="m">' + esc(p.description) + '</div>' : '<div class="m"></div>') +
   '<div class="ft"><span class="bg c-' + projStatusColor(p.status) + '">' + esc(p.status) + '</span>' +
   '<span class="sub">' + (p.done_count || 0) + '/' + (p.task_count || 0) + ' tarefas</span>' +
   (p.responsible_name ? '<span class="sub">' + esc(p.responsible_name) + '</span>' : '') + '</div></div>';
 }).join('') || '<div class="empty">Nenhum projeto ainda. Crie o primeiro.</div>';
 el.innerHTML = head('Projetos', 'Projetos internos da Acttus. Clique para abrir e gerenciar as tarefas.',
  '<button class="btn pri" id="newProj">' + ic('plus') + ' Novo projeto</button>') +
  '<div class="cards">' + cards + '</div>';
 $('#newProj', el).onclick = function () { openProjectModal(null); };
 $$('[data-proj]', el).forEach(function (c) { c.onclick = function () { openProjeto(c.getAttribute('data-proj')); }; });
}
function openProjeto(id) { projetoId = id; route = 'projeto'; renderNav(); renderView(); var sc = document.querySelector('.scroll'); if (sc) sc.scrollTop = 0; }
function renderProjeto(el) {
 var p = null; for (var i = 0; i < st.projects.length; i++) if (st.projects[i].id === projetoId) p = st.projects[i];
 if (!p) { go('projetos'); return; }
 var tasks = st.projectTasks.filter(function (t) { return t.project_id === p.id; });
 var cols = PT_STATUS.map(function (s) {
  var list = tasks.filter(function (t) { return t.status === s; });
  var color = s === 'Concluída' ? 'green' : s === 'Em andamento' ? 'blue' : 'gray';
  var cards = list.map(function (t) {
   return '<div class="kc" data-task="' + t.id + '"><div class="kc-t">' + esc(t.title) + '</div><div class="kc-f">' +
    (t.due_date ? '<span class="kc-dt">' + ic('clock', 13) + ' ' + fmtFull(t.due_date) + '</span>' : '<span></span>') +
    (t.responsible_name ? avatar(t.responsible_name, 22) : '') + '</div></div>';
  }).join('') || '<div class="kc-empty">—</div>';
  return '<div class="kcol"><div class="kcol-h">' + badge(s, color) + '<span class="kcnt">' + list.length + '</span></div><div class="kcol-b">' + cards + '</div></div>';
 }).join('');
 el.innerHTML = head(p.name, p.description || 'Projeto interno',
  '<button class="btn" data-back="1">' + ic('left') + ' Voltar</button>' +
  '<button class="btn" id="editProj">' + ic('edit', 15) + ' Editar</button>' +
  '<button class="btn pri" id="newTask">' + ic('plus') + ' Nova tarefa</button>') +
  '<div class="board board3">' + cols + '</div>';
 $('[data-back]', el).onclick = function () { go('projetos'); };
 $('#editProj', el).onclick = function () { openProjectModal(p); };
 $('#newTask', el).onclick = function () { openTaskModal(null, p.id); };
 $$('[data-task]', el).forEach(function (c) { c.onclick = function () { var id = c.getAttribute('data-task'), t = null; for (var i = 0; i < st.projectTasks.length; i++) if (st.projectTasks[i].id === id) t = st.projectTasks[i]; if (t) openTaskModal(t, p.id); }; });
}
function openProjectModal(proj) {
 var p = proj || {}, editing = !!proj;
 var userOpts = '<option value="">Sem responsável</option>' + st.users.map(function (u) { return '<option value="' + u.id + '"' + (u.id === (p.responsible_id || '') ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('');
 var statusOpts = ['Ativo', 'Pausado', 'Concluído'].map(function (s) { return '<option' + (s === (p.status || 'Ativo') ? ' selected' : '') + '>' + s + '</option>'; }).join('');
 openModal(editing ? 'Editar projeto' : 'Novo projeto', ic('folder'),
  '<label class="fld"><span>Nome</span><input id="pjName" value="' + esc(p.name || '') + '" placeholder="Ex.: Rebranding do site"></label>' +
  '<div class="mrow2"><label class="fld"><span>Responsável</span><select id="pjResp">' + userOpts + '</select></label>' +
  '<label class="fld"><span>Status</span><select id="pjStatus">' + statusOpts + '</select></label></div>' +
  '<label class="fld"><span>Descrição</span><textarea id="pjDesc" rows="3">' + esc(p.description || '') + '</textarea></label>',
  function () {
   var name = $('#pjName').value.trim(); if (!name) { toast('Informe o nome', 'err'); return false; }
   var payload = { name: name, responsible_id: $('#pjResp').value || null, status: $('#pjStatus').value, description: $('#pjDesc').value };
   var op = editing ? S.updateProject(proj.id, payload) : S.createProject(payload);
   op.then(function (np) { toast(editing ? 'Projeto salvo' : 'Projeto criado'); closeModal(); if (!editing && np) openProjeto(np.id); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, editing ? 'Salvar' : 'Criar projeto', editing ? '<button class="btn danger" id="pjDel">' + ic('trash', 15) + ' Excluir</button>' : '');
 if (editing) $('#pjDel').onclick = function () { if (!confirm('Excluir o projeto e todas as tarefas dele?')) return; S.deleteProject(proj.id).then(function () { toast('Projeto excluído'); closeModal(); go('projetos'); }).catch(function (e) { toast(e.message, 'err'); }); };
}
function openTaskModal(task, projectId) {
 var t = task || {}, editing = !!task;
 var userOpts = '<option value="">Sem responsável</option>' + st.users.map(function (u) { return '<option value="' + u.id + '"' + (u.id === (t.responsible_id || '') ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('');
 var statusOpts = PT_STATUS.map(function (s) { return '<option' + (s === (t.status || 'A fazer') ? ' selected' : '') + '>' + s + '</option>'; }).join('');
 openModal(editing ? 'Editar tarefa' : 'Nova tarefa', ic('check'),
  '<label class="fld"><span>Título</span><input id="tkTitle" value="' + esc(t.title || '') + '" placeholder="O que precisa ser feito"></label>' +
  '<div class="mrow2"><label class="fld"><span>Responsável</span><select id="tkResp">' + userOpts + '</select></label>' +
  '<label class="fld"><span>Prazo</span><input type="date" id="tkDue" value="' + esc(t.due_date || '') + '"></label></div>' +
  '<label class="fld"><span>Status</span><select id="tkStatus">' + statusOpts + '</select></label>' +
  '<label class="fld"><span>Notas</span><textarea id="tkNotes" rows="3">' + esc(t.notes || '') + '</textarea></label>',
  function () {
   var title = $('#tkTitle').value.trim(); if (!title) { toast('Informe o título', 'err'); return false; }
   var payload = { title: title, responsible_id: $('#tkResp').value || null, due_date: $('#tkDue').value || null, status: $('#tkStatus').value, notes: $('#tkNotes').value };
   if (!editing) payload.project_id = projectId;
   var op = editing ? S.updateProjectTask(task.id, payload) : S.createProjectTask(payload);
   op.then(function () { toast(editing ? 'Tarefa salva' : 'Tarefa criada'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, editing ? 'Salvar' : 'Criar tarefa', editing ? '<button class="btn danger" id="tkDel">' + ic('trash', 15) + ' Excluir</button>' : '');
 if (editing) $('#tkDel').onclick = function () { if (!confirm('Excluir esta tarefa?')) return; S.deleteProjectTask(task.id).then(function () { toast('Tarefa excluída'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); }); };
}

/* ===================================================================
   DASHBOARDS (somente admin)
   =================================================================== */
function dashBars(pairs, colorOf) {
 var max = 0; pairs.forEach(function (p) { if (p[1] > max) max = p[1]; }); max = max || 1;
 return pairs.map(function (p) { var c = colorOf ? colorOf(p[0]) : 'yellow'; return '<div class="hb"><span class="hbl">' + esc(p[0]) + '</span><span class="hbar"><i class="c-' + c + '" style="width:' + Math.round(p[1] / max * 100) + '%"></i></span><span class="hbv">' + p[1] + '</span></div>'; }).join('') || '<div class="empty">Sem dados.</div>';
}
function dashPanel(title, body) { return '<div class="panel"><div class="hd"><h3>' + esc(title) + '</h3></div><div class="bd">' + body + '</div></div>'; }
function renderDashboards(el) {
 if (!isAdmin()) { go('calendario'); return; }
 var posts = st.posts, today = todayISO();
 var byResp = {}; posts.forEach(function (p) { var k = p.responsible_name || 'Sem responsável'; byResp[k] = (byResp[k] || 0) + 1; });
 var d1 = dashBars(Object.keys(byResp).map(function (k) { return [k, byResp[k]]; }).sort(function (a, b) { return b[1] - a[1]; }));
 var d5 = dashBars(STATUS.map(function (s) { return [s, posts.filter(function (p) { return p.status === s; }).length]; }), function (s) { return STATUS_COLOR[s]; });
 var chanO = posts.filter(function (p) { return p.channel !== 'trafego'; }).length, chanT = posts.length - chanO;
 var d3 = dashBars([['Orgânico', chanO], ['Tráfego', chanT]], function () { return 'blue'; });
 var d4 = dashBars(TYPES.map(function (t) { return [t.label, posts.filter(function (p) { return p.post_type === t.key; }).length]; }), function () { return 'purple'; });
 var venc = posts.filter(isOverdue).length;
 var em2 = posts.filter(function (p) { return p.due_date && p.due_date >= today && diffDays(today, p.due_date) <= 2 && isOpen(p); }).length;
 var semana = posts.filter(function (p) { return p.due_date && p.due_date >= today && diffDays(today, p.due_date) <= 7 && isOpen(p); }).length;
 var totalP = posts.length, postados = posts.filter(function (p) { return p.status === 'Postado'; }).length;
 var pctPub = totalP ? Math.round(postados / totalP * 100) : 0;
 var d2 = st.clients.map(function (c) {
  var cp = posts.filter(function (p) { return p.client_id === c.id; }); if (!cp.length) return '';
  var pub = cp.filter(function (p) { return p.status === 'Postado'; }).length, ov = cp.filter(isOverdue).length;
  return '<tr><td class="cn"><span class="cdot c-' + (c.is_internal ? 'yellow' : 'pink') + '"></span>' + esc(c.name) + '</td><td>' + cp.length + '</td><td>' + pub + '</td><td>' + (ov ? '<span class="c-red">' + ov + '</span>' : '0') + '</td></tr>';
 }).join('') || '<tr><td colspan="4" class="empty">Sem dados.</td></tr>';
 var d9 = st.projects.map(function (p) { return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.status) + '</td><td>' + (p.done_count || 0) + '/' + (p.task_count || 0) + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="empty">Sem projetos.</td></tr>';

 el.innerHTML = head('Dashboards', 'Visão analítica da operação (acesso de admin).', '') +
  '<div class="dashgrid">' +
   dashPanel('Produção por responsável', d1) +
   dashPanel('Pipeline de status', d5) +
   dashPanel('Orgânico × Tráfego', d3) +
   dashPanel('Tipos de conteúdo', d4) +
   dashPanel('Pontualidade / Atrasos', '<div class="kpis">' + kpi('Vencidos', venc, 'a concluir, atrasados', venc ? 'red' : 'gray') + kpi('≤ 2 dias', em2, 'do prazo de conclusão', 'amber') + kpi('Nesta semana', semana, 'a concluir em 7 dias', 'blue') + '</div>') +
   dashPanel('Publicação', '<div class="kpis">' + kpi('Publicados', postados, 'status Postado', 'green') + kpi('Faltam', totalP - postados, 'ainda não postados', 'amber') + kpi('% publicado', pctPub + '%', 'do total', 'yellow') + '</div>') +
   dashPanel('Desempenho por cliente', '<table class="tbl"><thead><tr><th>Cliente</th><th>Posts</th><th>Postados</th><th>Vencidos</th></tr></thead><tbody>' + d2 + '</tbody></table>') +
   '<div class="panel"><div class="hd"><h3>Rotinas por usuário</h3></div><div class="bd" id="dashRoutines"><div class="empty">Carregando…</div></div></div>' +
   dashPanel('Projetos', '<table class="tbl"><thead><tr><th>Projeto</th><th>Status</th><th>Tarefas</th></tr></thead><tbody>' + d9 + '</tbody></table>') +
  '</div>';
 S.allRoutines().then(function (rs) {
  var elp = $('#dashRoutines'); if (!elp) return;
  var byU = {}; rs.forEach(function (r) { var k = r.owner_name || '—'; (byU[k] = byU[k] || { pend: 0, done: 0 })[r.done ? 'done' : 'pend']++; });
  var rows = Object.keys(byU).map(function (k) { return '<tr><td>' + esc(k) + '</td><td>' + byU[k].pend + '</td><td>' + byU[k].done + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="empty">Sem rotinas.</td></tr>';
  elp.innerHTML = '<table class="tbl"><thead><tr><th>Usuário</th><th>Pendentes</th><th>Concluídas</th></tr></thead><tbody>' + rows + '</tbody></table>';
 }).catch(function () { var elp = $('#dashRoutines'); if (elp) elp.innerHTML = '<div class="empty">Não foi possível carregar.</div>'; });
}

/* ===================================================================
   BANCO DE IDEIAS
   =================================================================== */
function ideaById(id) { for (var i = 0; i < st.ideas.length; i++) if (st.ideas[i].id === id) return st.ideas[i]; return null; }
function renderIdeias(el) {
 var sc = { nova: 'amber', usada: 'green', descartada: 'gray', aprovada: 'blue' };
 var rows = st.ideas.map(function (i) {
  return '<div class="idea"><div class="idea-top"><span class="cdot c-' + (i.is_internal ? 'yellow' : (i.client_id ? 'pink' : 'gray')) + '"></span><b>' + esc(i.client_name || 'Sem cliente') + '</b><span class="bg c-' + (sc[i.status] || 'gray') + '" style="margin-left:auto">' + esc(i.status) + '</span></div>' +
   '<div class="idea-t">' + esc(i.title) + '</div>' + (i.notes ? '<div class="idea-n">' + esc(i.notes) + '</div>' : '') +
   '<div class="idea-ft"><span class="sub">' + (i.source === 'painel' ? '💡 sugerida pelo cliente' : 'interna') + '</span><span class="sp"></span>' +
    '<button class="btn sm pri" data-ireuse="' + i.id + '">' + ic('plus', 13) + ' Usar no calendário</button>' +
    (i.status === 'descartada' ? '' : '<button class="btn sm" data-idiscard="' + i.id + '">Descartar</button>') +
    '<button class="iconbtn" data-idel="' + i.id + '" title="Excluir">' + ic('trash', 14) + '</button></div></div>';
 }).join('') || '<div class="empty">Nenhuma ideia ainda. As sugestões dos clientes (pelo painel) e as ideias internas aparecem aqui.</div>';
 el.innerHTML = head('Banco de ideias', 'Sugestões de todos os clientes, unificadas. Reaproveite qualquer ideia em qualquer calendário.',
  '<button class="btn pri" id="newIdea">' + ic('plus') + ' Nova ideia</button>') +
  '<div class="ideas">' + rows + '</div>';
 $('#newIdea', el).onclick = function () { openIdeaModal(); };
 $$('[data-ireuse]', el).forEach(function (b) { b.onclick = function () { var i = ideaById(b.getAttribute('data-ireuse')); if (i) reuseIdea(i); }; });
 $$('[data-idiscard]', el).forEach(function (b) { b.onclick = function () { S.updateIdea(b.getAttribute('data-idiscard'), { status: 'descartada' }).then(function () { toast('Ideia descartada'); }).catch(function (e) { toast(e.message, 'err'); }); }; });
 $$('[data-idel]', el).forEach(function (b) { b.onclick = function () { if (!confirm('Excluir esta ideia?')) return; S.deleteIdea(b.getAttribute('data-idel')).then(function () { toast('Ideia excluída'); }).catch(function (e) { toast(e.message, 'err'); }); }; });
}
function reuseIdea(i) { openPostModal(null, { client_id: i.client_id || '', title: i.title, notes: i.notes || '', ideaId: i.id }); }
function openIdeaModal() {
 var clientOpts = '<option value="">Sem cliente</option>' + st.clients.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');
 openModal('Nova ideia', ic('zap'),
  '<label class="fld"><span>Cliente (opcional)</span><select id="idCli">' + clientOpts + '</select></label>' +
  '<label class="fld"><span>Ideia</span><input id="idTitle" placeholder="Tema / título da ideia"></label>' +
  '<label class="fld"><span>Notas</span><textarea id="idNotes" rows="3" placeholder="Detalhes (opcional)"></textarea></label>',
  function () {
   var title = $('#idTitle').value.trim(); if (!title) { toast('Descreva a ideia', 'err'); return false; }
   S.createIdea({ client_id: $('#idCli').value || null, title: title, notes: $('#idNotes').value }).then(function () { toast('Ideia adicionada'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
   return false;
  }, 'Adicionar');
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
 var media = (p.media || []).slice();
 var cur = {
  client_id: p.client_id || d.client_id || (st.clients[0] && st.clients[0].id) || '',
  funnel_stage: p.funnel_stage || 'topo',
  post_type: p.post_type || 'estatico',
  channel: p.channel || 'organico',
  status: p.status || 'Agendado',
  pub_time: p.pub_time || '12:00'
 };
 var clientOpts = st.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cur.client_id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
 var userOpts = '<option value="">Sem responsável</option>' + st.users.map(function (u) { return '<option value="' + u.id + '"' + (u.id === (p.responsible_id || d.responsible_id || '') ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('');
 var statusOpts = STATUS.map(function (s) { return '<option value="' + esc(s) + '"' + (s === cur.status ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('');
 var timeOpts = TIMES.map(function (t) { return '<option value="' + t + '"' + (t === cur.pub_time ? ' selected' : '') + '>' + t + '</option>'; }).join('');

 var rejNote = (editing && p.reject_reason) ? '<div class="note rej">' + ic('alert', 15) + ' <span><b>Reprovado pelo cliente:</b> ' + esc(p.reject_reason) + '</span></div>' : '';
 var body = rejNote +
  '<label class="fld"><span>Título do post</span><input id="pTitle" value="' + esc(p.title || d.title || '') + '" placeholder="Ex.: 3 dúvidas sobre..."></label>' +
  '<div class="mrow2"><label class="fld"><span>Cliente</span><select id="pClient">' + (clientOpts || '<option value="">Crie um cliente antes</option>') + '</select></label>' +
  '<label class="fld"><span>Responsável</span><select id="pResp">' + userOpts + '</select></label></div>' +
  '<div class="fld"><span>Etapa do funil</span>' + seg('funnel_stage', FUNNEL.map(function (f) { return { key: f.key, label: f.short }; }), cur.funnel_stage) + '</div>' +
  '<div class="mrow2"><div class="fld"><span>Tipo</span>' + seg('post_type', TYPES, cur.post_type) + '</div>' +
  '<div class="fld"><span>Canal</span>' + seg('channel', CHANNELS, cur.channel) + '</div></div>' +
  '<div class="mrow2"><label class="fld"><span>Data de publicação</span><input type="date" id="pDate" value="' + esc(p.pub_date || d.pub_date || '') + '"></label>' +
  '<label class="fld"><span>Prazo de conclusão</span><input type="date" id="pDue" value="' + esc(p.due_date || '') + '"></label></div>' +
  '<div class="mrow2"><label class="fld"><span>Horário</span><select id="pTime">' + timeOpts + '</select></label>' +
  '<label class="fld"><span>Status</span><select id="pStatus">' + statusOpts + '</select></label></div>' +
  '<label class="fld"><span>Observações</span><textarea id="pNotes" rows="3" placeholder="Briefing, links, referências...">' + esc(p.notes || d.notes || '') + '</textarea></label>' +
  '<label class="fld"><span>Legenda da publicação</span><textarea id="pCaption" rows="3" placeholder="Texto que vai na legenda do post (o cliente vê no painel)">' + esc(p.caption || '') + '</textarea></label>' +
  '<div class="fld"><span>Anexos (imagem/vídeo — somem quando o post vira "Postado")</span><div class="att-list" id="attList"></div><label class="att-add">' + ic('plus', 14) + ' Adicionar arquivo<input type="file" id="attFile" accept="image/*,video/*" hidden></label></div>';

 var extra = editing ? '<button class="btn danger" id="pDel">' + ic('trash', 15) + ' Excluir</button>' : '';
 openModal(editing ? 'Editar post' : 'Novo post', ic('calendar'), body, function () {
  var payload = {
   title: $('#pTitle').value.trim(),
   client_id: $('#pClient').value || null,
   responsible_id: $('#pResp').value || null,
   funnel_stage: cur.funnel_stage, post_type: cur.post_type, channel: cur.channel,
   status: $('#pStatus').value, pub_date: $('#pDate').value || null, due_date: $('#pDue').value || null, pub_time: $('#pTime').value || null,
   notes: $('#pNotes').value, caption: $('#pCaption').value, media: media
  };
  if (!payload.title) { toast('Informe o título', 'err'); return false; }
  var op = editing ? S.updatePost(post.id, payload) : S.createPost(payload);
  op.then(function () { if (!editing && d.ideaId) { S.updateIdea(d.ideaId, { status: 'usada' }).catch(function () {}); } toast(editing ? 'Post atualizado' : 'Post criado'); closeModal(); }).catch(function (e) { toast(e.message, 'err'); });
  return false;
 }, editing ? 'Salvar' : 'Criar post', extra);

 // segmented controls
 $$('#mboxc .seg').forEach(function (sg) {
  var name = sg.getAttribute('data-seg');
  $$('button', sg).forEach(function (b) { b.onclick = function () { cur[name] = b.getAttribute('data-v'); $$('button', sg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }; });
 });
 // anexos (upload direto para o Vercel Blob)
 function renderAtt() {
  var box = $('#attList'); if (!box) return;
  box.innerHTML = media.length ? media.map(function (m, i) {
   var thumb = (m.type || '').indexOf('video') === 0 ? '<span class="att-thumb vid">' + ic('grid', 16) + '</span>' : '<span class="att-thumb" style="background-image:url(' + JSON.stringify(m.url) + ')"></span>';
   return '<div class="att">' + thumb + '<span class="att-n">' + esc(m.name || 'arquivo') + '</span><button type="button" class="iconbtn" data-attdel="' + i + '">' + ic('x', 14) + '</button></div>';
  }).join('') : '<div class="att-empty">Nenhum anexo.</div>';
  $$('[data-attdel]', box).forEach(function (b) { b.onclick = function () { media.splice(+b.getAttribute('data-attdel'), 1); renderAtt(); }; });
 }
 renderAtt();
 var fileInput = $('#attFile');
 if (fileInput) fileInput.onchange = function () {
  var f = this.files && this.files[0]; if (!f) return;
  this.value = '';
  toast('Enviando anexo…');
  uploadBlob(f).then(function (url) { media.push({ url: url, type: f.type, name: f.name }); renderAtt(); toast('Anexo adicionado'); }).catch(function (e) { toast('Falha no upload: ' + (e.message || e), 'err'); });
 };
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
