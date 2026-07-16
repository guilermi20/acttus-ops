// Agenda do Google (somente leitura), lida do feed iCal.
//
// GCAL_ICS_URL é o "endereço particular no formato iCal" da agenda: quem tem a URL
// lê a agenda inteira, sem login. Por isso ela vive só em env var e é buscada aqui,
// no servidor — o browser recebe apenas o JSON já filtrado, nunca a URL.
//
// O feed do Google já entrega as ocorrências expandidas (sem RRULE), então não há
// expansão de recorrência aqui. Se um dia vier RRULE, `rrule` no retorno sai > 0 e
// a UI avisa — melhor gritar do que mostrar agenda errada em silêncio.

const TTL = 5 * 60 * 1000; // o feed tem centenas de KB; baixar a cada abertura é desperdício
let cache = null; // { at, parsed }

// ICS dobra linha longa em CRLF + espaço/tab. Tem que desdobrar antes de qualquer parse.
function unfold(t) { return String(t).replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, ''); }

function unesc(v) {
  return String(v).replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

// 20260518 (dia todo) | 20260518T180000Z (instante UTC) | 20260518T180000 (hora "de parede")
function parseDt(val) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(String(val).trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h) return { allDay: true, iso: y + '-' + mo + '-' + d };
  const wall = y + '-' + mo + '-' + d + 'T' + h + ':' + mi + ':' + s;
  // Sem Z o horário é "flutuante" (ou preso a um TZID): é hora de parede, não instante.
  // Devolvemos como veio e sinalizamos, para o front exibir sem converter fuso.
  return z ? { allDay: false, iso: wall + 'Z' } : { allDay: false, iso: wall, floating: true };
}

function parseIcs(text) {
  const body = unfold(text);
  const out = [];
  let rrule = 0;
  const blocks = body.split('BEGIN:VEVENT').slice(1);
  for (const block of blocks) {
    const raw = block.split('END:VEVENT')[0];
    const ev = {};
    for (const line of raw.split(/\r?\n/)) {
      const c = line.indexOf(':');
      if (c < 0) continue;
      const key = line.slice(0, c).split(';')[0].trim().toUpperCase();
      const val = line.slice(c + 1);
      if (key === 'RRULE') { rrule++; continue; }
      if (key === 'UID') ev.uid = val.trim();
      else if (key === 'SUMMARY') ev.title = unesc(val).trim();
      else if (key === 'LOCATION') ev.location = unesc(val).trim();
      else if (key === 'DESCRIPTION') ev.description = unesc(val).slice(0, 2000);
      else if (key === 'STATUS') ev.status = val.trim();
      else if (key === 'DTSTART') ev._s = parseDt(val);
      else if (key === 'DTEND') ev._e = parseDt(val);
    }
    if (!ev._s) continue;
    if (ev.status === 'CANCELLED') continue;
    out.push({
      uid: ev.uid || '',
      title: ev.title || '(sem título)',
      start: ev._s.iso,
      end: ev._e ? ev._e.iso : null,
      allDay: !!ev._s.allDay,
      floating: !!ev._s.floating,
      location: ev.location || '',
      description: ev.description || '',
    });
  }
  return { events: out, rrule };
}

async function load() {
  if (cache && Date.now() - cache.at < TTL) return cache.parsed;
  const url = process.env.GCAL_ICS_URL;
  if (!url) throw new Error('GCAL_ICS_URL não configurada');
  const r = await fetch(url, { headers: { 'User-Agent': 'acttus-os' } });
  if (!r.ok) throw new Error('Google respondeu ' + r.status + ' ao buscar o feed da agenda');
  const parsed = parseIcs(await r.text());
  cache = { at: Date.now(), parsed };
  return parsed;
}

// Ordena por início e corta na janela pedida. Devolve só o necessário pro painel.
export async function agenda(days) {
  const { events, rrule } = await load();
  const now = Date.now();
  const from = now - 12 * 3600 * 1000; // ainda mostra o que rolou hoje mais cedo
  const to = now + (days || 60) * 86400000;
  const at = (e) => (e.allDay ? new Date(e.start + 'T12:00:00Z').getTime() : new Date(e.floating ? e.start + 'Z' : e.start).getTime());
  const win = events.filter((e) => { const t = at(e); return t >= from && t <= to; }).sort((a, b) => at(a) - at(b));
  // Feed público/free-busy mascara todo título como "Busy" — a UI precisa saber para explicar.
  const masked = events.length > 0 && events.every((e) => e.title === 'Busy');
  return { events: win, masked, rrule, total: events.length, fetchedAt: new Date(cache.at).toISOString() };
}
