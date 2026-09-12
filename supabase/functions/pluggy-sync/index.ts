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

/** Sugestão simples de categoria do app a partir da categoria da Pluggy
 *  (v1: nome igual ou um contendo o outro, só dentro do mesmo tipo). */
function sugerirCategoria(
  categoriaPluggy: string | null,
  tipo: "entradas" | "saidas",
  categoriasApp: { nome: string; categoria_tipo: string | null }[],
): string | null {
  if (!categoriaPluggy) return null;
  const alvo = categoriaPluggy.trim().toLowerCase();
  const candidatas = categoriasApp.filter((c) => c.categoria_tipo === tipo);
  const exata = candidatas.find((c) => c.nome.toLowerCase() === alvo);
  if (exata) return exata.nome;
  const parcial = candidatas.find(
    (c) => alvo.includes(c.nome.toLowerCase()) || c.nome.toLowerCase().includes(alvo),
  );
  return parcial ? parcial.nome : null;
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
            const tipo: "entradas" | "saidas" = t.type === "CREDIT" ? "entradas" : "saidas";
            linhas.push({
              pluggy_transaction_id: t.id,
              conta_id: conta.id,
              data: String(t.date ?? "").slice(0, 10),
              valor: Math.abs(Number(t.amount) || 0),
              tipo,
              descricao_banco: t.description || t.descriptionRaw || "",
              categoria_pluggy: t.category ?? null,
              categoria_sugerida: sugerirCategoria(t.category ?? null, tipo, categoriasApp ?? []),
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
