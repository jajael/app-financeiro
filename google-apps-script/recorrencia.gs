/**
 * CÁLCULOS DE RECORRÊNCIA E DATAS
 * Lógica para calcular próximas datas e dias úteis
 */

/**
 * Calcula a próxima data baseado no tipo de recorrência
 */
function calcularProximaData(dataAtual, tipoRecorrencia) {
  const data = new Date(dataAtual);
  
  switch(tipoRecorrencia) {
    case 'Pontual':
      return ''; // Sem próxima data
      
    case 'Mensal':
      data.setMonth(data.getMonth() + 1);
      return formatarData(data);
      
    case 'Último útil do mês':
      return calcularUltimoUtilMes(new Date(data.getFullYear(), data.getMonth() + 1, 1));
      
    case 'Vencimento':
      data.setMonth(data.getMonth() + 1);
      return formatarData(data);
      
    case 'Parcelada':
      data.setMonth(data.getMonth() + 1);
      return formatarData(data);
      
    default:
      return formatarData(data);
  }
}

/**
 * Calcula o último dia útil de um mês
 * Retorna o último dia que não é fim de semana nem feriado
 */
function calcularUltimoUtilMes(data) {
  // Ir para o último dia do mês
  const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
  
  // Voltar enquanto for fds ou feriado
  while (ehFimDeSemanaOuFeriado(ultimoDia)) {
    ultimoDia.setDate(ultimoDia.getDate() - 1);
  }
  
  return formatarData(ultimoDia);
}

/**
 * Verifica se uma data é um dia útil
 * Retorna true se for seg-sex e não for feriado
 */
function ehDiaUtil(data) {
  return !ehFimDeSemanaOuFeriado(data);
}

/**
 * Calcula a diferença de dias entre duas datas
 */
function calcularDiasEntre(data1, data2) {
  const d1 = new Date(data1);
  const d2 = new Date(data2);
  const diferenca = d2.getTime() - d1.getTime();
  return Math.floor(diferenca / (1000 * 60 * 60 * 24));
}

/**
 * Retorna os próximos N dias úteis a partir de uma data
 */
function obterProximosDiasUteis(dataInicio, quantidade) {
  const dias = [];
  let data = new Date(dataInicio);
  
  while (dias.length < quantidade) {
    if (ehDiaUtil(data)) {
      dias.push(new Date(data));
    }
    data.setDate(data.getDate() + 1);
  }
  
  return dias;
}
