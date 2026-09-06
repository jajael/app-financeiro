/**
 * MANIPULAÇÃO DE PLANILHAS
 * Funções para criar e obter sheets
 */

/**
 * Obtém ou cria uma planilha de transações
 * Inicializa com headers e formatação se não existir
 */
function obterPlanilha(tipo) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const nomeAba = tipo === 'saidas' ? SHEET_SAIDAS : SHEET_ENTRADAS;
  
  let sheet = spreadsheet.getSheetByName(nomeAba);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(nomeAba);
    inicializarPlanilha(sheet);
  }
  
  return sheet;
}

/**
 * Inicializa uma planilha com headers e formatação
 */
function inicializarPlanilha(sheet) {
  // Adicionar headers
  sheet.appendRow(SHEET_HEADERS);
  
  // Formatar cabeçalho
  const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  headerRange.setBackground(HEADER_COLOR);
  headerRange.setFontColor(HEADER_TEXT_COLOR);
  headerRange.setFontWeight('bold');
  
  // Definir largura das colunas
  Object.keys(COLUMN_WIDTHS).forEach(colIndex => {
    sheet.setColumnWidth(parseInt(colIndex), COLUMN_WIDTHS[colIndex]);
  });
}

/**
 * Obtém ou cria a planilha de menus
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
 * Inicializa a planilha de menus com headers
 */
function inicializarPlanilhaMenus(sheet) {
  sheet.appendRow(['Tags', 'Métodos de pagamento']);
  
  // Formatar cabeçalho
  const headerRange = sheet.getRange(1, 1, 1, 2);
  headerRange.setBackground(HEADER_COLOR);
  headerRange.setFontColor(HEADER_TEXT_COLOR);
  headerRange.setFontWeight('bold');
  
  // Largura das colunas
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 200);
}

/**
 * Retorna todas as abas da planilha
 */
function obterTodasAsAbas() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  return spreadsheet.getSheets();
}

/**
 * Deleta uma aba da planilha
 */
function deletarAba(nomeAba) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(nomeAba);
  
  if (sheet) {
    spreadsheet.deleteSheet(sheet);
    return true;
  }
  
  return false;
}
