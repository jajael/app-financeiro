/**
 * ARQUIVO DE CONFIGURAÇÃO
 * Copie este arquivo e o renomeie para config.js
 * Depois atualize as variáveis com seus dados
 */

// ========== CONFIGURAÇÃO PRINCIPAL ==========

// URL do Google Apps Script deployado
// Substitua pela URL que você recebeu ao fazer o deploy
const CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/usercopy',
    
    // Nome da aba no Google Sheets onde os dados serão salvos
    SHEET_NAME: 'Transações',
    
    // Categorias padrão sugeridas
    CATEGORIAS: [
        'Alimentação',
        'Alimentação app',
        'Assinatura',
        'Bebida alcoólica',
        'Casa',
        'Compras',
        'Compras online',
        'Lazer',
        'Mercado',
        'Nelson',
        'Outros',
        'Saúde',
        'Serviços',
        'Transporte app',
        'Transporte público'
    ],
    
    // Cores para o gráfico de análise
    CORES_GRAFICO: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
        '#F1948A', '#85C1E2', '#F8B195', '#C39BD3', '#F1948A'
    ],
    
    // Configurações de tema
    TEMA: {
        cor_primaria: '#4F46E5',
        cor_sucesso: '#10B981',
        cor_perigo: '#EF4444',
        cor_aviso: '#F59E0B'
    },
    
    // Configurações de moeda
    MOEDA: 'BRL', // Real Brasileiro
    LOCALE: 'pt-BR'
};

// ========== COMO USAR ==========
/*
1. Salve este arquivo como config.js na mesma pasta que app.js

2. Em app.js, adicione antes do resto do código:
   <script src="js/config.js"></script>

3. Atualize as variáveis constantes em app.js para usar CONFIG:
   
   Mude de:
   const CATEGORIAS_SUGERIDAS = [...]
   
   Para:
   const CATEGORIAS_SUGERIDAS = CONFIG.CATEGORIAS;
   
4. Atualize SCRIPT_URL em app.js:
   
   Mude de:
   const SCRIPT_URL = 'YOUR_SCRIPT_URL'
   
   Para:
   const SCRIPT_URL = CONFIG.SCRIPT_URL

5. Salve app.js
*/

// ========== INSTRUÇÕES DE PREENCHIMENTO ==========
/*
SCRIPT_URL:
- Vá em https://script.google.com
- Abra seu projeto do Apps Script
- Clique em "Deploy" → selecione a versão atual
- Copie a URL que aparece em "URL de nova versão"
- A URL deve parecer com:
  https://script.google.com/macros/s/AKfycbzXXXXXXXXXXXXXXXXXXXXXX/usercopy
- Cole esta URL aqui

SHEET_NAME:
- Se mudou o nome da aba no Google Sheets, atualize aqui
- Padrão: 'Transações'

CATEGORIAS:
- Adicione suas categorias favoritas
- Estas serão sugeridas quando adicionar transações
- Baseie-se na sua planilha original

CORES_GRAFICO:
- Cores em hexadecimal (#RRGGBB)
- Uma cor para cada categoria
- Adicione mais cores se tiver muitas categorias

TEMA:
- Cores globais do app
- Mude se quiser um esquema de cores diferente

MOEDA:
- BRL = Real Brasileiro
- USD = Dólar Americano
- EUR = Euro
- Etc...
*/
