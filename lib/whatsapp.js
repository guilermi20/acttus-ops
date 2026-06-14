// Envio de mensagens via Evolution API. A API key fica só em env var.
async function send(number, text, extra) {
  const url = process.env.EVOLUTION_API_URL;
  const instance = process.env.EVOLUTION_INSTANCE;
  const key = process.env.EVOLUTION_API_KEY;
  if (!url || !instance || !key) throw new Error('Variáveis da Evolution ausentes (URL/INSTANCE/API_KEY)');
  const endpoint = url.replace(/\/$/, '') + '/message/sendText/' + encodeURIComponent(instance);
  const body = Object.assign({ number: number, text: text }, extra || {});
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': key },
    body: JSON.stringify(body),
  });
  const out = await r.text();
  if (!r.ok) throw new Error('Evolution ' + r.status + ': ' + out);
  return out;
}

// Mensagem no grupo da Acttus — mencionando todos os membros.
export function sendGroup(text) {
  const group = process.env.EVOLUTION_GROUP_ID;
  if (!group) throw new Error('EVOLUTION_GROUP_ID ausente');
  return send(group, text, { mentionsEveryOne: true });
}

// Mensagem no privado de um usuário (telefone com DDI, só dígitos).
export function sendDM(phone, text) {
  const num = String(phone == null ? '' : phone).replace(/\D/g, '');
  if (!num) throw new Error('telefone vazio');
  return send(num, text);
}

// compatibilidade: usado em status de post (vai pro grupo, com menção a todos)
export function sendText(text) { return sendGroup(text); }
