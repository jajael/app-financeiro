# 📊 Estrutura de Dados do App Financeiro v2.0

## 📑 Abas no Google Sheets

Seu Google Sheets terá **2 abas**:

### 1️⃣ **Aba: ENTRADAS**

| Data | Valor | Método | Categoria | Descrição | Forma de Pagamento | Tipo de Recorrência | Próxima Data | Status | Criado em |
|------|-------|--------|-----------|-----------|-------------------|-------------------|--------------|--------|-----------|
| 2026-09-30 | 8513.37 | Transferência | Salário | Salário mensal | À vista | Último útil do mês | 2026-10-31 | Ativa | 2026-09-05 10:30:45 |
| 2026-09-15 | 500.00 | PIX | Freelance | Projeto finalizado | À vista | Pontual | | Ativa | 2026-09-15 14:22:10 |

### 2️⃣ **Aba: SAÍDAS**

| Data | Valor | Método | Categoria | Descrição | Forma de Pagamento | Tipo de Recorrência | Próxima Data | Status | Criado em |
|------|-------|--------|-----------|-----------|-------------------|-------------------|--------------|--------|-----------|
| 2026-09-05 | 344.00 | Débito | Alimentação | Mercado | À vista | Pontual | | Ativa | 2026-09-05 08:15:22 |
| 2026-09-03 | 229.80 | PIX | Transporte app | Uber | À vista | Pontual | | Ativa | 2026-09-03 19:45:33 |
| 2026-09-01 | 3280.25 | Débito | Casa | Condomínio | À vista | Mensal | 2026-10-01 | Ativa | 2026-09-01 06:00:00 |
| 2026-09-10 | 150.00 | Crédito | Compras | Roupas | Parcela 1/3 | Parcelada | 2026-10-10 | Ativa | 2026-09-10 11:30:22 |

---

## 🔑 Definições de Colunas

### **Data**
- Formato: YYYY-MM-DD (ex: 2026-09-05)
- Obrigatório ✓
- Editável ✓

### **Valor**
- Números com até 2 casas decimais
- Sempre positivo (não use - para saídas)
- Obrigatório ✓
- Editável ✓

### **Método**
- Opções: Débito, Crédito, PIX, Dinheiro, Transferência
- Obrigatório ✓
- Editável ✓

### **Categoria**
- Livremente definida pelo usuário
- Exemplos de Entradas:
  - Salário
  - Freelance
  - Investimento
  - Bônus
  - Outro
- Exemplos de Saídas:
  - Alimentação
  - Casa
  - Transporte
  - Lazer
  - Saúde
  - Etc
- Obrigatório ✓
- Editável ✓

### **Descrição**
- Texto livre, opcional
- Exemplo: "Compra no Carrefour", "Salário mensal", "Taxa de condomínio"
- Opcional (pode ser vazio)
- Editável ✓

### **Forma de Pagamento**
- **À vista**: Pagamento único
- **Parcelada**: Como "Parcela 1/12", "Parcela 2/12", etc
- Padrão: À vista
- Obrigatório ✓
- Editável ✓

### **Tipo de Recorrência**
- **Pontual**: Acontece apenas uma vez
- **Mensal**: Repete no mesmo dia do mês seguinte
- **Último útil do mês**: Repete no último dia útil (seg-sex, sem feriados) do mês
- **Vencimento**: Repete em data fixa (ex: dia 15 é boleto)
- **Parcelada**: Repete conforme número de parcelas
- Padrão: Pontual
- Obrigatório ✓
- Editável ✓

### **Próxima Data**
- Calculada automaticamente com base no tipo de recorrência
- Formato: YYYY-MM-DD
- Vazio se Pontual
- Automática (não editar manualmente)

### **Status**
- Valores: Ativa, Inativa, Pausada
- Padrão: Ativa
- Para pausar uma recorrência, mude para "Inativa"
- Editável ✓

### **Criado em**
- Timestamp de criação
- Formato: YYYY-MM-DD HH:MM:SS
- Automático (gerado pelo Apps Script)
- Não editável

---

## 🔄 Fluxo de Recorrência

### Exemplo: Salário - Último útil do mês

1. **Usuário adiciona:**
   - Data: 2026-09-30 (último dia útil de setembro)
   - Tipo de Recorrência: "Último útil do mês"

2. **Apps Script calcula:**
   - 2026-10-31 é domingo → volta para 2026-10-30 (sexta)
   - 2026-10-30 é dia útil ✓
   - Próxima Data = 2026-10-30

3. **Resultado:** A transação se repete automaticamente no último dia útil de cada mês

---

## 📱 Integração Frontend

### Quando o usuário adiciona uma transação:

```javascript
{
  acao: "adicionar",
  tipo: "entradas",              // "entradas" ou "saidas"
  data: "2026-09-05",
  valor: 100,                    // Sempre positivo
  metodo: "PIX",
  categoria: "Freelance",
  formaPagamento: "À vista",
  tipoRecorrencia: "Pontual",
  descricao: "Projeto finalizado"
}
```

### O Google Apps Script:
1. Valida os dados
2. Calcula a próxima data
3. Adiciona a linha na planilha
4. Retorna confirmação

### O Frontend:
1. Recebe confirmação
2. Mostra notificação de sucesso
3. Recarrega os dados
4. Atualiza a interface

---

## 🎯 Dicas de Uso

### ✅ Boas práticas:
- Adicione categorias consistentes (o app sugere baseado no histórico)
- Use nomes descritivos: "Uber para trabalho" em vez de só "Transporte"
- Para parceladas, deixe a data da primeira parcela e o app calcula o resto
- Revise as próximas transações semanalmente

### ❌ Evite:
- Não edite manualmente a coluna "Próxima Data" (o app calcula)
- Não adicione valores negativos
- Não crie categorias com nomes muito variados (dificulta análise)
- Não deixe a descrição vazia para transações importantes

---

## 🔍 Consultando os Dados

### Via Frontend:
- **Dashboard**: Resumo do mês (Entradas, Saídas, Balanço)
- **Abas Entradas/Saídas**: Lista do mês com filtro
- **Próximas**: O que vem nos próximos 30 dias
- **Análise**: Gráfico de despesas por categoria (só em Saídas)

### Via Google Sheets:
- Abra o Sheets diretamente para ver/editar tudo
- Filtros automáticos nos cabeçalhos
- Pode adicionar fórmulas customizadas

---

**Última atualização: 2026-09-05** | **Versão: 2.0**
