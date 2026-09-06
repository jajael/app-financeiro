/**
 * CSS - ESTRUTURA MODULAR
 * Divisão de responsabilidades por arquivo
 */

# 📋 Estrutura CSS Modular

Dividimos o arquivo `style.css` (549 linhas) em **9 arquivos especializados** para melhor manutenção e organização.

## 📂 Arquivos CSS

### 1. **variables.css** (120 linhas)
**Responsabilidade:** Centralizadas todas as variáveis CSS e temas

**Conteúdo:**
- Cores primárias e secundárias
- Tons neutros (light, dark, gray)
- Variáveis de entrada/saída/balanço
- Espaçamento (spacing-xs, sm, md, lg, xl)
- Raios de borda (radius, radius-sm, radius-xs)
- Sombras pré-definidas
- Tipografia (font-family, tamanhos, pesos)
- Transições e durações

**Uso:** Importado primeiro em `index.html` - todas as outras folhas dependem dele

```css
:root {
    --primary: #4F46E5;
    --spacing-md: 1rem;
    --radius: 12px;
}
```

**Quando editar:**
- Mudar paleta de cores
- Ajustar tamanhos padrão
- Modificar velocidades de transição

---

### 2. **base.css** (110 linhas)
**Responsabilidade:** Reset universal e estilos fundamentais

**Conteúdo:**
- Reset CSS (*{} universal)
- Estilos HTML e BODY
- Tipografia padrão (headings, paragraphs)
- Links, listas e tabelas
- Código e pré-formatação
- Scrollbar personalizada

**Uso:** Carregado após `variables.css`

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
```

**Quando editar:**
- Mudar fonte padrão
- Ajustar altura de linha
- Modificar estilos de scroll

---

### 3. **animations.css** (250 linhas)
**Responsabilidade:** Todas as animações e transições reutilizáveis

**Conteúdo:**
- Keyframes básicas (fadeIn, fadeOut, slideIn/Out, etc)
- Animações especiais (pulse, spin, bounce, shake)
- Efeitos visuais (glow, ripple, heartbeat)
- Classes utilitárias para animações
- Respeito a `prefers-reduced-motion`

**Uso:** Carregado após `base.css` para uso em todos os arquivos

```css
@keyframes slideInDown { /* ... */ }
.animate-fade-in { animation: fadeIn 0.3s ease; }
```

**Quando editar:**
- Adicionar novas animações
- Ajustar duração/velocidade
- Criar efeitos visuais especiais

---

### 4. **layout.css** (150 linhas)
**Responsabilidade:** Estrutura e organização espacial

**Conteúdo:**
- Container principal (.container)
- Header e navigation
- Main content area
- Footer
- Grid e flex utilities
- Espaçamento e margin/padding helpers

**Uso:** Define a malha estrutural da página

```css
.container { display: flex; flex-direction: column; min-height: 100vh; }
.grid-auto { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
```

**Quando editar:**
- Mudar layout geral
- Adicionar containers
- Organizar grid/flex

---

### 5. **dashboard.css** (100 linhas)
**Responsabilidade:** Cards de resumo (Entradas, Saídas, Balanço)

**Conteúdo:**
- Estilos de `.summary-card`
- Cores temáticas (entradas verde, saídas vermelha, balanço amarelo)
- Estados hover
- Animações de atualização

**Uso:** Específico para dashboard summary cards

```css
.summary-card.entradas { background-color: var(--receita-bg); }
.summary-card:hover { transform: translateY(-5px); }
```

**Quando editar:**
- Mudar cores dos cards
- Ajustar tamanho/espaçamento
- Adicionar novos cards

---

### 6. **tabs.css** (140 linhas)
**Responsabilidade:** Navegação por abas

**Conteúdo:**
- Estilos de `.tabs` container
- Botões de aba (.tab-btn)
- Estados (hover, active)
- Conteúdo das abas (.tab-content)
- Indicadores e badges
- Animações de transição entre abas

**Uso:** Para sistema de abas (Entradas, Saídas, Próximas, Adicionar)

```css
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-content { display: none; }
.tab-content.active { display: block; }
```

**Quando editar:**
- Mudar estilos das abas
- Adicionar novos indicadores
- Ajustar animações

---

### 7. **transactions.css** (180 linhas)
**Responsabilidade:** Exibição de transações (entradas e saídas)

**Conteúdo:**
- Listagem (.despesas-lista)
- Items (.despesa-item)
- Categoria e badges de recorrência
- Informações adicionais (.despesa-meta)
- Valores e descrições
- Mensagem vazia
- Estados especiais (pendente, cancelada, ativa)

**Uso:** Para exibir transações nas abas

```css
.despesa-item { display: flex; border-left: 4px solid; }
.recorrencia-badge { font-size: 0.75rem; background: var(--primary); }
```

**Quando editar:**
- Mudar aparência dos items
- Adicionar novos estados
- Ajustar layout

---

### 8. **charts.css** (180 linhas)
**Responsabilidade:** Gráficos e análise de categorias

**Conteúdo:**
- Container de gráficos (.chart-container)
- Lista de categorias (.categories-list)
- Items com barras (category-item, category-bar)
- Legendas e estatísticas
- Cores dos gráficos
- Estados e animações

**Uso:** Para aba de análise de saídas

```css
.category-item { display: flex; padding: 1rem; }
.category-bar { width: 100%; height: 6px; background: #E5E7EB; }
```

**Quando editar:**
- Mudar visualização de dados
- Adicionar novos tipos de gráficos
- Ajustar cores

---

### 9. **forms.css** (200 linhas)
**Responsabilidade:** Formulário e inputs

**Conteúdo:**
- Container (.form-transacao)
- Seletor de tipo (.tipo-selector, .tipo-btn)
- Grupos de campos (.form-row, .form-group)
- Labels e inputs
- Focus/hover states
- Sugestões de categorias
- Validação (erro estados)
- Botão de submit
- Campos condicionais (ex: parcelas)

**Uso:** Para aba "Adicionar Transação"

```css
.form-group { position: relative; }
.tipo-btn.active { background: var(--primary); }
```

**Quando editar:**
- Mudar layout do formulário
- Adicionar novos campos
- Melhorar validação visual

---

### 10. **responsive.css** (200 linhas)
**Responsabilidade:** Media queries para diferentes tamanhos de tela

**Conteúdo:**
- Tablet (768px)
- Smartphone (480px)
- Muito pequeno (<320px)
- Grande (1024px+)
- Muito grande (1440px+)
- Orientação (landscape/portrait)
- High DPI (Retina)
- Modo escuro/claro
- Reduzir movimento
- Alto contraste
- Impressão

**Uso:** Compilado em cada media query para adaptação responsiva

```css
@media (max-width: 768px) { /* Ajustes para tablet */ }
@media (max-width: 480px) { /* Ajustes para mobile */ }
```

**Quando editar:**
- Adicionar suporte para novos tamanhos
- Ajustar breakpoints
- Melhorar mobile/tablet

---

## 📊 Estrutura de Carregamento

```
index.html
├─ <link> variables.css (400 linhas totais CSS final)
├─ <link> base.css
├─ <link> animations.css
├─ <link> layout.css
├─ <link> dashboard.css
├─ <link> tabs.css
├─ <link> transactions.css
├─ <link> charts.css
├─ <link> forms.css
└─ <link> responsive.css
```

**Ordem de carregamento é crítica!**
- `variables.css` deve ser primeira (dependência de todas)
- `base.css` antes de componentes
- `responsive.css` por último (sobrescreve media queries)

---

## 🔗 Dependências Entre Arquivos

```
variables.css
    ↓
base.css, animations.css
    ↓
layout.css, dashboard.css, tabs.css
    ↓
transactions.css, charts.css, forms.css
    ↓
responsive.css (aplicável a todos)
```

---

## 💡 Boas Práticas

### Ao editar CSS:

1. **Identifique o arquivo correto:**
   - Cores? → `variables.css`
   - Reset/base? → `base.css`
   - Layout? → `layout.css`
   - Cards? → `dashboard.css`
   - Formulário? → `forms.css`

2. **Use variáveis CSS:**
   ```css
   color: var(--primary);           /* ✓ Correto */
   color: #4F46E5;                  /* ✗ Evitar hardcode */
   ```

3. **Respeite a hierarquia:**
   - Não importe entre arquivos
   - Cada arquivo é independente
   - Use apenas variáveis compartilhadas

4. **Teste responsivo:**
   - Mobile (< 480px)
   - Tablet (768px)
   - Desktop (> 1024px)

---

## 🚀 Como Adicionar Novo Estilo

### Exemplo: Novo tipo de card

1. Adicione variáveis em `variables.css`:
```css
--novo-bg: #E0F2FE;
--novo-border: #0EA5E9;
```

2. Crie estilos em `dashboard.css`:
```css
.summary-card.novo {
    background-color: var(--novo-bg);
    border-color: var(--novo-border);
}
```

3. Adicione media queries em `responsive.css`:
```css
@media (max-width: 480px) {
    .summary-card.novo { padding: 0.5rem; }
}
```

---

## 📝 Checklist ao Adicionar Novo Módulo

- [ ] Criar novo arquivo CSS (`componente.css`)
- [ ] Adicionar variáveis necessárias em `variables.css`
- [ ] Importar em `index.html` na ordem correta
- [ ] Adicionar media queries em `responsive.css`
- [ ] Testar em desktop, tablet, mobile
- [ ] Documentar no README

---

## ⚙️ Conversão do style.css Original

| Trecho Original | Arquivo Novo |
|---|---|
| `:root { ... }` | `variables.css` |
| `*, html, body { ... }` | `base.css` |
| `@keyframes { ... }` | `animations.css` |
| `.container, .header, .main` | `layout.css` |
| `.summary-card` | `dashboard.css` |
| `.tabs, .tab-btn` | `tabs.css` |
| `.despesa-item, .recorrencia-badge` | `transactions.css` |
| `.category-item, .chart-container` | `charts.css` |
| `.form-transacao, .form-group` | `forms.css` |
| Todas `@media` queries | `responsive.css` |

