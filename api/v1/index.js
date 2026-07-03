// GET /api/v1 → descoberta da API (lista de recursos, auth, convenções).
// O catch-all [...resource].js atende /api/v1/*; este atende a raiz exata.
import { applyCors } from '../../lib/apikey.js';
import { discovery } from '../../lib/apidocs.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json(discovery(req));
}
