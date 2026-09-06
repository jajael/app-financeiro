/**
 * CÁLCULOS DE RECORRÊNCIA E DATAS (front-end)
 * Portado de google-apps-script/recorrencia.gs + helpers.gs
 * Usado ao adicionar/editar transações para preencher "proxima_data".
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

/**
 * Formata Date -> 'YYYY-MM-DD' (horário local)
 */
function formatarDataISO(data) {
  if (typeof data === 'string') return data.slice(0, 10);
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Cria um Date local a partir de 'YYYY-MM-DD' (evita shift de fuso do parser)
 */
function parseDataLocal(dataStr) {
  const [ano, mes, dia] = String(dataStr).slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * É fim de semana ou feriado fixo?
 */
function ehFimDeSemanaOuFeriado(data) {
  const dow = data.getDay();
  if (dow === 0 || dow === 6) return true;
  return FERIADOS_FIXOS.some(f => f.mes === data.getMonth() + 1 && f.dia === data.getDate());
}

/**
 * Último dia útil de um mês (recebe qualquer Date dentro do mês desejado)
 */
function calcularUltimoUtilMes(data) {
  const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
  while (ehFimDeSemanaOuFeriado(ultimoDia)) {
    ultimoDia.setDate(ultimoDia.getDate() - 1);
  }
  return formatarDataISO(ultimoDia);
}

/**
 * Calcula a próxima data com base no tipo de recorrência.
 * Retorna string 'YYYY-MM-DD' ou null (Pontual).
 */
function calcularProximaData(dataAtual, tipoRecorrencia) {
  if (!dataAtual || !tipoRecorrencia || tipoRecorrencia === 'Pontual') return null;

  const data = parseDataLocal(dataAtual);

  switch (tipoRecorrencia) {
    case 'Último útil do mês':
      return calcularUltimoUtilMes(new Date(data.getFullYear(), data.getMonth() + 1, 1));
    case 'Mensal':
    case 'Vencimento':
    case 'Parcelada':
    default:
      data.setMonth(data.getMonth() + 1);
      return formatarDataISO(data);
  }
}
