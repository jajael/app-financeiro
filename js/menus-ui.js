/**
 * UI DE MENUS
 * Renderização e gerenciamento visual da aba de menus
 */

/**
 * Carrega e renderiza a aba de menus
 */
async function carregarAbaMenus() {
  const menus = await carregarMenusCompleto();
  
  if (!menus) {
    document.querySelector(SELECTORS.menusContainer).innerHTML = 
      '<p class="empty-state">Erro ao carregar menus</p>';
    return;
  }
  
  let html = `
    <div class="menus-gerenciamento">
      <!-- Categorias -->
      <div class="menu-section">
        <h3>📂 Categorias</h3>
        <div class="menu-list" id="categoriasList"></div>
        <div class="add-item-form">
          <input type="text" id="novaCategoriaInput" placeholder="Nova categoria...">
          <input type="text" id="novaCategoriDescInput" placeholder="Descrição...">
          <button onclick="adicionarNovaCategoria()" class="btn-add">+ Adicionar</button>
        </div>
      </div>
      
      <!-- Métodos -->
      <div class="menu-section">
        <h3>💳 Métodos de Pagamento</h3>
        <div class="menu-list" id="metodosList"></div>
        <div class="add-item-form">
          <input type="text" id="novoMetodoInput" placeholder="Novo método...">
          <input type="text" id="novoMetodoDescInput" placeholder="Descrição...">
          <button onclick="adicionarNovoMetodo()" class="btn-add">+ Adicionar</button>
        </div>
      </div>
      
      <!-- Recorrências -->
      <div class="menu-section">
        <h3>🔁 Tipos de Recorrência</h3>
        <div class="menu-list" id="recorrenciasList"></div>
        <div class="add-item-form">
          <input type="text" id="novaRecorrenciaInput" placeholder="Nova recorrência...">
          <input type="text" id="novaRecorrenciaDescInput" placeholder="Descrição...">
          <button onclick="adicionarNovaRecorrencia()" class="btn-add">+ Adicionar</button>
        </div>
      </div>
    </div>
  `;
  
  document.querySelector(SELECTORS.menusContainer).innerHTML = html;
  
  // Renderizar itens de cada seção
  renderizarItemsMenu('Categoria', 'categoriasList', menus.categorias);
  renderizarItemsMenu('Método', 'metodosList', menus.metodos);
  renderizarItemsMenu('Recorrência', 'recorrenciasList', menus.recorrencias);
}

/**
 * Renderiza os itens de um tipo de menu
 */
function renderizarItemsMenu(tipo, containerId, itens) {
  const container = document.getElementById(containerId);
  
  if (!itens || itens.length === 0) {
    container.innerHTML = `<p class="empty-text">Nenhum ${tipo.toLowerCase()} cadastrado</p>`;
    return;
  }
  
  let html = '';
  
  itens.forEach(item => {
    const statusClass = item.status === 'Ativo' ? 'ativo' : 'inativo';
    const statusLabel = item.status === 'Ativo' ? '✓ Ativo' : '✗ Inativo';
    
    html += `
      <div class="menu-item ${statusClass}">
        <div class="item-info">
          <div class="item-nome">${item.nome}</div>
          <div class="item-descricao">${item.descricao || '-'}</div>
        </div>
        <div class="item-status">${statusLabel}</div>
        <div class="item-actions">
          <button class="btn-icon" onclick="editarItemMenuUI(${item.linha}, '${tipo}')" title="Editar">✏️</button>
          ${item.status === 'Ativo' 
            ? `<button class="btn-icon btn-warning" onclick="desativarItemMenuUI(${item.linha})" title="Desativar">⊘</button>` 
            : `<button class="btn-icon btn-success" onclick="ativarItemMenuUI(${item.linha})" title="Ativar">↻</button>`}
          <button class="btn-icon btn-danger" onclick="removerItemMenuUI(${item.linha})" title="Remover">🗑️</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Adiciona nova categoria
 */
async function adicionarNovaCategoria() {
  const nome = document.getElementById('novaCategoriaInput').value.trim();
  const descricao = document.getElementById('novaCategoriDescInput').value.trim();
  
  if (!nome) {
    mostrarNotificacao('Digite o nome da categoria', 'aviso');
    return;
  }
  
  const sucesso = await adicionarItemMenuAPI('Categoria', nome, descricao);
  
  if (sucesso) {
    document.getElementById('novaCategoriaInput').value = '';
    document.getElementById('novaCategoriDescInput').value = '';
    await carregarAbaMenus();
  }
}

/**
 * Adiciona novo método
 */
async function adicionarNovoMetodo() {
  const nome = document.getElementById('novoMetodoInput').value.trim();
  const descricao = document.getElementById('novoMetodoDescInput').value.trim();
  
  if (!nome) {
    mostrarNotificacao('Digite o nome do método', 'aviso');
    return;
  }
  
  const sucesso = await adicionarItemMenuAPI('Método', nome, descricao);
  
  if (sucesso) {
    document.getElementById('novoMetodoInput').value = '';
    document.getElementById('novoMetodoDescInput').value = '';
    await carregarAbaMenus();
  }
}

/**
 * Adiciona nova recorrência
 */
async function adicionarNovaRecorrencia() {
  const nome = document.getElementById('novaRecorrenciaInput').value.trim();
  const descricao = document.getElementById('novaRecorrenciaDescInput').value.trim();
  
  if (!nome) {
    mostrarNotificacao('Digite o nome da recorrência', 'aviso');
    return;
  }
  
  const sucesso = await adicionarItemMenuAPI('Recorrência', nome, descricao);
  
  if (sucesso) {
    document.getElementById('novaRecorrenciaInput').value = '';
    document.getElementById('novaRecorrenciaDescInput').value = '';
    await carregarAbaMenus();
  }
}

/**
 * Interface para editar item (modal simples)
 */
async function editarItemMenuUI(linha, tipo) {
  const novoNome = prompt(`Editar ${tipo}:`, '');
  
  if (novoNome === null || novoNome.trim() === '') {
    return; // Usuário cancelou
  }
  
  const novaDescricao = prompt('Descrição (opcional):', '');
  
  const sucesso = await editarItemMenuAPI(linha, novoNome, novaDescricao || '', 'Ativo');
  
  if (sucesso) {
    await carregarAbaMenus();
  }
}

/**
 * Desativa um item
 */
async function desativarItemMenuUI(linha) {
  if (!confirm('Tem certeza que deseja desativar este item?')) {
    return;
  }
  
  const sucesso = await desativarItemMenuAPI(linha);
  
  if (sucesso) {
    await carregarAbaMenus();
  }
}

/**
 * Ativa um item
 */
async function ativarItemMenuUI(linha) {
  const sucesso = await ativarItemMenuAPI(linha);
  
  if (sucesso) {
    await carregarAbaMenus();
  }
}

/**
 * Remove um item
 */
async function removerItemMenuUI(linha) {
  if (!confirm('Tem certeza que deseja REMOVER este item? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  const sucesso = await removerItemMenuAPI(linha);
  
  if (sucesso) {
    await carregarAbaMenus();
  }
}
