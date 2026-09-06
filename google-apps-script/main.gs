/**
 * ROTAS PRINCIPAIS E TESTES
 * Funções de entrada (doPost, doGet) e testes
 */

/**
 * Handler para requisições POST
 * Roteia as ações: adicionar, editar, deletar, resumo, e menus
 */
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    
    switch(dados.acao) {
      case 'adicionar':
        return retornarJSON(adicionarTransacao(dados));
      case 'listar':
        return retornarJSON(listarTransacoes(dados));
      case 'editar':
        return retornarJSON(editarTransacao(dados));
      case 'deletar':
        return retornarJSON(deletarTransacao(dados));
      case 'resumo':
        return retornarJSON(obterResumo(dados));
      // Novos endpoints de menus
      case 'adicionarItemMenu':
        return retornarJSON(adicionarItemMenu(dados.tipo, dados.nome, dados.descricao));
      case 'editarItemMenu':
        return retornarJSON(editarItemMenu(dados.linha, dados.nome, dados.descricao, dados.status));
      case 'removerItemMenu':
        return retornarJSON(removerItemMenu(dados.linha));
      case 'desativarItemMenu':
        return retornarJSON(desativarItemMenu(dados.linha));
      case 'ativarItemMenu':
        return retornarJSON(ativarItemMenu(dados.linha));
      default:
        return retornarJSON(erro('Ação não reconhecida'));
    }
  } catch(error) {
    Logger.log('Erro: ' + error.toString());
    return retornarJSON(erro('Erro ao processar: ' + error.toString()));
  }
}

/**
 * Handler para requisições GET
 * Roteia as ações: listar, resumo, categorias, proximas, menus, menusCompleto, itensPorTipo
 */
function doGet(e) {
  const acao = e.parameter.acao || 'listar';
  const tipo = e.parameter.tipo || 'entradas'; // entradas ou saidas
  const mes = parseInt(e.parameter.mes) || new Date().getMonth() + 1;
  const ano = parseInt(e.parameter.ano) || new Date().getFullYear();
  
  try {
    switch(acao) {
      case 'listar':
        return retornarJSON(listarTransacoes({ tipo, mes, ano }));
      case 'resumo':
        return retornarJSON(obterResumo({ tipo, mes, ano }));
      case 'categorias':
        return retornarJSON(obterCategorias(tipo));
      case 'proximas':
        return retornarJSON(obterProximasTransacoes(tipo));
      case 'menus':
        return retornarJSON(obterMenus());
      case 'menusCompleto':
        return retornarJSON(obterMenusCompleto());
      case 'itensPorTipo':
        return retornarJSON(obterItensPorTipo(tipo));
      default:
        return retornarJSON(erro('Ação não reconhecida'));
    }
  } catch(error) {
    Logger.log('Erro GET: ' + error.toString());
    return retornarJSON(erro('Erro: ' + error.toString()));
  }
}

// ========== FUNÇÕES DE TESTE ==========

/**
 * Função de teste principal
 * Execute com Ctrl+Enter
 * Cria as abas e adiciona dados de teste
 */
function testar() {
  Logger.log('======== TESTANDO APP FINANCEIRO ========');
  Logger.log('');
  
  // Criar abas
  Logger.log('📋 Criando planilhas...');
  const sheetEntradas = obterPlanilha('entradas');
  const sheetSaidas = obterPlanilha('saidas');
  const sheetMenus = criarAbaMenus();
  
  Logger.log('✓ Planilhas criadas: ' + sheetEntradas.getName() + ', ' + sheetSaidas.getName() + ' e ' + sheetMenus.getName());
  Logger.log('');
  
  // Teste de adição em Entradas
  Logger.log('💰 Testando Entradas...');
  const resultadoEntrada = adicionarTransacao({
    tipo: 'entradas',
    data: '2026-09-30',
    valor: 8513.37,
    metodo: 'Transferência bancária',
    categoria: 'Salário',
    descricao: 'Salário mensal',
    formaPagamento: 'À vista',
    tipoRecorrencia: 'Último útil do mês'
  });
  Logger.log('✓ Entrada adicionada');
  Logger.log('  Status: ' + resultadoEntrada.dados.mensagem);
  Logger.log('');
  
  // Teste de adição em Saídas
  Logger.log('💸 Testando Saídas...');
  const resultadoSaida = adicionarTransacao({
    tipo: 'saidas',
    data: '2026-09-05',
    valor: 344.00,
    metodo: 'Débito',
    categoria: 'Alimentação',
    descricao: 'Mercado',
    formaPagamento: 'À vista',
    tipoRecorrencia: 'Pontual'
  });
  Logger.log('✓ Saída adicionada');
  Logger.log('  Status: ' + resultadoSaida.dados.mensagem);
  Logger.log('');
  
  // Teste de listagem
  Logger.log('📊 Testando Listagem...');
  const entradas = listarTransacoes({ tipo: 'entradas', mes: 9, ano: 2026 });
  Logger.log('✓ Entradas listadas: ' + entradas.dados.total + ' transações');
  
  const saidas = listarTransacoes({ tipo: 'saidas', mes: 9, ano: 2026 });
  Logger.log('✓ Saídas listadas: ' + saidas.dados.total + ' transações');
  Logger.log('');
  
  // Teste de resumo
  Logger.log('📈 Testando Resumo...');
  const resumoSaidas = obterResumo({ tipo: 'saidas', mes: 9, ano: 2026 });
  Logger.log('✓ Resumo de Saídas:');
  Logger.log('  Total: R$ ' + resumoSaidas.dados.total);
  Logger.log('  Categorias: ' + resumoSaidas.dados.porCategoria.length);
  Logger.log('');
  
  // Teste de menus
  Logger.log('🏷️  Testando Menus...');
  const menus = obterMenus();
  Logger.log('✓ Menus carregados: ' + menus.dados.categorias.length + ' categorias');
  Logger.log('  Categorias: ' + menus.dados.categorias.join(', '));
  Logger.log('');
  
  // Teste de próximas transações
  Logger.log('⏰ Testando Próximas Transações...');
  const proximasEntradas = obterProximasTransacoes('entradas');
  Logger.log('✓ Próximas Entradas: ' + proximasEntradas.dados.total + ' transações');
  
  const proximasSaidas = obterProximasTransacoes('saidas');
  Logger.log('✓ Próximas Saídas: ' + proximasSaidas.dados.total + ' transações');
  Logger.log('');
  
  Logger.log('========== TESTES CONCLUÍDOS COM SUCESSO! ==========');
}

/**
 * Função auxiliar para debug
 * Mostra as abas e dados do Sheets
 */
function debugarPlanilhas() {
  Logger.log('🔍 DEBUG - Informações das Planilhas');
  Logger.log('');
  
  const abas = obterTodasAsAbas();
  Logger.log('Abas encontradas: ' + abas.length);
  
  abas.forEach((sheet, idx) => {
    const nome = sheet.getName();
    const linhas = sheet.getLastRow();
    Logger.log('  ' + (idx + 1) + '. ' + nome + ' (' + linhas + ' linhas)');
  });
  Logger.log('');
}

/**
 * Reseta todos os dados (mantém headers)
 * ⚠️ USE COM CUIDADO!
 */
function resetarTodosDados() {
  if (!confirm('Tem certeza que quer deletar TODOS os dados? Essa ação não pode ser desfeita!')) {
    return;
  }
  
  Logger.log('🗑️  Deletando dados...');
  
  const abas = [SHEET_ENTRADAS, SHEET_SAIDAS, SHEET_MENUS];
  
  abas.forEach(nomeAba => {
    if (deletarAba(nomeAba)) {
      Logger.log('✓ Aba ' + nomeAba + ' deletada');
    }
  });
  
  Logger.log('✓ Reset completo!');
}
