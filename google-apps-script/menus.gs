/**
 * MENUS DINÂMICOS v2.0
 * Gerenciamento de Categorias, Métodos e Tipos de Recorrência
 * 
 * Estrutura da aba Menus:
 * Col A: Tipo (Categoria, Método, Recorrência)
 * Col B: Nome (nome da opção)
 * Col C: Descrição (notas/help)
 * Col D: Status (Ativo/Inativo)
 */

/**
 * Obtém planilha de menus
 */
function obterPlanilhaMenus() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_MENUS);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_MENUS);
    inicializarPlanilhaMenus(sheet);
  }
  
  return sheet;
}

/**
 * Inicializa a aba de menus com headers e dados padrão
 */
function inicializarPlanilhaMenus(sheet) {
  // Adicionar headers
  sheet.appendRow(MENUS_HEADERS);
  
  // Dados padrão
  const dadosPadrao = [
    // Categorias
    [TIPOS_MENU.CATEGORIA, 'Alimentação', 'Despesas com comida e bebida', 'Ativo'],
    [TIPOS_MENU.CATEGORIA, 'Casa', 'Despesas da residência', 'Ativo'],
    [TIPOS_MENU.CATEGORIA, 'Lazer', 'Entretenimento e diversão', 'Ativo'],
    [TIPOS_MENU.CATEGORIA, 'Saúde', 'Médico, farmácia, academia', 'Ativo'],
    [TIPOS_MENU.CATEGORIA, 'Transporte', 'Uber, ônibus, gasolina', 'Ativo'],
    [TIPOS_MENU.CATEGORIA, 'Compras', 'Roupas, eletrônicos, etc', 'Ativo'],
    [TIPOS_MENU.CATEGORIA, 'Serviços', 'Consertos, manutenção', 'Ativo'],
    [TIPOS_MENU.CATEGORIA, 'Outros', 'Outras despesas', 'Ativo'],
    
    // Métodos/Formas de Pagamento
    [TIPOS_MENU.METODO, 'Pix', 'Transferência Pix', 'Ativo'],
    [TIPOS_MENU.METODO, 'Cartão Crédito', 'Pagamento com cartão de crédito', 'Ativo'],
    [TIPOS_MENU.METODO, 'Cartão Débito', 'Pagamento com cartão de débito', 'Ativo'],
    [TIPOS_MENU.METODO, 'Dinheiro', 'Pagamento em espécie', 'Ativo'],
    [TIPOS_MENU.METODO, 'Boleto', 'Pagamento por boleto', 'Ativo'],
    [TIPOS_MENU.METODO, 'Transferência', 'Transferência bancária', 'Ativo'],
    
    // Tipos de Recorrência
    [TIPOS_MENU.RECORRENCIA, 'Pontual', 'Uma única vez, sem repetição', 'Ativo'],
    [TIPOS_MENU.RECORRENCIA, 'Mensal', 'Se repete todo mês', 'Ativo'],
    [TIPOS_MENU.RECORRENCIA, 'Último Útil', 'Último dia útil do mês', 'Ativo'],
    [TIPOS_MENU.RECORRENCIA, 'Vencimento', 'Data de vencimento fixa', 'Ativo'],
    [TIPOS_MENU.RECORRENCIA, 'Parcelada', 'Em várias parcelas', 'Ativo']
  ];
  
  dadosPadrao.forEach(linha => sheet.appendRow(linha));
  
  // Formatar headers
  const headerRange = sheet.getRange(1, 1, 1, 4);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4F46E5');
  headerRange.setFontColor('#FFFFFF');
  
  // Ajustar largura das colunas
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 250);
  sheet.setColumnWidth(4, 100);
}

/**
 * Obtém todos os menus agrupados por tipo
 * Retorna: { categorias: [], metodos: [], recorrencias: [] }
 */
function obterMenus() {
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  const menus = {
    categorias: [],
    metodos: [],
    recorrencias: []
  };
  
  // Pular header (linha 1)
  for (let i = 1; i < dados.length; i++) {
    const tipo = dados[i][0] ? dados[i][0].toString().trim() : '';
    const nome = dados[i][1] ? dados[i][1].toString().trim() : '';
    const descricao = dados[i][2] ? dados[i][2].toString().trim() : '';
    const status = dados[i][3] ? dados[i][3].toString().trim() : 'Ativo';
    
    // Só incluir se estiver ativo
    if (status !== 'Ativo' || !nome) continue;
    
    const item = {
      nome: nome,
      descricao: descricao
    };
    
    if (tipo === TIPOS_MENU.CATEGORIA) {
      menus.categorias.push(nome);
    } else if (tipo === TIPOS_MENU.METODO) {
      menus.metodos.push(nome);
    } else if (tipo === TIPOS_MENU.RECORRENCIA) {
      menus.recorrencias.push(nome);
    }
  }
  
  // Ordenar listas
  menus.categorias.sort();
  menus.metodos.sort();
  menus.recorrencias.sort();
  
  return sucesso(menus);
}

/**
 * Obtém menus completos COM descrições (para aba de gerenciamento)
 */
function obterMenusCompleto() {
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  const menus = {
    categorias: [],
    metodos: [],
    recorrencias: []
  };
  
  // Pular header
  for (let i = 1; i < dados.length; i++) {
    const tipo = dados[i][0] ? dados[i][0].toString().trim() : '';
    const nome = dados[i][1] ? dados[i][1].toString().trim() : '';
    const descricao = dados[i][2] ? dados[i][2].toString().trim() : '';
    const status = dados[i][3] ? dados[i][3].toString().trim() : 'Ativo';
    
    if (!nome) continue;
    
    const item = {
      nome: nome,
      descricao: descricao,
      status: status,
      linha: i + 1 // Linha na planilha (para edição/exclusão)
    };
    
    if (tipo === TIPOS_MENU.CATEGORIA) {
      menus.categorias.push(item);
    } else if (tipo === TIPOS_MENU.METODO) {
      menus.metodos.push(item);
    } else if (tipo === TIPOS_MENU.RECORRENCIA) {
      menus.recorrencias.push(item);
    }
  }
  
  return sucesso(menus);
}

/**
 * Adiciona novo item ao menu
 * @param {string} tipo - Tipo (Categoria, Método, Recorrência)
 * @param {string} nome - Nome do item
 * @param {string} descricao - Descrição/notas
 * @returns {object} Resultado da operação
 */
function adicionarItemMenu(tipo, nome, descricao = '') {
  // Validar inputs
  if (!nome || nome.trim() === '') {
    return erro('Nome não pode estar vazio');
  }
  
  if (!Object.values(TIPOS_MENU).includes(tipo)) {
    return erro('Tipo inválido. Use: ' + Object.values(TIPOS_MENU).join(', '));
  }
  
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  // Verificar se já existe
  for (let i = 1; i < dados.length; i++) {
    const tipoExistente = dados[i][0] ? dados[i][0].toString().trim() : '';
    const nomeExistente = dados[i][1] ? dados[i][1].toString().trim() : '';
    
    if (tipoExistente === tipo && nomeExistente === nome) {
      return erro(`${nome} já existe em ${tipo}`);
    }
  }
  
  // Adicionar nova linha
  sheet.appendRow([tipo, nome, descricao, 'Ativo']);
  
  return sucesso({
    mensagem: `${nome} adicionado com sucesso em ${tipo}`,
    tipo: tipo,
    nome: nome
  });
}

/**
 * Edita um item existente do menu
 * @param {number} linha - Número da linha na planilha
 * @param {string} novoNome - Novo nome
 * @param {string} novaDescricao - Nova descrição
 * @param {string} novoStatus - Novo status (Ativo/Inativo)
 */
function editarItemMenu(linha, novoNome, novaDescricao = '', novoStatus = 'Ativo') {
  if (!novoNome || novoNome.trim() === '') {
    return erro('Nome não pode estar vazio');
  }
  
  if (!STATUS_VALIDOS.includes(novoStatus)) {
    return erro('Status inválido. Use: ' + STATUS_VALIDOS.join(', '));
  }
  
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  // Validar linha
  if (linha < 2 || linha > dados.length) {
    return erro('Linha inválida');
  }
  
  // Atualizar
  sheet.getRange(linha, 2).setValue(novoNome);        // Col B: Nome
  sheet.getRange(linha, 3).setValue(novaDescricao);   // Col C: Descrição
  sheet.getRange(linha, 4).setValue(novoStatus);      // Col D: Status
  
  return sucesso({
    mensagem: 'Item atualizado com sucesso',
    nome: novoNome,
    status: novoStatus
  });
}

/**
 * Remove um item do menu (deleta a linha)
 * @param {number} linha - Número da linha na planilha
 */
function removerItemMenu(linha) {
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  // Validar linha (não pode remover header)
  if (linha < 2 || linha > dados.length) {
    return erro('Linha inválida');
  }
  
  const nome = dados[linha - 1][1];
  
  // Deletar linha
  sheet.deleteRow(linha);
  
  return sucesso({
    mensagem: `${nome} removido com sucesso`
  });
}

/**
 * Desativa um item (muda status para Inativo)
 * Alternativa mais segura ao remover
 */
function desativarItemMenu(linha) {
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  if (linha < 2 || linha > dados.length) {
    return erro('Linha inválida');
  }
  
  const nome = dados[linha - 1][1];
  sheet.getRange(linha, 4).setValue('Inativo');
  
  return sucesso({
    mensagem: `${nome} desativado com sucesso`
  });
}

/**
 * Ativa um item desativado
 */
function ativarItemMenu(linha) {
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  if (linha < 2 || linha > dados.length) {
    return erro('Linha inválida');
  }
  
  const nome = dados[linha - 1][1];
  sheet.getRange(linha, 4).setValue('Ativo');
  
  return sucesso({
    mensagem: `${nome} ativado com sucesso`
  });
}

/**
 * Obtém todos os itens de um tipo específico (incluindo inativos)
 */
function obterItensPorTipo(tipo) {
  if (!Object.values(TIPOS_MENU).includes(tipo)) {
    return erro('Tipo inválido');
  }
  
  const sheet = obterPlanilhaMenus();
  const dados = sheet.getDataRange().getValues();
  
  const itens = [];
  
  for (let i = 1; i < dados.length; i++) {
    const tipoItem = dados[i][0] ? dados[i][0].toString().trim() : '';
    
    if (tipoItem === tipo) {
      itens.push({
        nome: dados[i][1] ? dados[i][1].toString().trim() : '',
        descricao: dados[i][2] ? dados[i][2].toString().trim() : '',
        status: dados[i][3] ? dados[i][3].toString().trim() : 'Ativo',
        linha: i + 1
      });
    }
  }
  
  return sucesso({
    tipo: tipo,
    itens: itens,
    total: itens.length
  });
}
