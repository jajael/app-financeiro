/**
 * FUNÇÕES AUXILIARES E UTILITÁRIAS
 * Validação, formatação, respostas JSON
 */

/**
 * Valida dados de transação
 */
function validarDados(dados) {
  if (!dados.data || !dados.valor || !dados.categoria) {
    throw new Error('Data, Valor e Categoria são obrigatórios');
  }
  
  if (isNaN(parseFloat(dados.valor)) || parseFloat(dados.valor) <= 0) {
    throw new Error('Valor deve ser um número positivo');
  }
  
  if (isNaN(Date.parse(dados.data))) {
    throw new Error('Data inválida');
  }
}

/**
 * Formata data para string YYYY-MM-DD
 */
function formatarData(data) {
  if (typeof data === 'string') {
    return data;
  }
  
  const d = new Date(data);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${year}-${month}-${day}`;
}

/**
 * Retorna JSON formatado
 */
function retornarJSON(dados) {
  return ContentService.createTextOutput(JSON.stringify(dados))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Resposta de sucesso
 */
function sucesso(dados) {
  return {
    status: 'sucesso',
    dados: dados
  };
}

/**
 * Resposta de erro
 */
function erro(mensagem) {
  return {
    status: 'erro',
    mensagem: mensagem
  };
}

/**
 * Verifica se é fim de semana ou feriado
 */
function ehFimDeSemanaOuFeriado(data) {
  const dia = data.getDay();
  
  // Sábado (6) ou Domingo (0)
  if (dia === 0 || dia === 6) {
    return true;
  }
  
  // Verificar feriados fixos
  for (let feriado of FERIADOS_FIXOS) {
    if (data.getMonth() + 1 === feriado.mes && data.getDate() === feriado.dia) {
      return true;
    }
  }
  
  // Verificar feriados móveis
  for (let feriado of FERIADOS_MOVEIS_2026) {
    if (data.getTime() === new Date(feriado).getTime()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Atualiza as recorrências futuras quando uma é editada
 */
function atualizarRecorrenciasFuturas(sheet, linhaAtual, dados) {
  // Implementar se necessário - por enquanto apenas atualiza a linha atual
  // Pode ser expandido para atualizar todas as futuras da mesma recorrência
}
