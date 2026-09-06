/**
 * CONSTANTES E CONFIGURAÇÕES
 * Centraliza todos os valores fixos do sistema
 */

// ID da planilha - SUBSTITUA PELO SEU ID REAL
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Nomes das abas
const SHEET_ENTRADAS = 'Entradas';
const SHEET_SAIDAS = 'Saídas';
const SHEET_MENUS = 'menus';

// Feriados fixos do Brasil
const FERIADOS_FIXOS = [
  { mes: 1, dia: 1, nome: 'Ano Novo' },
  { mes: 4, dia: 21, nome: 'Tiradentes' },
  { mes: 5, dia: 1, nome: 'Dia do Trabalho' },
  { mes: 9, dia: 7, nome: 'Independência' },
  { mes: 10, dia: 12, nome: 'Nossa Senhora Aparecida' },
  { mes: 11, dia: 2, nome: 'Finados' },
  { mes: 11, dia: 20, nome: 'Consciência Negra' },
  { mes: 12, dia: 25, nome: 'Natal' }
];

// Feriados de 2026 (móveis e opcionais)
const FERIADOS_MOVEIS_2026 = [
  new Date(2026, 1, 10), // Sexta-feira de Carnaval
  new Date(2026, 3, 14), // Terça-feira de Páscoa
  new Date(2026, 3, 21), // Tiradentes transferido?
  new Date(2026, 4, 30), // Corpus Christi
  new Date(2026, 8, 7)   // Independência transferida?
];

// Configuração de cabeçalhos das planilhas
const SHEET_HEADERS = [
  'Data',
  'Valor',
  'Método',
  'Categoria',
  'Descrição',
  'Forma de Pagamento',
  'Tipo de Recorrência',
  'Próxima Data',
  'Status',
  'Criado em'
];

// Largura das colunas
const COLUMN_WIDTHS = {
  1: 120,  // Data
  2: 100,  // Valor
  3: 120,  // Método
  4: 130,  // Categoria
  5: 180,  // Descrição
  6: 150,  // Forma de Pagamento
  7: 150,  // Tipo de Recorrência
  8: 120,  // Próxima Data
  9: 100,  // Status
  10: 160  // Criado em
};

// Tipos de menu (para aba Menus)
const TIPOS_MENU = {
  CATEGORIA: 'Categoria',
  METODO: 'Método',
  RECORRENCIA: 'Recorrência'
};

// Cabeçalhos da aba Menus
const MENUS_HEADERS = [
  'Tipo',
  'Nome',
  'Descrição',
  'Status'
];

// Status válidos
const STATUS_VALIDOS = ['Ativo', 'Inativo'];

// Cores
const HEADER_COLOR = '#4F46E5';
const HEADER_TEXT_COLOR = 'white';
