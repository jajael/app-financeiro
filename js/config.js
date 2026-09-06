/**
 * CONFIGURAÇÕES E CONSTANTES
 * Valores imutáveis do sistema
 */

// API
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxl93sA4_Mr-N3L9MBH06p479jLRgS7zXumxnYejjII0hQkNiTF9oslUqAxChUCqXN6/exec';

// Categorias padrão (fallback)
const CATEGORIAS_PADRAO = {
  entradas: [
    'Salário',
    'Freelance',
    'Investimento',
    'Bônus',
    'Devolução',
    'Outro'
  ],
  saidas: [
    'Alimentação',
    'Alimentação app',
    'Assinatura',
    'Bebida alcoólica',
    'Casa',
    'Compras',
    'Compras online',
    'Lazer',
    'Mercado',
    'Saúde',
    'Serviços',
    'Transporte app',
    'Transporte público',
    'Outro'
  ]
};

// Cores para o gráfico
const CORES_CATEGORIAS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
    '#F1948A', '#85C1E2', '#F8B195', '#C39BD3', '#F1948A'
];

// Temas de cores para balanço
const TEMAS_BALANCO = {
  negativo: {
    bg: '#FEE2E2',
    border: '#FECACA',
    color: '#991B1B'
  },
  positivo: {
    bg: '#DCFCE7',
    border: '#86EFAC',
    color: '#166534'
  },
  neutro: {
    bg: '#FEF3C7',
    border: '#FCD34D',
    color: '#B45309'
  }
};

// Seletores do DOM (centralizados)
const SELECTORS = {
  // Headers
  currentMonth: '#currentMonth',
  
  // Resumo
  totalEntradas: '#totalEntradas',
  totalSaidas: '#totalSaidas',
  balanco: '#balanco',
  
  // Navegação
  prevMonth: '#prevMonth',
  nextMonth: '#nextMonth',
  
  // Abas
  tabButtons: '.tab-btn',
  tabContents: '.tab-content',
  
  // Tipo
  tipoButtons: '.tipo-btn',
  tipoTransacao: '#tipoTransacao',
  
  // Listas
  entradasLista: '#entradasLista',
  saidasLista: '#saidasLista',
  proximasLista: '#proximasLista',
  categoriesList: '#categoriesList',
  menusContainer: '#menusContainer',
  
  // Formulário
  formTransacao: '#formTransacao',
  data: '#data',
  valor: '#valor',
  metodo: '#metodo',
  categoria: '#categoria',
  formaPagamento: '#formaPagamento',
  parceleGroup: '#parceleGroup',
  tipoRecorrencia: '#tipoRecorrencia',
  descricao: '#descricao',
  categoriaSugestoes: '#categoriaSugestoes'
};

// Configurações de UI
const CONFIG = {
  NOTIFICACAO_DURACAO: 3000,
  ANIMACAO_DURACAO: 300,
  DIAS_PROXIMOS: 30
};
