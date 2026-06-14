/* Acttus OS — camada de dados: cliente da API + store + polling.
   Exposto como window.Store / window.API. Carregado antes do app.js. */
(function () {
  'use strict';
  var TOKEN_KEY = 'acttus_token', USER_KEY = 'acttus_user';

  var state = {
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: null,
    clients: [], users: [], posts: [], notifications: [], meetings: [], routines: [], projects: [], projectTasks: [],
    serverNow: null, sig: '', loaded: false
  };
  try { state.user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) {}

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

  async function login(cpf, email) {
    var r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf: cpf, email: email }) });
    var data = null; try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((data && data.error) || 'Falha no login');
    state.token = data.token; state.user = data.user;
    localStorage.setItem(TOKEN_KEY, state.token);
    localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    return data.user;
  }
  function doLogout() {
    state.token = null; state.user = null; state.loaded = false;
    state.clients = []; state.users = []; state.posts = []; state.notifications = [];
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
      req('GET', '/api/project-tasks')
    ]);
    state.clients = r[0] || [];
    state.users = r[1] || [];
    state.posts = (r[2] && r[2].posts) || [];
    state.serverNow = r[2] && r[2].now;
    state.notifications = r[3] || [];
    state.meetings = r[4] || [];
    state.routines = r[5] || [];
    state.projects = r[6] || [];
    state.projectTasks = r[7] || [];
    state.sig = sigOf(state.posts);
    state.loaded = true;
    emit();
  }

  async function refreshPosts() {
    var r = await req('GET', '/api/posts');
    var posts = (r && r.posts) || [];
    var sig = sigOf(posts);
    var changed = sig !== state.sig;
    state.posts = posts; state.serverNow = r && r.now; state.sig = sig;
    if (changed) emit();
    return changed;
  }
  async function refreshNotifs() {
    state.notifications = await req('GET', '/api/notifications'); emit();
  }

  function upsertPost(p) {
    var i = -1; for (var k = 0; k < state.posts.length; k++) if (state.posts[k].id === p.id) { i = k; break; }
    if (i >= 0) state.posts[i] = p; else state.posts.push(p);
    state.sig = sigOf(state.posts);
  }
  function createPost(b) { return req('POST', '/api/posts', b).then(function (p) { upsertPost(p); emit(); return p; }); }
  function updatePost(id, b) { return req('PATCH', '/api/posts?id=' + encodeURIComponent(id), b).then(function (p) { upsertPost(p); emit(); return p; }); }
  function deletePost(id) { return req('DELETE', '/api/posts?id=' + encodeURIComponent(id)).then(function () { state.posts = state.posts.filter(function (p) { return p.id !== id; }); state.sig = sigOf(state.posts); emit(); }); }

  function sortClients(a, b) { if (a.is_internal !== b.is_internal) return a.is_internal ? -1 : 1; return a.name.localeCompare(b.name); }
  function createClient(b) { return req('POST', '/api/clients', b).then(function (c) { state.clients.push(c); state.clients.sort(sortClients); emit(); return c; }); }
  function createUser(b) { return req('POST', '/api/users', b).then(function (u) { state.users.push(u); state.users.sort(function (a, b) { return a.name.localeCompare(b.name); }); emit(); return u; }); }
  function updateUser(id, b) { return req('PATCH', '/api/users?id=' + encodeURIComponent(id), b).then(function (u) { var i = -1; for (var k = 0; k < state.users.length; k++) if (state.users[k].id === id) { i = k; break; } if (i >= 0) state.users[i] = u; state.users.sort(function (a, b) { return a.name.localeCompare(b.name); }); if (state.user && state.user.id === id) { state.user = { id: u.id, name: u.name, email: u.email, role: u.role || state.user.role }; localStorage.setItem(USER_KEY, JSON.stringify(state.user)); } emit(); return u; }); }
  function markNotifsRead() { return req('PATCH', '/api/notifications').then(function () { var now = new Date().toISOString(); state.notifications.forEach(function (n) { if (!n.read_at) n.read_at = now; }); emit(); }); }
  function upsert(arr, item) { var i = -1; for (var k = 0; k < arr.length; k++) if (arr[k].id === item.id) { i = k; break; } if (i >= 0) arr[i] = item; else arr.unshift(item); }
  function createRoutine(b) { return req('POST', '/api/routines', b).then(function (x) { state.routines.unshift(x); emit(); return x; }); }
  function updateRoutine(id, b) { return req('PATCH', '/api/routines?id=' + encodeURIComponent(id), b).then(function (x) { upsert(state.routines, x); emit(); return x; }); }
  function deleteRoutine(id) { return req('DELETE', '/api/routines?id=' + encodeURIComponent(id)).then(function () { state.routines = state.routines.filter(function (x) { return x.id !== id; }); emit(); }); }
  function createProject(b) { return req('POST', '/api/projects', b).then(function (x) { state.projects.unshift(x); emit(); return x; }); }
  function updateProject(id, b) { return req('PATCH', '/api/projects?id=' + encodeURIComponent(id), b).then(function (x) { upsert(state.projects, x); emit(); return x; }); }
  function deleteProject(id) { return req('DELETE', '/api/projects?id=' + encodeURIComponent(id)).then(function () { state.projects = state.projects.filter(function (x) { return x.id !== id; }); state.projectTasks = state.projectTasks.filter(function (t) { return t.project_id !== id; }); emit(); }); }
  function createProjectTask(b) { return req('POST', '/api/project-tasks', b).then(function (x) { state.projectTasks.unshift(x); emit(); return x; }); }
  function updateProjectTask(id, b) { return req('PATCH', '/api/project-tasks?id=' + encodeURIComponent(id), b).then(function (x) { upsert(state.projectTasks, x); emit(); return x; }); }
  function deleteProjectTask(id) { return req('DELETE', '/api/project-tasks?id=' + encodeURIComponent(id)).then(function () { state.projectTasks = state.projectTasks.filter(function (x) { return x.id !== id; }); emit(); }); }
  function allRoutines() { return req('GET', '/api/routines?scope=all'); }
  function createMeeting(b) { return req('POST', '/api/meetings', b).then(function (m) { state.meetings.unshift(m); emit(); return m; }); }
  function updateMeeting(id, b) { return req('PATCH', '/api/meetings?id=' + encodeURIComponent(id), b).then(function (m) { var i = -1; for (var k = 0; k < state.meetings.length; k++) if (state.meetings[k].id === id) { i = k; break; } if (i >= 0) state.meetings[i] = m; else state.meetings.unshift(m); emit(); return m; }); }
  function deleteMeeting(id) { return req('DELETE', '/api/meetings?id=' + encodeURIComponent(id)).then(function () { state.meetings = state.meetings.filter(function (m) { return m.id !== id; }); emit(); }); }

  var pollTimer = null;
  function startPolling() {
    stopPolling();
    pollTimer = setInterval(function () { if (!document.hidden && state.token) refreshPosts().catch(function () {}); }, 8000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && state.token) refreshPosts().catch(function () {}); });
  }
  function stopPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

  window.Store = {
    state: state, subscribe: subscribe, emit: emit,
    login: login, logout: function () { doLogout(); emit(); },
    loadAll: loadAll, refreshPosts: refreshPosts, refreshNotifs: refreshNotifs,
    createPost: createPost, updatePost: updatePost, deletePost: deletePost,
    createClient: createClient, createUser: createUser, updateUser: updateUser, markNotifsRead: markNotifsRead,
    createMeeting: createMeeting, updateMeeting: updateMeeting, deleteMeeting: deleteMeeting,
    createRoutine: createRoutine, updateRoutine: updateRoutine, deleteRoutine: deleteRoutine,
    createProject: createProject, updateProject: updateProject, deleteProject: deleteProject,
    createProjectTask: createProjectTask, updateProjectTask: updateProjectTask, deleteProjectTask: deleteProjectTask,
    allRoutines: allRoutines,
    startPolling: startPolling, stopPolling: stopPolling,
    isAuthed: function () { return !!state.token; }
  };
})();
