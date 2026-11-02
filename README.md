# Tem na Geladeira — seu chef pessoal com IA

> Sua cozinha tem os ingredientes. Nossa IA tem as ideias.

React + TypeScript + Vite + Tailwind · Supabase (Auth, Postgres + RLS, Edge Functions, Storage) · PWA instalável.

## Estado desta entrega (leia primeiro)

O código foi escrito, mas **ainda não foi compilado nem executado de ponta a ponta**: o ambiente em que foi
produzido não tinha acesso ao registry do npm, então `npm install`, `npm run build` e o teste contra um
Supabase real **ainda precisam ser feitos por você** (passo a passo abaixo). O que foi verificado aqui:

- as regras de segurança do servidor (`supabase/functions/_shared/safety.ts`) têm 22 testes unitários passando
  (alergias, dietas, `have` falso corrigido, modo "não quero comprar nada", etc.);
- a sintaxe dos arquivos das Edge Functions foi checada;
- o typecheck rodou sem dependências instaladas e não encontrou imports/exports quebrados entre os módulos locais.

Espere ajustes pequenos (tipos, versões de bibliotecas) no primeiro `npm run build`.

## Início rápido

```bash
npm install
cp .env.example .env.local      # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Sem `.env.local`, o app abre e mostra o estado "Supabase não configurado" em vez de falhar.

## 1) Supabase

1. Crie um projeto em <https://supabase.com>.
2. Aplique o schema, o RLS e o seed (catálogo de ingredientes):
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <SEU_PROJECT_REF>
   supabase db push        # aplica supabase/migrations/001_schema.sql e 002_seed_ingredients.sql
   ```
   Alternativa: cole os dois arquivos, em ordem, no **SQL Editor**.
3. **Authentication → URL Configuration**: defina *Site URL* (ex.: `https://seu-dominio.com`) e adicione em
   *Redirect URLs*: `https://seu-dominio.com/redefinir-senha` e `http://localhost:5173/redefinir-senha`.
4. (Opcional) Login com Google: ative em **Authentication → Providers → Google** e só então coloque
   `VITE_ENABLE_GOOGLE_AUTH=true` no `.env.local`.

## 2) Onde configurar cada chave

| Chave | Onde | Para quê |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` (e variáveis do host) | URL do projeto (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` (e variáveis do host) | Chave **pública**; a proteção dos dados vem do RLS |
| `LLM_API_KEY` | **Secret do Supabase** | Chave da IA (texto + visão). **Nunca** no frontend |
| `LLM_PROVIDER` | Secret | `anthropic` (padrão) ou `openai` (APIs compatíveis com `/chat/completions`) |
| `LLM_MODEL` / `LLM_VISION_MODEL` | Secret (opcionais) | Modelos de texto e de visão |
| `LLM_BASE_URL` | Secret (opcional) | Para provedores compatíveis com OpenAI |
| `ALLOWED_ORIGIN` | Secret (recomendado em produção) | Restringe o CORS ao seu domínio |
| `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_FAMILIA` | Secrets | Webhook de pagamento (veja §4) |
| `VITE_CHECKOUT_URL_PREMIUM` / `_FAMILIA` | `.env.local` | Links de checkout hospedados pelo provedor |
| `VITE_PRICE_PREMIUM` / `_FAMILIA` | `.env.local` | Texto de preço exibido (vazio = "Em breve") |
| `VITE_ENABLE_GOOGLE_AUTH`, `VITE_SUPPORT_EMAIL` | `.env.local` | Opcionais |

A `service_role` do Supabase **não** vai em nenhum arquivo do projeto: as Edge Functions a recebem automaticamente.

```bash
supabase secrets set LLM_API_KEY=... LLM_PROVIDER=anthropic LLM_MODEL=claude-sonnet-5-5
supabase secrets set ALLOWED_ORIGIN=https://seu-dominio.com

supabase functions deploy generate-recipes chef-chat analyze-photo suggest-substitution plan-week
supabase functions deploy payments-webhook --no-verify-jwt
```

Sem `LLM_API_KEY`, as funções respondem `not_configured` e a interface mostra uma mensagem clara — nenhum botão de IA
simula resultado.

## 3) Deploy do frontend

```bash
npm run build      # gera dist/
```

Publique `dist/` em qualquer host estático (Vercel, Netlify, Cloudflare Pages) com **fallback de SPA para `index.html`**
e as variáveis `VITE_*` configuradas no painel do host. O service worker e o manifest (PWA) são gerados pelo build.

## 4) Pagamentos (estrutura pronta, nada simulado)

- A página `/planos` só mostra "Assinar" se existir `VITE_CHECKOUT_URL_*`; caso contrário exibe "Assinatura em breve".
- Uma assinatura **só passa a `active`** quando o webhook assinado do provedor chega
  (`supabase/functions/payments-webhook`, implementado para Stripe com verificação HMAC e anti-replay). O usuário não
  consegue se conceder um plano: `subscriptions` e `usage_limits` são somente-leitura para ele (escrita só por service role).
- Stripe: crie os produtos, um *Payment Link* por plano (o app acrescenta `client_reference_id` com o id do usuário),
  e um endpoint de webhook apontando para `https://<ref>.supabase.co/functions/v1/payments-webhook` com os eventos
  `checkout.session.completed` e `customer.subscription.created/updated/deleted`. Guarde o *signing secret* em
  `STRIPE_WEBHOOK_SECRET` e os *price ids* em `STRIPE_PRICE_PREMIUM` / `STRIPE_PRICE_FAMILIA`.
- Limitação conhecida: se o evento `customer.subscription.*` chegar antes de `checkout.session.completed`, a primeira
  atualização não encontra o cliente vinculado; o evento `customer.subscription.updated` seguinte corrige. Teste esse
  fluxo no modo de teste do Stripe antes de ir para produção.
- Para **testar recursos Premium em desenvolvimento** (nunca em produção), use o SQL Editor:
  `update public.subscriptions set plan = 'premium', status = 'active' where user_id = '<uuid>';`

## Planos e limites diários (aplicados no servidor)

| | Free | Premium | Família |
|---|---|---|---|
| Gerações de receitas | 5 | 50 | 120 |
| Substituição inteligente | 3 | 50 | 120 |
| Reconhecimento por foto | — | 20 | 50 |
| Chef IA (mensagens) | — | 150 | 300 |
| Planejamento semanal | — | 10 | 25 |
| Modos especiais | — | ✔ | ✔ |

Definidos em `supabase/functions/_shared/http.ts` (`LIMITS`) e espelhados, só para exibição, em `src/lib/plans.ts`.
**Família**: os limites maiores funcionam; receitas familiares compartilhadas, perfis individuais e planejamento
compartilhado **não foram construídos** e aparecem como "Em breve".

## Segurança e confiabilidade

- **RLS em todas as tabelas** (`auth.uid() = user_id`); receitas só são legíveis por terceiros se o dono as tornou públicas.
- **Chaves de IA só no backend.** O frontend fala apenas com as Edge Functions, usando o JWT do usuário.
- **Consentimento**: a IA só usa os dados do usuário depois que ele autoriza (Configurações).
- **Validação com Zod** da resposta da IA no servidor e de novo no cliente, antes de renderizar.
- **Regras críticas aplicadas no servidor, não só no prompt** (`_shared/safety.ts`): `have` só é verdadeiro se o item está
  de fato na despensa; compatibilidade é recalculada ("Requer ingrediente adicional" nunca vira "completa");
  alergias, dietas e itens excluídos descartam a receita; "Não quero comprar nada" descarta qualquer receita com item faltando.
  O planejamento semanal também é checado e refeito uma vez se violar alergias/dietas.
- **Segurança alimentar**: aviso fixo na identificação por foto ("A identificação é uma sugestão e não confirma que o
  alimento está próprio para consumo"); nunca recomendar alimento estragado; dados nutricionais sempre "aproximados".
- Rate limit diário por usuário/plano, com estorno se a geração falhar. Geração com cancelamento.

## Notas

- A "imagem ilustrativa" da receita é um emoji sobre fundo de marca (ilustração, não foto do prato). Não há geração de imagens.
- Os schemas Zod existem em dois lugares e precisam ficar iguais: `src/lib/schemas.ts` e `supabase/functions/_shared/schemas.ts`.
- Ao reconstruir `src/lib/{utils,schemas,supabase,plans,modes}.ts` e a configuração (Tailwind, Vite, tsconfig), a partir de como o
  restante do código os usa, algumas escolhas visuais (ex.: tons exatos de `brand-soft` e `danger`) podem diferir do original.
  Ajuste em `tailwind.config.js`.
- `public/icon-512.svg` é um ícone anterior, hoje sem uso (o manifest usa os PNGs `pwa-*.png`).

## Estrutura

```
src/
  components/ ui/ layout/     UI base, AppShell com bottom-bar mobile
  hooks/                      React Query (despensa, receitas, perfil, plano, uso…)
  lib/                        supabase, ai (chamadas às Edge Functions), schemas, modes, plans, utils
  pages/                      todas as rotas
  store/                      Zustand (auth, rascunho de ingredientes)
supabase/
  migrations/                 schema + RLS + seed
  functions/                  generate-recipes, chef-chat, analyze-photo, suggest-substitution, plan-week, payments-webhook
```
