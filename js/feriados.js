/**
 * FERIADOS
 * - Nacionais: calculados no navegador (fixos + móveis via Páscoa).
 *   Não são apagáveis; podem ser desativados (guardado no Supabase).
 * - Do usuário: cadastrados à mão (data + nome). Podem ser apagados.
 * - Botão opcional "sincronizar" puxa da BrasilAPI para completar anos
 *   em que a legislação mudou (ex.: novos feriados nacionais).
 *
 * Os cálculos de dia útil (recorrencia.js) consultam ehFeriado().
 */

// Feriados nacionais fixos: [mês 1-12, dia, nome]
const FERIADOS_NACIONAIS_FIXOS = [
  [1, 1, 'Confraternização Universal'],
  [4, 21, 'Tiradentes'],
  [5, 1, 'Dia do Trabalho'],
  [9, 7, 'Independência do Brasil'],
  [10, 12, 'Nossa Senhora Aparecida'],
  [11, 2, 'Finados'],
  [11, 15, 'Proclamação da República'],
  [11, 20, 'Consciência Negra'],   // nacional a partir de 2024 (Lei 14.759/2023)
  [12, 25, 'Natal']
];

// Feriados móveis: offset em dias em relação ao Domingo de Páscoa
const FERIADOS_NACIONAIS_MOVEIS = [
  [-47, 'Carnaval'],
  [-2, 'Sexta-feira Santa'],
  [60, 'Corpus Christi']
];

/** Domingo de Páscoa do ano (algoritmo de Meeus/Butcher). Retorna Date local. */
function domingoDePascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);      // 3=março, 4=abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

/** Lista de feriados nacionais de um ano: [{ data:'YYYY-MM-DD', nome }] */
function feriadosNacionaisDoAno(ano) {
  const out = FERIADOS_NACIONAIS_FIXOS.map(([mes, dia, nome]) => ({
    data: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
    nome
  }));
  const pascoa = domingoDePascoa(ano);
  FERIADOS_NACIONAIS_MOVEIS.forEach(([offset, nome]) => {
    const d = new Date(pascoa.getFullYear(), pascoa.getMonth(), pascoa.getDate() + offset);
    out.push({ data: formatarDataISO(d), nome });
  });
  return out.sort((x, y) => x.data.localeCompare(y.data));
}

/* ================= Estado ================= */

// Mapa iso -> { nome, ativo } para feriados nacionais (calculados + overrides do banco)
// Mapa iso -> { id, nome, ativo } para feriados do usuário
const feriadosState = {
  nacional: new Map(),
  usuario: new Map(),
  anos: []          // anos já calculados
};

/** Garante que os feriados nacionais calculados de um intervalo de anos estão no mapa */
function calcularFeriadosNacionais(anoIni, anoFim) {
  for (let ano = anoIni; ano <= anoFim; ano++) {
    if (feriadosState.anos.includes(ano)) continue;
    feriadosState.anos.push(ano);
    feriadosNacionaisDoAno(ano).forEach(f => {
      if (!feriadosState.nacional.has(f.data)) {
        feriadosState.nacional.set(f.data, { nome: f.nome, ativo: true });
      }
    });
  }
}

/** true se a data (ISO 'YYYY-MM-DD') é um feriado ATIVO */
function ehFeriado(iso) {
  const s = String(iso).slice(0, 10);
  const n = feriadosState.nacional.get(s);
  if (n && n.ativo) return true;
  const u = feriadosState.usuario.get(s);
  return !!(u && u.ativo);
}

/** Nome do feriado da data, ou '' */
function nomeFeriado(iso) {
  const s = String(iso).slice(0, 10);
  return (feriadosState.usuario.get(s)?.nome) || (feriadosState.nacional.get(s)?.nome) || '';
}

/* ================= Supabase ================= */

/** Carrega os feriados do usuário e os overrides de feriados nacionais */
async function carregarFeriados() {
  // calcula um intervalo generoso ao redor do ano em exibição
  const anoBase = (typeof estadoApp !== 'undefined' && estadoApp.mesAtual)
    ? estadoApp.mesAtual.getFullYear() : new Date().getFullYear();
  calcularFeriadosNacionais(anoBase - 1, anoBase + 3);

  feriadosState.usuario.clear();
  try {
    const { data, error } = await sb.from('feriados').select('*');
    if (error) throw error;
    (data || []).forEach(row => {
      const iso = String(row.data).slice(0, 10);
      if (row.origem === 'nacional') {
        feriadosState.nacional.set(iso, { nome: row.nome, ativo: row.ativo });
      } else {
        feriadosState.usuario.set(iso, { id: row.id, nome: row.nome, ativo: row.ativo });
      }
    });
  } catch (e) {
    console.warn('Feriados: não foi possível carregar do banco', e?.message || e);
  }
}

/** Ativa/desativa um feriado NACIONAL (grava um override no banco) */
async function definirFeriadoNacionalAtivo(iso, ativo) {
  const atual = feriadosState.nacional.get(iso);
  const nome = atual?.nome || nomeFeriado(iso) || 'Feriado nacional';
  feriadosState.nacional.set(iso, { nome, ativo });
  const { error } = await sb.from('feriados')
    .upsert({ data: iso, nome, origem: 'nacional', ativo }, { onConflict: 'user_id,data,origem' });
  if (error) { console.error(error); throw error; }
}

/** Cria um feriado do usuário */
async function criarFeriadoUsuario(iso, nome) {
  const { data, error } = await sb.from('feriados')
    .insert({ data: iso, nome, origem: 'usuario', ativo: true })
    .select().single();
  if (error) { console.error(error); throw error; }
  feriadosState.usuario.set(iso, { id: data.id, nome: data.nome, ativo: data.ativo });
}

/** Ativa/desativa um feriado do usuário */
async function definirFeriadoUsuarioAtivo(id, ativo) {
  const { error } = await sb.from('feriados').update({ ativo }).eq('id', id);
  if (error) { console.error(error); throw error; }
  for (const [iso, v] of feriadosState.usuario) if (v.id === id) v.ativo = ativo;
}

/** Apaga um feriado do usuário */
async function apagarFeriadoUsuario(id) {
  const { error } = await sb.from('feriados').delete().eq('id', id);
  if (error) { console.error(error); throw error; }
  for (const [iso, v] of [...feriadosState.usuario]) if (v.id === id) feriadosState.usuario.delete(iso);
}

// UF selecionada para os feriados estaduais (persistida no navegador)
const UFS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function feriadosUF() {
  try { return localStorage.getItem('feriadosUF') || ''; } catch (_) { return ''; }
}
function definirFeriadosUF(uf) {
  try { localStorage.setItem('feriadosUF', uf || ''); } catch (_) {}
}

/**
 * Sincroniza com a Nager.Date: para os anos pedidos, adiciona como
 * "nacional" (não apagável, só desativável) qualquer feriado NACIONAL que
 * ainda não conheçamos e — se houver UF selecionada — os feriados desse
 * estado (counties = ["BR-XX"]). Não remove nada. Retorna quantos entraram.
 */
async function sincronizarFeriados(anos) {
  const uf = feriadosUF();
  const alvoUF = uf ? `BR-${uf}` : null;
  let adicionados = 0;
  for (const ano of anos) {
    let lista;
    try {
      const resp = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${ano}/BR`);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      lista = await resp.json();
    } catch (e) {
      throw new Error(`Falha ao consultar a Nager.Date (${ano}): ${e.message || e}`);
    }
    calcularFeriadosNacionais(ano, ano);
    for (const f of lista) {
      const nacional = f.global === true || !f.counties;
      const doEstado = !nacional && alvoUF && Array.isArray(f.counties) && f.counties.includes(alvoUF);
      if (!nacional && !doEstado) continue;
      const iso = String(f.date).slice(0, 10);
      const nome = f.localName || f.name;
      if (feriadosState.nacional.has(iso)) continue;
      feriadosState.nacional.set(iso, { nome, ativo: true });
      const { error } = await sb.from('feriados')
        .upsert({ data: iso, nome, origem: 'nacional', ativo: true },
                { onConflict: 'user_id,data,origem' });
      if (!error) adicionados++;
    }
  }
  return adicionados;
}

/** Feriados nacionais de um ano para exibição: [{ data, nome, ativo }] */
function feriadosNacionaisView(ano) {
  calcularFeriadosNacionais(ano, ano);
  return [...feriadosState.nacional.entries()]
    .filter(([iso]) => iso.startsWith(String(ano) + '-'))
    .map(([iso, v]) => ({ data: iso, nome: v.nome, ativo: v.ativo }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** Feriados do usuário para exibição: [{ id, data, nome, ativo }] */
function feriadosUsuarioView() {
  return [...feriadosState.usuario.entries()]
    .map(([iso, v]) => ({ id: v.id, data: iso, nome: v.nome, ativo: v.ativo }))
    .sort((a, b) => a.data.localeCompare(b.data));
}
