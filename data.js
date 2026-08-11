/* Acttus OS — camada de dados: cliente da API + store + polling.
   Exposto como window.Store / window.API. Carregado antes do app.js.

   SETORES: a agência opera em marketing e tráfego. O servidor devolve tudo o
   que o usuário pode ver (todos os setores dele); aqui guardamos essa lista
   crua em state.all.* e expomos em state.posts/ideas/... só o SETOR ATIVO.
   Trocar de setor é instantâneo — não refaz requisição. Clientes e usuários
   são compartilhados entre os setores e por isso não passam por esse filtro. */
(function () {
  'use strict';
  var TOKEN_KEY = 'acttus_token', USER_KEY = 'acttus_user', SECTOR_KEY = 'acttus_sector';

  // Espelho do lib/sectors.js (servidor). Criar um setor novo = uma linha aqui
  // e uma linha lá.
  var SECTORS = [
    { key: 'marketing', label: 'Marketing', desc: 'Calendário editorial, gravações e ideias' },
    { key: 'trafego', label: 'Tráfego', desc: 'Campanhas de mídia paga' }
  ];
  var SECTOR_KEYS = SECTORS.map(function (s) { return s.key; });

  var state = {
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: null,
    sector: localStorage.getItem(SECTOR_KEY) || 'marketing',
    // listas cruas (todos os setores do usuário)
    all: { posts: [], ideas: [], projects: [], projectTasks: [], meetings: [], campaigns: [] },
    // visão do setor ativo (é o que o app.js lê)
    clients: [], users: [], posts: [], notifications: [], meetings: [], routines: [], projects: [], projectTasks: [], ideas: [], campaigns: [], apiKeys: [],
    serverNow: null, sig: '', loaded: false
  };
  try { state.user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) {}

  // Setores que o usuário atual pode acessar (admin transita em todos).
  function mySectors() {
    var u = state.user;
    if (!u) return ['marketing'];
    if (u.role === 'admin') return SECTOR_KEYS.slice();
    var arr = (u.sectors || []).filter(function (s) { return SECTOR_KEYS.indexOf(s) >= 0; });
    return arr.length ? arr : ['marketing'];
  }
  function normalizeSector() {
    var ok = mySectors();
    if (ok.indexOf(state.sector) < 0) state.sector = ok[0];
    localStorage.setItem(SECTOR_KEY, state.sector);
  }
  function bySector(list) {
    var s = state.sector;
    return (list || []).filter(function (x) { return (x.sector || 'marketing') === s; });
  }
  // Recalcula as listas visíveis a partir das cruas. Chamar depois de qualquer
  // mudança em state.all.* ou no setor ativo.
  function applySector() {
    normalizeSector();
    state.posts = bySector(state.all.posts);
    state.ideas = bySector(state.all.ideas);
    state.meetings = bySector(state.all.meetings);
    state.projects = bySector(state.all.projects);
    state.campaigns = bySector(state.all.campaigns);
    // Tarefa não tem setor: segue o projeto a que pertence.
    var ids = {};
    state.projects.forEach(function (p) { ids[p.id] = 1; });
    state.projectTasks = state.all.projectTasks.filter(function (t) { return ids[t.project_id]; });
  }
  function setSector(key) {
    if (mySectors().indexOf(key) < 0) return false;
    state.sector = key;
    localStorage.setItem(SECTOR_KEY, key);
    applySector();
    emit();
    return true;
  }

  var listeners = [];
  function subscribe(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); }

  function headers() {
    var h = { 'Content-Type': 'application/json' };
    if (state.token) h['Authorization'] = 'Bearer ' + state.token;
    return h;
  }
  async function req(method, url, body) {
    var opt = { method: method, headers: headers() };
    if (body != null) opt.body = JSON.stringify(body);
    var r = await fetch(url, opt);
    var data = null; try { data = await r.json(); } catch (e) {}
    if (r.status === 401) { doLogout(); emit(); throw new Error((data && data.error) || 'Sessão expirada'); }
    if (!r.ok) throw new Error((data && data.error) || ('Erro ' + r.status));
    return data;
  }
  // Toda criação nasce no setor ativo, a não ser que a tela diga outro.
  function withSector(b) {
    var o = b || {};
    if (!o.sector) o.sector = state.sector;
    return o;
  }

  async function login(cpf, email) {
    var r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf: cpf, email: email }) });
    var data = null; try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((data && data.error) || 'Falha no login');
    state.token = data.token; state.user = data.user;
    localStorage.setItem(TOKEN_KEY, state.token);
    localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    normalizeSector();
    return data.user;
  }
  function doLogout() {
    state.token = null; state.user = null; state.loaded = false;
    state.all = { posts: [], ideas: [], projects: [], projectTasks: [], meetings: [], campaigns: [] };
    state.clients = []; state.users = []; state.posts = []; state.notifications = [];
    state.meetings = []; state.routines = []; state.projects = []; state.projectTasks = []; state.ideas = []; state.campaigns = [];
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
  }

  function sigOf(posts) {
    var m = ''; for (var i = 0; i < posts.length; i++) if (posts[i].updated_at > m) m = posts[i].updated_at;
    return m + '|' + posts.length;
  }

  async function loadAll() {
    var r = await Promise.all([
      req('GET', '/api/clients'),
      req('GET', '/api/users'),
      req('GET', '/api/posts'),
      req('GET', '/api/notifications'),
      req('GET', '/api/meetings'),
      req('GET', '/api/routines'),
      req('GET', '/api/projects'),
      req('GET', '/api/projects?entity=task'),
      req('GET', '/api/ideas'),
      req('GET', '/api/projects?entity=campaign')
    ]);
    state.clients = r[0] || [];
    state.users = r[1] || [];
    state.all.posts = (r[2] && r[2].posts) || [];
    state.serverNow = r[2] && r[2].now;
    state.notifications = r[3] || [];
    state.all.meetings = r[4] || [];
    state.routines = r[5] || [];
    state.all.projects = r[6] || [];
    state.all.projectTasks = r[7] || [];
    state.all.ideas = r[8] || [];
    state.all.campaigns = r[9] || [];
    // O login antigo (antes dos setores) não guardou "sectors" no localStorage;
    // a lista de usuários traz o dado atualizado.
    if (state.user) {
      for (var i = 0; i < state.users.length; i++) {
        if (state.users[i].id === state.user.id) {
          state.user.sectors = state.users[i].sectors || [];
          state.user.role = state.users[i].role || state.user.role;
          localStorage.setItem(USER_KEY, JSON.stringify(state.user));
          break;
        }
      }
    }
    state.sig = sigOf(state.all.posts);
    state.loaded = true;
    applySector();
    emit();
  }

  async function refreshPosts() {
    var r = await req('GET', '/api/posts');
    var posts = (r && r.posts) || [];
    var sig = sigOf(posts);
    var changed = sig !== state.sig;
    state.all.posts = posts; state.serverNow = r && r.now; state.sig = sig;
    applySector();
    if (changed) emit();
    return changed;
  }
  async function refreshNotifs() {
    state.notifications = await req('GET', '/api/notifications'); emit();
  }

  function upsertPost(p) {
    var arr = state.all.posts, i = -1;
    for (var k = 0; k < arr.length; k++) if (arr[k].id === p.id) { i = k; break; }
    if (i >= 0) arr[i] = p; else arr.push(p);
    state.sig = sigOf(arr);
    applySector();
  }
  function createPost(b) { return req('POST', '/api/posts', withSector(b)).then(function (p) { upsertPost(p); emit(); return p; }); }
  function updatePost(id, b) { return req('PATCH', '/api/posts?id=' + encodeURIComponent(id), b).then(function (p) { upsertPost(p); emit(); return p; }); }
  function deletePost(id) { return req('DELETE', '/api/posts?id=' + encodeURIComponent(id)).then(function () { state.all.posts = state.all.posts.filter(function (p) { return p.id !== id; }); state.sig = sigOf(state.all.posts); applySector(); emit(); }); }

  function sortClients(a, b) { if (a.is_internal !== b.is_internal) return a.is_internal ? -1 : 1; return a.name.localeCompare(b.name); }
  function createClient(b) { return req('POST', '/api/clients', b).then(function (c) { state.clients.push(c); state.clients.sort(sortClients); emit(); return c; }); }
  function updateClient(id, b) { return req('PATCH', '/api/clients?id=' + encodeURIComponent(id), b).then(function (c) { var i = -1; for (var k = 0; k < state.clients.length; k++) if (state.clients[k].id === id) { i = k; break; } if (i >= 0) state.clients[i] = c; state.clients.sort(sortClients); emit(); return c; }); }
  function togglePlan(clientId, ym) { return req('POST', '/api/clients?entity=plan', { id: clientId, ym: ym }).then(function (c) { var i = -1; for (var k = 0; k < state.clients.length; k++) if (state.clients[k].id === clientId) { i = k; break; } if (i >= 0) state.clients[i] = c; emit(); return c; }); }

  // upsert genérico numa lista crua + reaplicação do filtro de setor
  function upsert(arr, item) { var i = -1; for (var k = 0; k < arr.length; k++) if (arr[k].id === item.id) { i = k; break; } if (i >= 0) arr[i] = item; else arr.unshift(item); }
  function put(listName, item) { upsert(state.all[listName], item); applySector(); emit(); return item; }
  function drop(listName, id) { state.all[listName] = state.all[listName].filter(function (x) { return x.id !== id; }); applySector(); emit(); }

  function createIdea(b) { return req('POST', '/api/ideas', withSector(b)).then(function (x) { return put('ideas', x); }); }
  function updateIdea(id, b) { return req('PATCH', '/api/ideas?id=' + encodeURIComponent(id), b).then(function (x) { return put('ideas', x); }); }
  function deleteIdea(id) { return req('DELETE', '/api/ideas?id=' + encodeURIComponent(id)).then(function () { drop('ideas', id); }); }

  function createUser(b) { return req('POST', '/api/users', b).then(function (u) { state.users.push(u); state.users.sort(function (a, b) { return a.name.localeCompare(b.name); }); emit(); return u; }); }
  function updateUser(id, b) { return req('PATCH', '/api/users?id=' + encodeURIComponent(id), b).then(function (u) { var i = -1; for (var k = 0; k < state.users.length; k++) if (state.users[k].id === id) { i = k; break; } if (i >= 0) state.users[i] = u; state.users.sort(function (a, b) { return a.name.localeCompare(b.name); }); if (state.user && state.user.id === id) { state.user = { id: u.id, name: u.name, email: u.email, role: u.role || state.user.role, sectors: u.sectors || state.user.sectors || [] }; localStorage.setItem(USER_KEY, JSON.stringify(state.user)); applySector(); } emit(); return u; }); }
  function deleteUser(id) { return req('DELETE', '/api/users?id=' + encodeURIComponent(id)).then(function () { state.users = state.users.filter(function (u) { return u.id !== id; }); emit(); }); }
  function markNotifsRead() { return req('PATCH', '/api/notifications').then(function () { var now = new Date().toISOString(); state.notifications.forEach(function (n) { if (!n.read_at) n.read_at = now; }); emit(); }); }

  // Rotinas são pessoais (do usuário, não do setor) — sem filtro.
  function createRoutine(b) { return req('POST', '/api/routines', b).then(function (x) { state.routines.unshift(x); emit(); return x; }); }
  function updateRoutine(id, b) { return req('PATCH', '/api/routines?id=' + encodeURIComponent(id), b).then(function (x) { upsert(state.routines, x); emit(); return x; }); }
  function deleteRoutine(id) { return req('DELETE', '/api/routines?id=' + encodeURIComponent(id)).then(function () { state.routines = state.routines.filter(function (x) { return x.id !== id; }); emit(); }); }

  function createProject(b) { return req('POST', '/api/projects', withSector(b)).then(function (x) { return put('projects', x); }); }
  function updateProject(id, b) { return req('PATCH', '/api/projects?id=' + encodeURIComponent(id), b).then(function (x) { return put('projects', x); }); }
  function deleteProject(id) { return req('DELETE', '/api/projects?id=' + encodeURIComponent(id)).then(function () { state.all.projectTasks = state.all.projectTasks.filter(function (t) { return t.project_id !== id; }); drop('projects', id); }); }
  function createProjectTask(b) { return req('POST', '/api/projects?entity=task', b).then(function (x) { return put('projectTasks', x); }); }
  function updateProjectTask(id, b) { return req('PATCH', '/api/projects?entity=task&id=' + encodeURIComponent(id), b).then(function (x) { return put('projectTasks', x); }); }
  function deleteProjectTask(id) { return req('DELETE', '/api/projects?entity=task&id=' + encodeURIComponent(id)).then(function () { drop('projectTasks', id); }); }

  function createCampaign(b) { return req('POST', '/api/projects?entity=campaign', withSector(b)).then(function (x) { return put('campaigns', x); }); }
  function updateCampaign(id, b) { return req('PATCH', '/api/projects?entity=campaign&id=' + encodeURIComponent(id), b).then(function (x) { return put('campaigns', x); }); }
  function deleteCampaign(id) { return req('DELETE', '/api/projects?entity=campaign&id=' + encodeURIComponent(id)).then(function () { drop('campaigns', id); }); }

  function allRoutines() { return req('GET', '/api/routines?scope=all'); }
  function createMeeting(b) { return req('POST', '/api/meetings', withSector(b)).then(function (m) { return put('meetings', m); }); }
  function updateMeeting(id, b) { return req('PATCH', '/api/meetings?id=' + encodeURIComponent(id), b).then(function (m) { return put('meetings', m); }); }
  function deleteMeeting(id) { return req('DELETE', '/api/meetings?id=' + encodeURIComponent(id)).then(function () { drop('meetings', id); }); }

  // Chaves de API (só admin; carregadas sob demanda — não entram no loadAll p/ não quebrar não-admins)
  async function loadApiKeys() { var r = await req('GET', '/api/apikeys'); state.apiKeys = (r && r.keys) || []; emit(); return state.apiKeys; }
  function createApiKey(b) { return req('POST', '/api/apikeys', b).then(function (k) { return loadApiKeys().then(function () { return k; }); }); }
  function revokeApiKey(id) { return req('DELETE', '/api/apikeys?id=' + encodeURIComponent(id)).then(function () { return loadApiKeys(); }); }

  var pollTimer = null;
  function startPolling() {
    stopPolling();
    pollTimer = setInterval(function () { if (!document.hidden && state.token) refreshPosts().catch(function () {}); }, 8000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && state.token) refreshPosts().catch(function () {}); });
  }
  function stopPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

  window.Store = {
    state: state, subscribe: subscribe, emit: emit,
    SECTORS: SECTORS, mySectors: mySectors, setSector: setSector,
    login: login, logout: function () { doLogout(); emit(); },
    loadAll: loadAll, refreshPosts: refreshPosts, refreshNotifs: refreshNotifs,
    createPost: createPost, updatePost: updatePost, deletePost: deletePost,
    createClient: createClient, updateClient: updateClient, togglePlan: togglePlan, createUser: createUser, updateUser: updateUser, deleteUser: deleteUser, markNotifsRead: markNotifsRead,
    createIdea: createIdea, updateIdea: updateIdea, deleteIdea: deleteIdea,
    createMeeting: createMeeting, updateMeeting: updateMeeting, deleteMeeting: deleteMeeting,
    createRoutine: createRoutine, updateRoutine: updateRoutine, deleteRoutine: deleteRoutine,
    createProject: createProject, updateProject: updateProject, deleteProject: deleteProject,
    createProjectTask: createProjectTask, updateProjectTask: updateProjectTask, deleteProjectTask: deleteProjectTask,
    createCampaign: createCampaign, updateCampaign: updateCampaign, deleteCampaign: deleteCampaign,
    allRoutines: allRoutines,
    loadApiKeys: loadApiKeys, createApiKey: createApiKey, revokeApiKey: revokeApiKey,
    startPolling: startPolling, stopPolling: stopPolling,
    isAuthed: function () { return !!state.token; }
  };
})();
