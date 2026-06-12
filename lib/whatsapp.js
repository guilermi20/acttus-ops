// Envio de mensagem ao WhatsApp via Evolution API.
// A API key fica SÓ em env var — nunca chega ao navegador.
export async function sendText(text) {
  const url = process.env.EVOLUTION_API_URL;
  const instance = process.env.EVOLUTION_INSTANCE;
  const key = process.env.EVOLUTION_API_KEY;
  const group = process.env.EVOLUTION_GROUP_ID;
  if (!url || !instance || !key || !group) {
    throw new Error('Variáveis da Evolution ausentes (EVOLUTION_API_URL / EVOLUTION_INSTANCE / EVOLUTION_API_KEY / EVOLUTION_GROUP_ID)');
  }
  const endpoint = url.replace(/\/$/, '') + '/message/sendText/' + encodeURIComponent(instance);
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': key },
    body: JSON.stringify({ number: group, text }),
  });
  const body = await r.text();
  if (!r.ok) throw new Error('Evolution ' + r.status + ': ' + body);
  return body;
}
