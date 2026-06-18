/* Painel público do cliente — visualização Kanban + Calendário, aprovar/reprovar e sugerir ideia. Standalone. */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  var MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MONFULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  function fmtDay(iso) { if (!iso) return ''; var p = iso.split('-'); return p[2] + ' ' + MON[+p[1] - 1]; }
  var STATUS = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação', 'Finalizado', 'Postado'];
  var STATUS_COLOR = { 'Agendado': 'gray', 'Em produção': 'blue', 'Aguardando aprovação': 'amber', 'Modificação': 'red', 'Finalizado': 'purple', 'Postado': 'green' };
  var FUNNEL = { topo: { short: 'Topo', color: 'blue' }, meio: { short: 'Meio', color: 'amber' }, fundo: { short: 'Fundo', color: 'green' } };
  var TYPE = { carrossel: 'Carrossel', reels: 'Reels', estatico: 'Estático' };
  function badge(t, c) { return '<span class="bg c-' + (c || 'gray') + '"><span class="bgdot"></span>' + esc(t) + '</span>'; }
  function mediaHTML(p) {
    var m = (p.media || []);
    var thumbs = m.map(function (a) {
      if ((a.type || '').indexOf('video') === 0) return '<video class="pp-media" src="' + esc(a.url) + '" controls preload="metadata"></video>';
      return '<img class="pp-media" src="' + esc(a.url) + '" alt="" loading="lazy">';
    }).join('');
    return (thumbs ? '<div class="pp-medias">' + thumbs + '</div>' : '') + (p.caption ? '<div class="pp-cap">' + esc(p.caption) + '</div>' : '');
  }
  var _t; function toast(t, k) { var e = $('#toast'); e.className = 'toast show' + (k ? ' ' + k : ''); e.textContent = t; clearTimeout(_t); _t = setTimeout(function () { e.className = 'toast'; }, 3200); }

  var token = new URLSearchParams(location.search).get('t');
  var data = null, calY = null, calM = null;

  function clr() { return data && data.client && data.client.is_internal ? 'yellow' : 'pink'; }
  function postById(id) { return (data.posts || []).filter(function (p) { return p.id === id; })[0]; }

  function cardHTML(p) {
    var f = FUNNEL[p.funnel_stage] || { short: p.funnel_stage, color: 'gray' };
    var pend = p.status === 'Aguardando aprovação';
    return '<div class="kc' + (pend ? ' kc-pend' : '') + '" data-post="' + p.id + '"><div class="kc-t">' + esc(p.title) + '</div>' +
      '<div class="kc-tags"><span class="ptag c-' + f.color + '">' + f.short + '</span><span class="ptag">' + (TYPE[p.post_type] || p.post_type) + '</span></div>' +
      '<div class="kc-f">' + (p.pub_date ? '<span class="kc-dt">' + fmtDay(p.pub_date) + (p.pub_time ? ' ' + p.pub_time : '') + '</span>' : '<span></span>') + (pend ? '<span class="ptag c-amber">revisar</span>' : '') + '</div></div>';
  }
  function kanbanHTML(posts) {
    return '<div class="board">' + STATUS.map(function (s) {
      var list = posts.filter(function (p) { return p.status === s; });
      var cards = list.map(cardHTML).join('') || '<div class="kc-empty">—</div>';
      return '<div class="kcol"><div class="kcol-h">' + badge(s, STATUS_COLOR[s]) + '<span class="kcnt">' + list.length + '</span></div><div class="kcol-b">' + cards + '</div></div>';
    }).join('') + '</div>';
  }
  function calHTML(posts) {
    if (calY == null) { var t = String(data.now || '').slice(0, 10).split('-'); var d = new Date(); calY = t[0] ? +t[0] : d.getFullYear(); calM = t[1] ? +t[1] - 1 : d.getMonth(); }
    var first = new Date(Date.UTC(calY, calM, 1)), startW = first.getUTCDay(), days = new Date(Date.UTC(calY, calM + 1, 0)).getUTCDate();
    var byDay = {};
    posts.filter(function (p) { return p.pub_date; }).forEach(function (p) { var d = p.pub_date.split('-'); if (+d[0] === calY && +d[1] - 1 === calM) { var k = +d[2]; (byDay[k] = byDay[k] || []).push(p); } });
    Object.keys(byDay).forEach(function (k) { byDay[k].sort(function (a, b) { return (a.pub_time || '') < (b.pub_time || '') ? -1 : 1; }); });
    var cells = '';
    for (var i = 0; i < startW; i++) cells += '<div class="cal-cell out"></div>';
    for (var dd = 1; dd <= days; dd++) {
      var list = byDay[dd] || [];
      var evs = list.map(function (p) {
        return '<div class="cal-ev c-' + clr() + '" data-post="' + p.id + '" title="' + esc(p.title + ' — ' + p.status) + '"><div class="ce-t">' + (p.pub_time ? '<b>' + p.pub_time + '</b> ' : '') + esc(p.title) + '</div><div class="ce-m">' + (TYPE[p.post_type] || p.post_type) + ' · ' + esc(p.status) + '</div></div>';
      }).join('');
      cells += '<div class="cal-cell"><div class="cal-h"><span class="cal-d">' + dd + '</span></div><div class="cal-evs">' + evs + '</div></div>';
    }
    return '<div class="cal-bar"><button class="btn icon" id="calPrev" type="button">‹</button><div class="cal-title">' + MONFULL[calM] + ' ' + calY + '</div><button class="btn icon" id="calNext" type="button">›</button>' +
      '<span class="cal-legend"><span class="cdot c-' + clr() + '"></span>' + esc(data.client.name) + '</span></div>' +
      '<div class="cal-grid head">' + WD.map(function (w) { return '<div class="cal-wd">' + w + '</div>'; }).join('') + '</div>' +
      '<div class="cal-grid">' + cells + '</div>';
  }

  function render() {
    var pub = $('#pub');
    if (!token) { pub.innerHTML = '<div class="puberr">Link inválido. Peça um novo link à equipe Acttus.</div>'; return; }
    if (!data) { pub.innerHTML = '<div class="publoading">Carregando…</div>'; return; }
    var c = data.client, posts = data.posts || [];
    var cover = c.cover_url ? ' style="background-image:url(' + JSON.stringify(c.cover_url) + ')"' : '';
    var av = c.avatar_url ? '<span class="pub-av" style="background-image:url(' + JSON.stringify(c.avatar_url) + ')"></span>' : '<span class="pub-av ph">' + esc((c.name || '?').charAt(0).toUpperCase()) + '</span>';
    pub.innerHTML =
      '<div class="pub-cover"' + cover + '><div class="pub-cover-sh"></div></div>' +
      '<div class="pub-wrap">' +
        '<div class="pub-head">' + av + '<div class="pub-h-tx"><h1>' + esc(c.name) + '</h1><div class="pub-sub">Calendário & demandas · Acttus</div></div></div>' +
        '<div class="pub-section"><h2>Kanban</h2>' + kanbanHTML(posts) + '</div>' +
        '<div class="pub-section"><h2>Calendário</h2>' + calHTML(posts) + '</div>' +
        '<div class="pub-suggest"><div><b>Tem uma ideia de post?</b><div class="pub-sub">Sugira que a equipe avalia e coloca no calendário.</div></div><button class="btn pri" id="suggest" type="button">💡 Sugerir ideia</button></div>' +
        '<div class="pub-foot">Painel de visualização — mantido em tempo real pela equipe Acttus.</div>' +
      '</div>';
    $('#suggest').onclick = openSuggest;
    var prev = $('#calPrev'); if (prev) prev.onclick = function () { calM--; if (calM < 0) { calM = 11; calY--; } render(); };
    var next = $('#calNext'); if (next) next.onclick = function () { calM++; if (calM > 11) { calM = 0; calY++; } render(); };
    $$('[data-post]').forEach(function (el2) { el2.onclick = function () { var p = postById(el2.getAttribute('data-post')); if (p) openDetail(p); }; });
  }

  function closeModal() { $('#modal').classList.remove('show'); $('#mboxc').innerHTML = ''; }
  function openZoom(src) {
    var lb = document.getElementById('lightbox');
    if (!lb) { lb = document.createElement('div'); lb.id = 'lightbox'; lb.className = 'lightbox'; lb.onclick = function () { lb.classList.remove('show'); lb.innerHTML = ''; }; document.body.appendChild(lb); }
    lb.innerHTML = '<img src="' + esc(src) + '" alt=""><button class="lb-x" type="button" aria-label="Fechar">✕</button>';
    lb.classList.add('show');
  }
  function openDetail(post) {
    var pend = post.status === 'Aguardando aprovação';
    $('#mboxc').innerHTML =
      '<div class="mhd"><span class="mic">' + (pend ? '👀' : '📄') + '</span><h3>' + (pend ? 'Revisar publicação' : 'Publicação') + '</h3><button class="mx" id="mx" type="button">✕</button></div>' +
      '<div class="mbd"><div class="rev-title">' + esc(post.title) + '</div><div class="rev-meta">' + badge(post.status, STATUS_COLOR[post.status]) + ' &nbsp; ' + (post.pub_date ? fmtDay(post.pub_date) : 'sem data') + (post.pub_time ? ' · ' + post.pub_time : '') + ' · ' + (TYPE[post.post_type] || post.post_type) + '</div>' + mediaHTML(post) +
        (pend ? '<div id="rejWrap" style="display:none;margin-top:14px"><label class="fld"><span>Motivo da reprovação</span><textarea id="rejReason" rows="4" placeholder="Explique o que precisa mudar…"></textarea></label></div>' : '') + '</div>' +
      (pend
        ? '<div class="mft"><button type="button" class="btn danger" id="btnReject">❌ Reprovar</button><div class="mft-r"><button type="button" class="btn" id="btnCancel">Fechar</button><button type="button" class="btn pri" id="btnApprove">✅ Aprovar</button></div></div>'
        : '<div class="mft"><span></span><div class="mft-r"><button type="button" class="btn" id="btnCancel">Fechar</button></div></div>');
    $('#modal').classList.add('show');
    $('#mx').onclick = closeModal; $('#btnCancel').onclick = closeModal; $('#modalBg').onclick = closeModal;
    $$('#mboxc img.pp-media').forEach(function (img) { img.classList.add('zoomable'); img.onclick = function () { openZoom(img.src); }; });
    if (pend) {
      $('#btnApprove').onclick = function () { act('approve', post.id); };
      $('#btnReject').onclick = function () {
        var w = $('#rejWrap');
        if (w.style.display === 'none') { w.style.display = 'block'; $('#rejReason').focus(); this.textContent = 'Confirmar reprovação'; }
        else { var reason = ($('#rejReason').value || '').trim(); if (!reason) { toast('Escreva o motivo', 'err'); return; } act('reject', post.id, reason); }
      };
    }
  }
  function act(action, postId, reason) {
    var body = { action: action, post_id: postId }; if (reason) body.reason = reason;
    fetch('/api/public?t=' + encodeURIComponent(token), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) { if (!o.ok) throw new Error((o.j && o.j.error) || 'Falha'); toast(action === 'approve' ? 'Post aprovado ✅' : 'Post reprovado', 'success'); closeModal(); load(); })
      .catch(function (e) { toast(e.message || 'Falha', 'err'); });
  }

  function openSuggest() {
    $('#mboxc').innerHTML =
      '<div class="mhd"><span class="mic">💡</span><h3>Sugerir uma ideia</h3><button class="mx" id="mx" type="button">✕</button></div>' +
      '<form id="sform" class="mbd"><label class="fld"><span>Sua ideia de post</span><input id="sTitle" placeholder="Ex.: Vídeo explicando o passo a passo de X"></label>' +
      '<label class="fld"><span>Detalhes (opcional)</span><textarea id="sNotes" rows="3" placeholder="Contexto, referências, links…"></textarea></label></form>' +
      '<div class="mft"><span></span><div class="mft-r"><button type="button" class="btn" id="scancel">Cancelar</button><button type="submit" form="sform" class="btn pri">Enviar ideia</button></div></div>';
    $('#modal').classList.add('show');
    $('#mx').onclick = closeModal; $('#scancel').onclick = closeModal; $('#modalBg').onclick = closeModal;
    $('#sform').onsubmit = function (e) { e.preventDefault(); submitIdea(); };
    setTimeout(function () { var f = $('#sTitle'); if (f) f.focus(); }, 30);
  }
  function submitIdea() {
    var title = ($('#sTitle').value || '').trim(); if (!title) { toast('Escreva sua ideia', 'err'); return; }
    var notes = $('#sNotes').value;
    var btn = $('#sform').parentNode.querySelector('button[type=submit]'); if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
    fetch('/api/public?t=' + encodeURIComponent(token), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'suggest', title: title, notes: notes }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) { if (!o.ok) throw new Error((o.j && o.j.error) || 'Falha ao enviar'); toast('Ideia enviada! Obrigado 🙌', 'success'); closeModal(); })
      .catch(function (e) { toast(e.message || 'Falha ao enviar', 'err'); if (btn) { btn.disabled = false; btn.textContent = 'Enviar ideia'; } });
  }

  function load() {
    if (!token) { render(); return; }
    fetch('/api/public?t=' + encodeURIComponent(token))
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) { if (!o.ok) throw new Error((o.j && o.j.error) || 'Erro'); data = o.j; render(); maybeDeepLink(); })
      .catch(function (e) { $('#pub').innerHTML = '<div class="puberr">' + esc(e.message || 'Não foi possível carregar o painel.') + '</div>'; });
  }
  var deepDone = false;
  function maybeDeepLink() {
    if (deepDone) return;
    var pid = new URLSearchParams(location.search).get('p'); if (!pid) return;
    deepDone = true;
    var p = postById(pid); if (p) openDetail(p);
  }
  load();
})();
