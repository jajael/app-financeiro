/**
 * API DE MENUS
 * Chamadas Fetch para gerenciar categorias, métodos e recorrências
 */

/**
 * Carrega todos os menus completos (com descrições e status)
 * Para a aba de gerenciamento
 */
async function carregarMenusCompleto() {
  try {
    const url = SCRIPT_URL + '?acao=menusCompleto';
    const response = await fetch(url);
    const resultado = await response.json();
    
    if (resultado.status === 'sucesso') {
      return resultado.dados;
    } else {
      console.error('Erro ao carregar menus:', resultado.mensagem);
      mostrarNotificacao('Erro ao carregar menus', 'erro');
      return null;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    mostrarNotificacao('Erro de conexão ao carregar menus', 'erro');
    return null;
  }
}

/**
 * Obtém itens de um tipo específico
 * @param {string} tipo - 'Categoria', 'Método' ou 'Recorrência'
 */
async function obterItensPorTipo(tipo) {
  try {
    const url = SCRIPT_URL + `?acao=itensPorTipo&tipo=${encodeURIComponent(tipo)}`;
    const response = await fetch(url);
    const resultado = await response.json();
    
    if (resultado.status === 'sucesso') {
      return resultado.dados;
    } else {
      console.error('Erro ao obter itens:', resultado.mensagem);
      return null;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    return null;
  }
}

/**
 * Adiciona novo item ao menu
 * @param {string} tipo - 'Categoria', 'Método' ou 'Recorrência'
 * @param {string} nome - Nome do item
 * @param {string} descricao - Descrição do item
 */
async function adicionarItemMenuAPI(tipo, nome, descricao = '') {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      payload: JSON.stringify({
        acao: 'adicionarItemMenu',
        tipo: tipo,
        nome: nome,
        descricao: descricao
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.status === 'sucesso') {
      mostrarNotificacao(`${nome} adicionado com sucesso!`, 'sucesso');
      return true;
    } else {
      mostrarNotificacao(`Erro: ${resultado.mensagem}`, 'erro');
      return false;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    mostrarNotificacao('Erro ao adicionar item', 'erro');
    return false;
  }
}

/**
 * Edita um item existente
 * @param {number} linha - Número da linha na planilha
 * @param {string} novoNome - Novo nome
 * @param {string} novaDescricao - Nova descrição
 * @param {string} novoStatus - 'Ativo' ou 'Inativo'
 */
async function editarItemMenuAPI(linha, novoNome, novaDescricao = '', novoStatus = 'Ativo') {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      payload: JSON.stringify({
        acao: 'editarItemMenu',
        linha: linha,
        nome: novoNome,
        descricao: novaDescricao,
        status: novoStatus
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.status === 'sucesso') {
      mostrarNotificacao('Item atualizado com sucesso!', 'sucesso');
      return true;
    } else {
      mostrarNotificacao(`Erro: ${resultado.mensagem}`, 'erro');
      return false;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    mostrarNotificacao('Erro ao atualizar item', 'erro');
    return false;
  }
}

/**
 * Remove um item do menu (deleta a linha)
 * @param {number} linha - Número da linha
 */
async function removerItemMenuAPI(linha) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      payload: JSON.stringify({
        acao: 'removerItemMenu',
        linha: linha
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.status === 'sucesso') {
      mostrarNotificacao('Item removido com sucesso!', 'sucesso');
      return true;
    } else {
      mostrarNotificacao(`Erro: ${resultado.mensagem}`, 'erro');
      return false;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    mostrarNotificacao('Erro ao remover item', 'erro');
    return false;
  }
}

/**
 * Desativa um item (mais seguro que remover)
 * @param {number} linha - Número da linha
 */
async function desativarItemMenuAPI(linha) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      payload: JSON.stringify({
        acao: 'desativarItemMenu',
        linha: linha
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.status === 'sucesso') {
      mostrarNotificacao('Item desativado com sucesso!', 'sucesso');
      return true;
    } else {
      mostrarNotificacao(`Erro: ${resultado.mensagem}`, 'erro');
      return false;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    mostrarNotificacao('Erro ao desativar item', 'erro');
    return false;
  }
}

/**
 * Ativa um item desativado
 * @param {number} linha - Número da linha
 */
async function ativarItemMenuAPI(linha) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      payload: JSON.stringify({
        acao: 'ativarItemMenu',
        linha: linha
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.status === 'sucesso') {
      mostrarNotificacao('Item ativado com sucesso!', 'sucesso');
      return true;
    } else {
      mostrarNotificacao(`Erro: ${resultado.mensagem}`, 'erro');
      return false;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    mostrarNotificacao('Erro ao ativar item', 'erro');
    return false;
  }
}
