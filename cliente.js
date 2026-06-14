/* Painel público do cliente (só visualização) + sugerir ideia. Standalone. */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  var MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function fmtDay(iso) { if (!iso) return ''; var p = iso.split('-'); return p[2] + ' ' + MON[+p[1] - 1]; }
  var STATUS_COLOR = { 'Agendado': 'gray', 'Em produção': 'blue', 'Aguardando aprovação': 'amber', 'Modificação': 'red', 'Finalizado': 'purple', 'Postado': 'green' };
  var TYPE = { carrossel: 'Carrossel', reels: 'Reels', estatico: 'Estático' };
  function badge(t, c) { return '<span class="bg c-' + (c || 'gray') + '"><span class="bgdot"></span>' + esc(t) + '</span>'; }
  var _t; function toast(t, k) { var e = $('#toast'); e.className = 'toast show' + (k ? ' ' + k : ''); e.textContent = t; clearTimeout(_t); _t = setTimeout(function () { e.className = 'toast'; }, 3200); }

  var token = new URLSearchParams(location.search).get('t');
  var data = null;

  function render() {
    var pub = $('#pub');
    if (!token) { pub.innerHTML = '<div class="puberr">Link inválido. Peça um novo link à equipe Acttus.</div>'; return; }
    if (!data) { pub.innerHTML = '<div class="publoading">Carregando…</div>'; return; }
    var c = data.client;
    var cover = c.cover_url ? ' style="background-image:url(' + JSON.stringify(c.cover_url) + ')"' : '';
    var av = c.avatar_url ? '<span class="pub-av" style="background-image:url(' + JSON.stringify(c.avatar_url) + ')"></span>'
      : '<span class="pub-av ph">' + esc((c.name || '?').charAt(0).toUpperCase()) + '</span>';
    var posts = data.posts || [];
    var byDate = {}; posts.forEach(function (p) { (byDate[p.pub_date] = byDate[p.pub_date] || []).push(p); });
    var dates = Object.keys(byDate).sort();
    var list = dates.length ? dates.map(function (d) {
      return '<div class="pub-day"><div class="pub-date">' + fmtDay(d) + '</div>' + byDate[d].map(function (p) {
        return '<div class="pub-post"><div class="pp-l"><div class="pp-t">' + esc(p.title) + '</div><div class="pp-m">' + (p.pub_time ? p.pub_time + ' · ' : '') + (TYPE[p.post_type] || p.post_type) + '</div></div>' + badge(p.status, STATUS_COLOR[p.status]) + '</div>';
      }).join('') + '</div>';
    }).join('') : '<div class="empty">Nenhuma publicação planejada para este mês ainda.</div>';
    pub.innerHTML =
      '<div class="pub-cover"' + cover + '><div class="pub-cover-sh"></div></div>' +
      '<div class="pub-wrap">' +
        '<div class="pub-head">' + av + '<div class="pub-h-tx"><h1>' + esc(c.name) + '</h1><div class="pub-sub">Calendário & demandas · Acttus</div></div>' +
          '<button class="btn pri" id="suggest">💡 Sugerir ideia</button></div>' +
        '<div class="pub-section"><h2>Publicações planejadas</h2>' + list + '</div>' +
        '<div class="pub-foot">Painel de visualização — mantido em tempo real pela equipe Acttus.</div>' +
      '</div>';
    $('#suggest').onclick = openSuggest;
  }

  function closeModal() { $('#modal').classList.remove('show'); $('#mboxc').innerHTML = ''; }
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
    fetch('/api/public?t=' + encodeURIComponent(token), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title, notes: notes }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) { if (!o.ok) throw new Error((o.j && o.j.error) || 'Falha ao enviar'); toast('Ideia enviada! Obrigado 🙌', 'success'); closeModal(); })
      .catch(function (e) { toast(e.message || 'Falha ao enviar', 'err'); if (btn) { btn.disabled = false; btn.textContent = 'Enviar ideia'; } });
  }

  function load() {
    if (!token) { render(); return; }
    fetch('/api/public?t=' + encodeURIComponent(token))
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) { if (!o.ok) throw new Error((o.j && o.j.error) || 'Erro'); data = o.j; render(); })
      .catch(function (e) { $('#pub').innerHTML = '<div class="puberr">' + esc(e.message || 'Não foi possível carregar o painel.') + '</div>'; });
  }
  load();
})();
