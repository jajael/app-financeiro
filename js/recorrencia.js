/**
 * CÁLCULOS DE RECORRÊNCIA, DIAS ÚTEIS E COMPETÊNCIA (front-end)
 */

// Feriados fixos nacionais (mês 1-12)
const FERIADOS_FIXOS = [
  { mes: 1, dia: 1 },   // Ano Novo
  { mes: 4, dia: 21 },  // Tiradentes
  { mes: 5, dia: 1 },   // Dia do Trabalho
  { mes: 9, dia: 7 },   // Independência
  { mes: 10, dia: 12 }, // N. Sra. Aparecida
  { mes: 11, dia: 2 },  // Finados
  { mes: 11, dia: 20 }, // Consciência Negra
  { mes: 12, dia: 25 }  // Natal
];

/** Date -> 'YYYY-MM-DD' (local) */
function formatarDataISO(data) {
  if (typeof data === 'string') return data.slice(0, 10);
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** 'YYYY-MM-DD' -> Date local (sem shift de fuso) */
function parseDataLocal(dataStr) {
  const [ano, mes, dia] = String(dataStr).slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Fim de semana ou feriado (nacional calculado + do usuário, via feriados.js)? */
function ehFimDeSemanaOuFeriado(data) {
  const dow = data.getDay();
  if (dow === 0 || dow === 6) return true;
  if (typeof ehFeriado === 'function') return ehFeriado(formatarDataISO(data));
  // fallback se feriados.js não carregou: só os fixos
  return FERIADOS_FIXOS.some(f => f.mes === data.getMonth() + 1 && f.dia === data.getDate());
}

/**
 * Dia útil mais próximo. Se já é dia útil, devolve a própria data.
 * Em empate (mesma distância antes/depois), escolhe o dia seguinte.
 */
function ajustarDiaUtil(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  if (!ehFimDeSemanaOuFeriado(d)) return d;
  for (let i = 1; i <= 15; i++) {
    const depois = new Date(d); depois.setDate(d.getDate() + i);
    if (!ehFimDeSemanaOuFeriado(depois)) return depois;
    const antes = new Date(d); antes.setDate(d.getDate() - i);
    if (!ehFimDeSemanaOuFeriado(antes)) return antes;
  }
  return d;
}

/** Primeiro dia útil >= a data dada (avança, nunca volta atrás) */
function proximoDiaUtil(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  for (let i = 0; i < 20 && ehFimDeSemanaOuFeriado(d); i++) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Data de uma receita Mensal/Parcelada: o dia informado dentro da competência,
 * empurrado para o próximo dia útil (nunca para trás). Retorna 'YYYY-MM-DD'.
 */
function dataReceitaMensal(competenciaISO, dia) {
  const c = parseDataLocal(competenciaISO || formatarDataISO(new Date()));
  const y = c.getFullYear();
  const m = c.getMonth();
  const dnum = parseInt(dia, 10);
  const ultimo = new Date(y, m + 1, 0).getDate();
  const base = (dnum >= 1 && dnum <= 31) ? new Date(y, m, Math.min(dnum, ultimo)) : new Date(y, m, 1);
  return formatarDataISO(proximoDiaUtil(base));
}

/** Último dia útil do mês (ano, mes 0-11) */
function ultimoDiaUtilDoMes(ano, mes) {
  const d = new Date(ano, mes + 1, 0);
  while (ehFimDeSemanaOuFeriado(d)) d.setDate(d.getDate() - 1);
  return d;
}

/** Primeiro dia útil do mês (ano, mes 0-11) */
function primeiroDiaUtilDoMes(ano, mes) {
  const d = new Date(ano, mes, 1);
  while (ehFimDeSemanaOuFeriado(d)) d.setDate(d.getDate() + 1);
  return d;
}

/** N-ésimo dia útil do mês (ano, mes 0-11; n>=1) */
function nthDiaUtilDoMes(ano, mes, n) {
  const d = new Date(ano, mes, 1);
  let cont = 0;
  while (d.getMonth() === mes) {
    if (!ehFimDeSemanaOuFeriado(d)) {
      cont += 1;
      if (cont === n) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
  }
  return ultimoDiaUtilDoMes(ano, mes); // menos dias úteis que n -> último
}

/**
 * Data em que ESTA ocorrência cai (para mostrar no formulário).
 * Usa o mês da própria data.
 */
function dataDaOcorrencia(dataISO, tipo) {
  if (!dataISO) return '';
  const d = parseDataLocal(dataISO);
  if (tipo === 'Último dia útil do mês') return formatarDataISO(ultimoDiaUtilDoMes(d.getFullYear(), d.getMonth()));
  if (tipo === 'Primeiro dia útil do mês') return formatarDataISO(primeiroDiaUtilDoMes(d.getFullYear(), d.getMonth()));
  if (tipo === 'Até o 5º dia útil do mês') return formatarDataISO(nthDiaUtilDoMes(d.getFullYear(), d.getMonth(), 5));
  return '';
}

/* ---------- Recorrências com data derivada da competência ---------- */

/** Tipos cujo dia é um dia útil fixo, calculado a partir da competência */
const RECORRENCIA_DIA_UTIL = [
  'Primeiro dia útil do mês',
  'Até o 5º dia útil do mês',
  'Último dia útil do mês',
  'Último dia útil do mês anterior'
];

/**
 * Data real de um lançamento "dia útil fixo" para uma dada competência.
 * "Último dia útil do mês anterior" cai no mês ANTERIOR ao da competência
 * (ex.: salário de setembro pago em 31/08). A competência continua sendo setembro.
 * @param {string} competenciaISO  'YYYY-MM-01'
 * @param {string} tipo            um de RECORRENCIA_DIA_UTIL
 */
function dataDiaUtilPorCompetencia(competenciaISO, tipo) {
  if (!competenciaISO) return '';
  const c = parseDataLocal(competenciaISO);
  let ano = c.getFullYear();
  let mes = c.getMonth();
  if (tipo === 'Último dia útil do mês anterior') {
    mes -= 1;
    if (mes < 0) { mes = 11; ano -= 1; }
    return formatarDataISO(ultimoDiaUtilDoMes(ano, mes));
  }
  if (tipo === 'Último dia útil do mês')  return formatarDataISO(ultimoDiaUtilDoMes(ano, mes));
  if (tipo === 'Primeiro dia útil do mês') return formatarDataISO(primeiroDiaUtilDoMes(ano, mes));
  if (tipo === 'Até o 5º dia útil do mês') return formatarDataISO(nthDiaUtilDoMes(ano, mes, 5));
  return '';
}

/**
 * Próxima data da recorrência (string 'YYYY-MM-DD') ou null se Pontual.
 * @param {string} dataAtual  'YYYY-MM-DD'
 * @param {string} tipo       Pontual | Mensal | Parcelada | Último dia útil do mês |
 *                            Primeiro dia útil do mês | Semanal
 * @param {number|string} dia      dia do mês (Mensal/Parcelada)
 * @param {number|string} diaSemana 0-6 (Semanal); '' = sem dia fixo -> +7 dias
 */
function calcularProximaData(dataAtual, tipo, dia, diaSemana) {
  if (!dataAtual || !tipo || tipo === 'Pontual') return null;

  const base = parseDataLocal(dataAtual);

  if (tipo === 'Semanal') {
    const alvo = new Date(base);
    const dow = parseInt(diaSemana, 10);
    if (Number.isInteger(dow) && dow >= 0 && dow <= 6) {
      let delta = (dow - base.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      alvo.setDate(base.getDate() + delta);
    } else {
      alvo.setDate(base.getDate() + 7); // sem dia fixo
    }
    return formatarDataISO(alvo);
  }

  let ano = base.getFullYear();
  let mes = base.getMonth() + 1; // próximo mês
  if (mes > 11) { mes = 0; ano += 1; }

  if (tipo === 'Último dia útil do mês'
      || tipo === 'Último dia útil do mês anterior') return formatarDataISO(ultimoDiaUtilDoMes(ano, mes));
  if (tipo === 'Primeiro dia útil do mês') return formatarDataISO(primeiroDiaUtilDoMes(ano, mes));
  if (tipo === 'Até o 5º dia útil do mês') return formatarDataISO(nthDiaUtilDoMes(ano, mes, 5));

  // Mensal / Parcelada
  const diaNum = parseInt(dia, 10) || base.getDate();
  const ultimoDoMes = new Date(ano, mes + 1, 0).getDate();
  return formatarDataISO(ajustarDiaUtil(new Date(ano, mes, Math.min(diaNum, ultimoDoMes))));
}

/**
 * Mês de competência de uma compra no cartão.
 * Compra antes do fechamento -> mês da compra; no dia ou depois -> mês seguinte.
 * Retorna 'YYYY-MM-01'.
 */
function competenciaDe(dataISO, diaFechamento) {
  const d = parseDataLocal(dataISO);
  let ano = d.getFullYear();
  let mes = d.getMonth(); // 0-11
  if (diaFechamento && d.getDate() >= diaFechamento) {
    mes += 1;
    if (mes > 11) { mes = 0; ano += 1; }
  }
  return `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
}

/** Todas as datas 'YYYY-MM-DD' do mês (ano, mes 0-11) cujo dia da semana é `dow` (0-6) */
function ocorrenciasDoDiaNoMes(ano, mes, dow) {
  const out = [];
  const d = new Date(ano, mes, 1);
  while (d.getMonth() === mes) {
    if (d.getDay() === dow) out.push(formatarDataISO(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** 1ª ocorrência do dia da semana `dow` no mês SEGUINTE ao de `dataISO` */
function primeiraOcorrenciaProxMes(dataISO, dow) {
  const d = parseDataLocal(dataISO);
  let ano = d.getFullYear();
  let mes = d.getMonth() + 1;
  if (mes > 11) { mes = 0; ano += 1; }
  return ocorrenciasDoDiaNoMes(ano, mes, dow)[0] || null;
}

/** 'YYYY-MM-DD' de hoje (local) */
function hojeISO() {
  return formatarDataISO(new Date());
}

/** Data de vencimento: o dia informado na competência; se cair em fim de
 *  semana ou feriado, adia para o PRÓXIMO dia útil (nunca para trás). */
function dataVencimento(competenciaISO, dia) {
  const diaNum = parseInt(dia, 10);
  if (!competenciaISO || !diaNum) return '';
  const c = parseDataLocal(competenciaISO);
  const ultimo = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
  return formatarDataISO(proximoDiaUtil(new Date(c.getFullYear(), c.getMonth(), Math.min(diaNum, ultimo))));
}

/** Soma `n` meses a uma data 'YYYY-MM-DD', preservando o dia (limitado ao fim do mês) */
function addMeses(dataISO, n) {
  const d = parseDataLocal(dataISO);
  let y = d.getFullYear();
  let m = d.getMonth() + n;
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  const ultimo = new Date(y, m + 1, 0).getDate();
  return formatarDataISO(new Date(y, m, Math.min(d.getDate(), ultimo)));
}

/**
 * Sugestão de "melhor dia de compra" a partir do dia de fechamento: é
 * literalmente o dia seguinte ao fechamento (a compra cai só na próxima
 * fatura, dando o prazo máximo até o vencimento). Sem ajuste pra dia
 * útil — é só uma sugestão de referência, não uma data de verdade.
 * Retorna número (1-31); fechamento 31 vira dia 1.
 */
function sugerirMelhorDiaCompra(diaFechamento) {
  const f = parseInt(diaFechamento, 10);
  if (!f) return '';
  return f >= 31 ? 1 : f + 1;
}
