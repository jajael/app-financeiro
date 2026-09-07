/**
 * CONFIGURAÇÕES E CONSTANTES
 * Valores imutáveis do sistema
 */

// ===== Supabase =====
// Banco de dados (substitui o Google Apps Script + Google Sheets).
// A chave abaixo é a "publishable key" (role anon) — pode ficar no front-end.
// O acesso é controlado por RLS no Supabase (ver supabase/schema.sql).
const SUPABASE_URL = 'https://lbfnjxzthbclvgnszway.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vFArls_InXSynj3uzIFNwA_RPcT-Tx7';

// Cliente global (supabase-js carregado via <script> no index.html)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Categorias padrão (fallback)
const CATEGORIAS_PADRAO = {
  entradas: [
    'Salário',
    'Bônus',
    '13º',
    'PL',
    'Freelance',
    'Devolução'
  ],
  saidas: [
    'Alimentação',
    'Alimentação app',
    'Assinaturas',
    'Contas',
    'Compras',
    'Compras online',
    'Lazer',
    'Mercado',
    'Saúde',
    'Serviços',
    'Transporte app',
    'Transporte'
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
    bg: 'var(--despesa-bg)',
    border: 'var(--despesa-border)',
    color: 'var(--despesa-text)'
  },
  positivo: {
    bg: 'var(--receita-bg)',
    border: 'var(--receita-border)',
    color: 'var(--receita-text)'
  },
  neutro: {
    bg: 'var(--balanco-bg)',
    border: 'var(--balanco-border)',
    color: 'var(--balanco-text)'
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
