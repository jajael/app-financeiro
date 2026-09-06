/**
 * OPERAÇÕES CRUD
 * Create, Read, Update, Delete de transações
 */

/**
 * Adiciona uma nova transação
 */
function adicionarTransacao(dados) {
  validarDados(dados);
  
  const sheet = obterPlanilha(dados.tipo);
  const novaLinha = [
    dados.data,
    parseFloat(dados.valor),
    dados.metodo,
    dados.categoria,
    dados.descricao || '',
    dados.formaPagamento || 'À vista',
    dados.tipoRecorrencia || 'Pontual',
    calcularProximaData(dados.data, dados.tipoRecorrencia),
    'Ativa',
    new Date()
  ];
  
  sheet.appendRow(novaLinha);
  
  return sucesso({
    mensagem: 'Transação adicionada com sucesso',
    linha: sheet.getLastRow()
  });
}

/**
 * Lista transações de um tipo específico filtrado por mês/ano
 */
function listarTransacoes(filtros) {
  const sheet = obterPlanilha(filtros.tipo);
  const dados = sheet.getDataRange().getValues();
  
  if (dados.length <= 1) {
    return sucesso({ total: 0, transacoes: [] });
  }
  
  const transacoes = dados.slice(1);
  const mes = filtros.mes;
  const ano = filtros.ano;
  
  const resultado = transacoes
    .map((linha, idx) => ({
      id: idx + 2, // id é a linha (1 = cabeçalho, então +2)
      data: formatarData(linha[0]),
      valor: parseFloat(linha[1]) || 0,
      metodo: linha[2],
      categoria: linha[3],
      descricao: linha[4],
      formaPagamento: linha[5],
      tipoRecorrencia: linha[6],
      proximaData: formatarData(linha[7]),
      status: linha[8]
    }))
    .filter(trans => {
      const dataTrans = new Date(trans.data);
      return dataTrans.getMonth() + 1 === mes && dataTrans.getFullYear() === ano;
    })
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  
  return sucesso({
    total: resultado.length,
    transacoes: resultado
  });
}

/**
 * Edita uma transação existente
 */
function editarTransacao(dados) {
  if (!dados.id || !dados.tipo) {
    return erro('ID e tipo são obrigatórios');
  }
  
  validarDados(dados);
  
  const sheet = obterPlanilha(dados.tipo);
  const linha = dados.id;
  
  // Atualizar a linha
  sheet.getRange(linha, 1).setValue(dados.data);
  sheet.getRange(linha, 2).setValue(parseFloat(dados.valor));
  sheet.getRange(linha, 3).setValue(dados.metodo);
  sheet.getRange(linha, 4).setValue(dados.categoria);
  sheet.getRange(linha, 5).setValue(dados.descricao || '');
  sheet.getRange(linha, 6).setValue(dados.formaPagamento || 'À vista');
  sheet.getRange(linha, 7).setValue(dados.tipoRecorrencia || 'Pontual');
  
  // Se for recorrente, atualizar próxima data e cascade futuras
  if (dados.tipoRecorrencia !== 'Pontual' && dados.cascata !== false) {
    const novaProxima = calcularProximaData(dados.data, dados.tipoRecorrencia);
    sheet.getRange(linha, 8).setValue(novaProxima);
    
    // Atualizar todas as transações futuras da mesma recorrência
    atualizarRecorrenciasFuturas(sheet, linha, dados);
  }
  
  return sucesso({
    mensagem: 'Transação editada com sucesso'
  });
}

/**
 * Deleta uma transação
 */
function deletarTransacao(dados) {
  if (!dados.id || !dados.tipo) {
    return erro('ID e tipo são obrigatórios');
  }
  
  const sheet = obterPlanilha(dados.tipo);
  sheet.deleteRow(dados.id);
  
  return sucesso({
    mensagem: 'Transação deletada com sucesso'
  });
}

/**
 * Obtém resumo de um tipo de transação (total e por categoria)
 */
function obterResumo(filtros) {
  const sheet = obterPlanilha(filtros.tipo);
  const dados = sheet.getDataRange().getValues();
  
  if (dados.length <= 1) {
    return sucesso({
      mes: filtros.mes,
      ano: filtros.ano,
      total: 0,
      porCategoria: []
    });
  }
  
  const transacoes = dados.slice(1);
  const mes = filtros.mes;
  const ano = filtros.ano;
  
  let total = 0;
  const porCategoria = {};
  
  transacoes.forEach(linha => {
    if (linha[0] === '') return;
    
    const data = new Date(linha[0]);
    if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
      const valor = parseFloat(linha[1]) || 0;
      const categoria = linha[3];
      
      total += valor;
      
      if (!porCategoria[categoria]) {
        porCategoria[categoria] = 0;
      }
      porCategoria[categoria] += valor;
    }
  });
  
  const categoriaOrdenada = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, valor]) => ({
      categoria,
      valor: parseFloat(valor.toFixed(2)),
      percentual: total > 0 ? ((valor / total) * 100).toFixed(1) : 0
    }));
  
  return sucesso({
    mes: filtros.mes,
    ano: filtros.ano,
    total: parseFloat(total.toFixed(2)),
    porCategoria: categoriaOrdenada
  });
}

/**
 * Obtém lista de categorias únicas
 */
function obterCategorias(tipo) {
  const sheet = obterPlanilha(tipo);
  const dados = sheet.getDataRange().getValues();
  
  const categorias = new Set();
  dados.slice(1).forEach(linha => {
    if (linha[3]) {
      categorias.add(linha[3]);
    }
  });
  
  return sucesso({
    total: categorias.size,
    categorias: Array.from(categorias).sort()
  });
}

/**
 * Obtém transações que vencem nos próximos 30 dias
 */
function obterProximasTransacoes(tipo) {
  const sheet = obterPlanilha(tipo);
  const dados = sheet.getDataRange().getValues();
  
  if (dados.length <= 1) {
    return sucesso({ proximas: [] });
  }
  
  const hoje = new Date();
  const proximos30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const transacoes = dados.slice(1)
    .map((linha, idx) => ({
      id: idx + 2,
      data: formatarData(linha[0]),
      valor: parseFloat(linha[1]) || 0,
      categoria: linha[3],
      descricao: linha[4],
      tipoRecorrencia: linha[6],
      proximaData: formatarData(linha[7])
    }))
    .filter(trans => {
      const proxima = new Date(trans.proximaData);
      return proxima >= hoje && proxima <= proximos30dias && trans.tipoRecorrencia !== 'Pontual';
    })
    .sort((a, b) => new Date(a.proximaData) - new Date(b.proximaData));
  
  return sucesso({
    total: transacoes.length,
    proximas: transacoes
  });
}
