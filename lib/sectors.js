// Setores da agência. FONTE ÚNICA do lado do servidor — o espelho do
// navegador é o SECTORS no topo do app.js (o front é JS puro, sem bundler,
// então não dá para importar daqui). Para criar um setor novo: uma linha aqui
// e uma linha lá.
export const SECTORS = ['marketing', 'trafego'];
export const DEFAULT_SECTOR = 'marketing';

export function validSector(v) {
  const s = String(v == null ? '' : v).trim();
  return SECTORS.includes(s) ? s : null;
}

// Normaliza o que veio do banco/corpo da requisição para uma lista de setores
// válidos. Lista vazia ou lixo → o setor padrão (ninguém fica sem acesso).
export function cleanSectors(v) {
  const arr = Array.isArray(v) ? v : [];
  const out = [];
  for (const item of arr) {
    const s = validSector(item);
    if (s && !out.includes(s)) out.push(s);
  }
  return out.length ? out : [DEFAULT_SECTOR];
}

// Setores que o usuário enxerga. Admin transita em todos, como combinado.
export function sectorsOf(user) {
  if (user && user.role === 'admin') return SECTORS.slice();
  return cleanSectors(user && user.sectors);
}
