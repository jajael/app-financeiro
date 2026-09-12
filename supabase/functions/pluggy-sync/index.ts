// Edge Function: pluggy-sync
//
// Botão manual "Sincronizar agora": busca transações novas em todas as
// contas conectadas (ativas) do usuário autenticado e grava na fila de
// revisão (transacoes_importadas, status 'pendente'). Nunca sobrescreve
// uma linha já revisada — upsert com "on conflict do nothing" pela chave
// (user_id, pluggy_transaction_id).
//
// Segredos usados: PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET.
// Ver plano da integração: memória "app-financeiro-pluggy-integracao".

import { createClient } from "npm:@supabase/supabase-js@2";

const PLUGGY_API_URL = "https://api.pluggy.ai";
const DIAS_HISTORICO_PRIMEIRA_SYNC = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getPluggyApiKey(): Promise<string> {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("PLUGGY_CLIENT_ID/PLUGGY_CLIENT_SECRET não configurados nos secrets da função");
  }
  const resp = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!resp.ok) {
    throw new Error(`Pluggy /auth falhou (${resp.status}): ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.apiKey as string;
}

async function pluggyGet(path: string, apiKey: string) {
  const resp = await fetch(`${PLUGGY_API_URL}${path}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!resp.ok) {
    throw new Error(`Pluggy ${path} falhou (${resp.status}): ${await resp.text()}`);
  }
  return resp.json();
}

// Taxonomia de categorias da Pluggy é em inglês (docs.pluggy.ai/docs/
// transaction-categories); as categorias do app são livres, em
// português. Traduz pro português antes de comparar — sem isso o match
// por nome praticamente nunca acerta. Cobre os 3 níveis da taxonomia
// (o campo "category" de uma transação normalmente vem no nível mais
// específico disponível).
const TRADUCAO_CATEGORIA_PLUGGY: Record<string, string> = {
  // Nível 1
  "income": "Receita", "loans and financing": "Empréstimos e financiamento",
  "investments": "Investimentos", "same person transfer": "Transferência entre contas próprias",
  "transfers": "Transferências", "legal obligations": "Obrigações legais",
  "services": "Serviços", "shopping": "Compras", "digital services": "Serviços digitais",
  "groceries": "Mercado", "food and drinks": "Alimentação", "travel": "Viagem",
  "donations": "Doações", "gambling": "Jogos de azar", "taxes": "Impostos",
  "bank fees": "Tarifas bancárias", "housing": "Casa", "healthcare": "Saúde",
  "transportation": "Transporte", "insurance": "Seguro", "leisure": "Lazer", "other": "Outro",
  // Nível 2
  "salary": "Salário", "retirement": "Aposentadoria",
  "entrepreneurial activities": "Atividade autônoma", "government aid": "Auxílio governamental",
  "non-recurring income": "Receita eventual",
  "late payment and overdraft costs": "Juros por atraso", "interests charged": "Juros cobrados",
  "loans": "Empréstimo", "financing": "Financiamento",
  "automatic investment": "Investimento automático", "fixed income": "Renda fixa",
  "mutual funds": "Fundos de investimento", "variable income": "Renda variável",
  "margin": "Margem", "proceeds interests and dividends": "Rendimentos e dividendos",
  "pension": "Previdência",
  "same person transfer - cash": "Transferência própria em dinheiro",
  "same person transfer - pix": "Transferência própria via PIX",
  "same person transfer - ted": "Transferência própria via TED",
  "transfer - bank slip (boleto)": "Pagamento de boleto", "transfer - cash": "Transferência em dinheiro",
  "transfer - check": "Transferência por cheque", "transfer - doc": "Transferência DOC",
  "transfer - foreign exchange": "Câmbio", "transfer - internal": "Transferência interna",
  "transfer - pix": "PIX", "transfer - ted": "TED",
  "credit card payment": "Pagamento de fatura do cartão", "third-party transfers": "Transferência a terceiros",
  "blocked balances": "Saldo bloqueado", "alimony": "Pensão alimentícia",
  "telecommunications": "Telecomunicações", "education": "Educação",
  "wellness and fitness": "Bem-estar e academia", "tickets": "Ingressos",
  "online shopping": "Compras online", "electronics": "Eletrônicos",
  "pet supplies and vet": "Pet shop e veterinário", "clothing": "Roupas",
  "kids and toys": "Infantil e brinquedos", "bookstore": "Livraria",
  "sports goods": "Artigos esportivos", "office supplies": "Material de escritório",
  "cashback": "Cashback",
  "gaming": "Jogos", "video streaming": "Streaming de vídeo", "music streaming": "Streaming de música",
  "eating out": "Restaurante", "food delivery": "Delivery de comida",
  "airport and airlines": "Aeroporto e companhias aéreas", "accommodation": "Hospedagem",
  "mileage programs": "Programa de milhas", "bus tickets": "Passagem de ônibus",
  "lottery": "Loteria", "online bet": "Aposta online",
  "income taxes": "Imposto de renda", "taxes on investments": "Imposto sobre investimentos",
  "tax on financial operations": "IOF",
  "account fees": "Tarifa de conta", "wire transfer fees and atm fees": "Tarifa de TED/saque",
  "credit card fees": "Tarifa de cartão de crédito",
  "rent": "Aluguel", "houseware": "Utilidades domésticas",
  "urban land and building tax": "IPTU", "utilities": "Contas de casa",
  "dentist": "Dentista", "pharmacy": "Farmácia", "optometry": "Oftalmologia",
  "hospital clinics and labs": "Hospital e laboratório",
  "taxi and ride-hailing": "Transporte por app", "public transportation": "Transporte público",
  "car rental": "Aluguel de carro", "bicycle": "Bicicleta", "automotive": "Automotivo",
  "life insurance": "Seguro de vida", "home insurance": "Seguro residencial",
  "health insurance": "Seguro saúde", "vehicle insurance": "Seguro veicular",
  // Nível 3
  "real estate financing": "Financiamento imobiliário", "vehicle financing": "Financiamento de veículo",
  "student loan": "Financiamento estudantil",
  "internet": "Internet", "mobile": "Celular", "tv": "TV",
  "online courses": "Cursos online", "university": "Faculdade", "school": "Escola",
  "kindergarten": "Creche",
  "gyms and fitness centers": "Academia", "sports practice": "Prática esportiva",
  "wellness": "Bem-estar",
  "stadiums and arenas": "Estádios e arenas", "landmarks and museums": "Pontos turísticos e museus",
  "cinema, theater and concerts": "Cinema, teatro e shows",
  "bank slip": "Boleto", "debt card": "Cartão de débito", "doc": "DOC",
  "water": "Água", "electricity": "Energia elétrica", "gas": "Gás",
  "gas stations": "Posto de gasolina", "parking": "Estacionamento",
  "tolls and in-vehicle payment": "Pedágio",
  "vehicle ownership taxes and fees": "IPVA e taxas", "vehicle maintenance": "Manutenção veicular",
  "traffic tickets": "Multas de trânsito",
};

function traduzirCategoriaPluggy(categoriaPluggy: string): string {
  return TRADUCAO_CATEGORIA_PLUGGY[categoriaPluggy.trim().toLowerCase()] ?? categoriaPluggy;
}

// Heurística por nome do estabelecimento (descricao_banco), pra quando o
// nome bate com algo reconhecível mesmo sem a categoria da Pluggy ajudar
// (ex.: "DROGARIAS IMPERIAL LTDA" → Saúde). Concept em português, no mesmo
// vocabulário da tradução acima — casado contra as categorias do usuário
// do mesmo jeito (exata ou parcial).
const PALAVRAS_CHAVE_CATEGORIA: { padrao: RegExp; categoria: string }[] = [
  { padrao: /drogaria|farm[aá]cia|droga ?raia|pacheco|pague ?menos/, categoria: "Saúde" },
  { padrao: /hospital|cl[ií]nica|laborat[oó]rio|dentista|odont/, categoria: "Saúde" },
  { padrao: /academia|smart ?fit|bodytech|bio ?ritmo/, categoria: "Saúde" },
  { padrao: /supermercado|hortifruti|atacad[ãa]o|carrefour|extra|p[ãa]o de a[çc][uú]car|assa[íi]/, categoria: "Mercado" },
  { padrao: /restaurante|lanchonete|padaria|pizzaria|churrascaria/, categoria: "Alimentação" },
  { padrao: /ifood|rappi|mcdonalds|burger king|habib|subway/, categoria: "Alimentação" },
  { padrao: /uber|99app|99pop|t[áa]xi/, categoria: "Transporte" },
  { padrao: /posto|ipiranga|shell|petrobras|ale combust/, categoria: "Transporte" },
  { padrao: /estacionamento|zona azul/, categoria: "Transporte" },
  { padrao: /netflix|spotify|disney|amazon prime|hbo|paramount/, categoria: "Lazer" },
  { padrao: /cinema|cinemark|teatro/, categoria: "Lazer" },
  { padrao: /escola|faculdade|universidade|udemy|alura/, categoria: "Educação" },
  { padrao: /condom[ií]nio|imobili[aá]ria|aluguel/, categoria: "Casa" },
  { padrao: /cemig|light sa|enel|sabesp|copasa|eletropaulo/, categoria: "Casa" },
];

function sugerirCategoriaPorPalavraChave(descricaoBanco: string | null | undefined): string | null {
  if (!descricaoBanco) return null;
  const alvo = descricaoBanco.toLowerCase();
  const achado = PALAVRAS_CHAVE_CATEGORIA.find((p) => p.padrao.test(alvo));
  return achado ? achado.categoria : null;
}

/** Sugestão de categoria do app pra uma transação importada. Ordem de
 *  prioridade: (1) categoria com o nome EXATAMENTE igual à descrição do
 *  banco — ex. o usuário já cadastrou uma categoria "Drogarias Imperial";
 *  (2) heurística por palavra-chave do nome do estabelecimento; (3) a
 *  categoria da Pluggy já traduzida (nome igual ou um contendo o outro).
 *  Sempre restrito ao mesmo tipo entrada/saída da transação. */
function sugerirCategoria(
  categoriaTraduzida: string | null,
  descricaoBanco: string | null | undefined,
  tipo: "entradas" | "saidas",
  categoriasApp: { nome: string; categoria_tipo: string | null }[],
): string | null {
  const candidatas = categoriasApp.filter((c) => c.categoria_tipo === tipo);

  const descNorm = (descricaoBanco || "").trim().toLowerCase();
  if (descNorm) {
    const exataDescricao = candidatas.find((c) => c.nome.toLowerCase() === descNorm);
    if (exataDescricao) return exataDescricao.nome;
  }

  const porPalavraChave = sugerirCategoriaPorPalavraChave(descricaoBanco);
  if (porPalavraChave) {
    const achada = candidatas.find((c) => c.nome.toLowerCase() === porPalavraChave.toLowerCase());
    if (achada) return achada.nome;
  }

  if (categoriaTraduzida) {
    const alvo = categoriaTraduzida.trim().toLowerCase();
    const exata = candidatas.find((c) => c.nome.toLowerCase() === alvo);
    if (exata) return exata.nome;
    const parcial = candidatas.find(
      (c) => alvo.includes(c.nome.toLowerCase()) || c.nome.toLowerCase().includes(alvo),
    );
    if (parcial) return parcial.nome;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Método não suportado" }, 405);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return json({ error: "Não autenticado" }, 401);
    }

    // Inclui contas com erro também — um sync manual deve tentar de novo,
    // não travar pra sempre por causa de uma falha anterior.
    const { data: contas, error: contasError } = await supabaseClient
      .from("pluggy_contas")
      .select("*")
      .in("status", ["ativo", "erro"]);
    if (contasError) {
      return json({ error: "Falha ao carregar contas conectadas", detalhe: contasError.message }, 500);
    }
    if (!contas || !contas.length) {
      return json({ novas: 0, contasProcessadas: 0 });
    }

    const { data: categoriasApp } = await supabaseClient
      .from("menu_itens")
      .select("nome, categoria_tipo")
      .eq("tipo", "Categoria")
      .eq("status", "Ativo");

    const apiKey = await getPluggyApiKey();
    let novasNoTotal = 0;
    let erroConta: string | null = null;

    for (const conta of contas) {
      const dateFrom = conta.ultimo_sync
        ? String(conta.ultimo_sync).slice(0, 10)
        : new Date(Date.now() - DIAS_HISTORICO_PRIMEIRA_SYNC * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      try {
        const linhas: Record<string, unknown>[] = [];
        // /transactions (offset) foi descontinuado pela Pluggy (410
        // ENDPOINT_DEPRECATED) — /v2/transactions pagina por cursor: cada
        // resposta traz "next" com a query string pronta pra próxima página.
        let path: string | null =
          `/v2/transactions?accountId=${conta.account_id}&dateFrom=${dateFrom}`;
        while (path) {
          const resp = await pluggyGet(path, apiKey);
          for (const t of resp.results ?? []) {
            // Em contas CREDIT (cartão) o sentido de CREDIT/DEBIT se inverte
            // em relação a conta corrente: lá CREDIT = entrada de dinheiro,
            // aqui CREDIT = compra/gasto que aumenta a fatura e DEBIT = pagamento
            // que abate o saldo devedor. Sem isso, compras no cartão (Netflix,
            // Spotify, etc.) eram gravadas como "entradas" por engano.
            const tipo: "entradas" | "saidas" = conta.tipo_conta === "CREDIT"
              ? (t.type === "CREDIT" ? "saidas" : "entradas")
              : (t.type === "CREDIT" ? "entradas" : "saidas");
            // Traduzida uma vez só: guardada em categoria_pluggy (pra exibir
            // algo em português mesmo quando não bate com nenhuma categoria
            // já cadastrada) e usada na sugestão.
            const categoriaTraduzida = t.category ? traduzirCategoriaPluggy(t.category) : null;
            const descricaoBanco = t.description || t.descriptionRaw || "";
            linhas.push({
              pluggy_transaction_id: t.id,
              conta_id: conta.id,
              data: String(t.date ?? "").slice(0, 10),
              valor: Math.abs(Number(t.amount) || 0),
              tipo,
              descricao_banco: descricaoBanco,
              categoria_pluggy: categoriaTraduzida,
              categoria_sugerida: sugerirCategoria(categoriaTraduzida, descricaoBanco, tipo, categoriasApp ?? []),
              metodo_sugerido: conta.metodo_id ?? null,
              status: "pendente",
              user_id: user.id,
            });
          }
          path = resp.next ? `/v2/transactions?${String(resp.next).replace(/^\?/, "")}` : null;
        }

        if (linhas.length) {
          const { data: inseridas, error: upsertError } = await supabaseClient
            .from("transacoes_importadas")
            .upsert(linhas, { onConflict: "user_id,pluggy_transaction_id", ignoreDuplicates: true })
            .select("id");
          if (upsertError) throw upsertError;
          novasNoTotal += inseridas?.length ?? 0;
        }

        await supabaseClient
          .from("pluggy_contas")
          .update({ ultimo_sync: new Date().toISOString(), status: "ativo" })
          .eq("id", conta.id);
      } catch (e) {
        console.error(`Erro sincronizando conta ${conta.id}:`, e);
        erroConta = String(e instanceof Error ? e.message : e);
        await supabaseClient.from("pluggy_contas").update({ status: "erro" }).eq("id", conta.id);
      }
    }

    return json({ novas: novasNoTotal, contasProcessadas: contas.length, erro: erroConta });
  } catch (e) {
    console.error(e);
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
