# Perto · Plataforma de Negócios Locais (MVP)

Marketplace/diretório para descoberta e gestão de negócios locais, começando pelo segmento de
**cabeleireiros e barbearias**. A arquitetura é genérica (`Business` + `category`), pronta
para suportar pubs, restaurantes, academias e clínicas no futuro.

> **"Encontre lugares incríveis perto de você."**

A plataforma tem dois lados:

- **Cliente final:** encontra negócios próximos pelo mapa/lista, filtra, vê serviços, preços,
  fotos, horários e avaliações, favorita, entra em contato (WhatsApp / telefone / rotas) e
  **agenda horário** direto na página do negócio.
- **Dono do negócio (tenant):** cria o perfil do negócio e gerencia serviços, fotos, horários,
  profissionais, recursos, agenda, estoque e vê um dashboard com métricas (receita estimada,
  agendamentos, estoque baixo).

A interface é **multilíngue**: 🇧🇷 Português, 🇪🇺 Inglês e 🇪🇸 Espanhol, trocável por um seletor
de bandeiras no topo.

---

## 🌐 Ambiente em produção (no ar)

| Camada | Serviço | URL |
|--------|---------|-----|
| Backend (API REST) | Render (Docker, free tier) | `https://perto-backend-7i7a.onrender.com` |
| Banco de dados | Supabase PostgreSQL (Session Pooler) | — |
| Frontend (SPA/PWA) | Netlify | *(URL do seu site Netlify)* |
| Repositório | GitHub | `https://github.com/joaoamorim97/plataforma` |

- Health check do backend: `https://perto-backend-7i7a.onrender.com/actuator/health` → `{"status":"UP"}`.
- O Netlify faz **proxy** de `/api/*` para o backend no Render (configurado em `frontend/netlify.toml`
  e `frontend/public/_redirects`), evitando problemas de CORS.
- ⚠️ **Cold start:** o free tier do Render "dorme" após ~15 min sem uso; a primeira requisição
  depois disso pode levar ~50s para responder. Depois fica rápido.

---

## 🧱 Arquitetura

```
React (Vite + TS + Tailwind + PWA + Google Maps + i18n)
        │  REST + JWT (Supabase Auth)
        ▼
Spring Boot 3 (Java 21) — regras de negócio, validação, autorização
        │  Spring Data JPA + Flyway
        ▼
PostgreSQL (Supabase)  +  Supabase Storage (fotos)  +  Supabase Auth
```

Monólito Spring Boot modular (sem microserviços). O frontend **não** acessa o banco diretamente
para dados de negócio — tudo passa pela API REST. Supabase é usado para Auth, Storage e Postgres.

```
backend/   → API REST (Java 21, Spring Boot 3, Flyway, Spring Security)
frontend/  → SPA/PWA (React, TypeScript, Vite, Tailwind, i18n)
```

---

## 🧰 Stack & Requisitos

### Backend
- **Java 21** (JDK) — inclui **Maven Wrapper** (`mvnw`), não é preciso instalar o Maven.
- **Spring Boot 3** (Web, Data JPA, Security, Validation, Actuator)
- **Flyway** (migrations) · **Hibernate**
- **PostgreSQL** (produção, via Supabase) · **H2 em memória** (dev)
- **JWT** (validação do token do Supabase)
- Empacotamento em **Docker** (multi-stage) para deploy no Render.

### Frontend
- **Node.js 20+**
- **React 18 + TypeScript + Vite**
- **Tailwind CSS**
- **React Router**, **TanStack Query**, **Lucide** (ícones)
- **Google Maps JavaScript API** (mapa e seleção de localização)
- **PWA** (vite-plugin-pwa: manifest + service worker)
- **i18n próprio** (contexto React + dicionário PT/EN/ES, sem dependência externa)
- **Supabase JS** (Auth + Storage)

---

## ✅ Rodando localmente (modo demo, zero configuração)

O projeto funciona **imediatamente**, sem Supabase e sem Google Maps:

- Sem Supabase → autenticação **demo** (contas salvas no navegador) e banco **H2 em memória**
  com dados de teste (7 negócios em São Paulo, com profissionais, recursos e estoque).
- Sem Google Maps → o mapa mostra um aviso amigável e a **lista continua funcionando**.

### Pré-requisitos

| Ferramenta | Versão |
|-----------|--------|
| Java      | 21 (JDK) |
| Node.js   | 20+ |

### 1) Backend

```bash
cd backend
# Windows
./mvnw.cmd spring-boot:run
# Linux/macOS
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`. No perfil `dev` (padrão) ela usa H2 em memória e aplica
as migrations Flyway + o seed de demonstração automaticamente.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite faz proxy de `/api` para `http://localhost:8080`.

### Testando os fluxos

1. **Dono:** Criar conta → **"Tenho um negócio"** → cadastrar negócio, serviços, fotos
   (por URL no modo demo), horários, profissionais e recursos → ver a página pública.
2. **Cliente:** outra conta como **"Quero encontrar negócios"** → permitir localização →
   explorar no mapa/lista → filtrar → abrir um negócio → favoritar → **Agendar horário** →
   ver em "Meus agendamentos" → WhatsApp / Como chegar.
3. **Idioma:** clicar na bandeira no topo e alternar entre PT / EN / ES.

---

## ⚙️ Configuração completa (Supabase + Google Maps)

### Variáveis de ambiente — Backend (perfil `supabase`)

```bash
SPRING_PROFILES_ACTIVE=supabase
SUPABASE_DB_URL=jdbc:postgresql://<host-do-pooler>:5432/postgres
SUPABASE_DB_USERNAME=postgres.<ref-do-projeto>
SUPABASE_DB_PASSWORD=<senha-do-banco>
SUPABASE_JWT_SECRET=<Project Settings → API → JWT Secret>
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://seu-site.netlify.app
# PORT é injetada automaticamente pelo Render; localmente usa 8080.
```

Rodando com o perfil Supabase localmente:

```bash
# Windows (PowerShell)
$env:SPRING_PROFILES_ACTIVE="supabase"; ./mvnw.cmd spring-boot:run
# Linux/macOS
SPRING_PROFILES_ACTIVE=supabase ./mvnw spring-boot:run
```

> **Supabase → Connect → Session pooler** (recomendado para PaaS como o Render, que usa IPv4).
> A URI aparece como `postgresql://USUARIO:[SENHA]@HOST:5432/postgres`. Converta para JDBC:
> `SUPABASE_DB_URL = jdbc:postgresql://HOST:5432/postgres`, `SUPABASE_DB_USERNAME = USUARIO`,
> `SUPABASE_DB_PASSWORD = SENHA`. **Não** use "Direct connection" (IPv6) no Render.

### Variáveis de ambiente — Frontend

Copie `frontend/.env.example` para `frontend/.env` e preencha:

```bash
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_GOOGLE_MAPS_API_KEY=<chave Google Maps JavaScript API>
VITE_API_BASE_URL=            # vazio = usa /api (proxy do Vite em dev, proxy do Netlify em prod)
```

Quando `VITE_SUPABASE_URL`/`ANON_KEY` estão preenchidos, o app usa **Supabase Auth** de verdade
(login, cadastro, recuperação de senha). Caso contrário, usa o modo demo (contas no navegador).

### Supabase Storage (fotos)

Crie um bucket **público** chamado `business-images`:

1. Supabase → Storage → New bucket → nome `business-images` → marque como **Public**.
2. Com o bucket e as chaves do Supabase configurados no frontend, o upload de arquivos
   fica disponível no painel (**Painel → Fotos**). Sem Storage, use "Por URL".

### Google Maps

1. Google Cloud Console → ative **Maps JavaScript API**.
2. Crie uma API Key e restrinja por domínio (HTTP referrers).
3. Defina `VITE_GOOGLE_MAPS_API_KEY`. **Nunca** faça commit da chave.

---

## 🌍 Internacionalização (i18n)

- Idiomas: **Português (🇧🇷)**, **Inglês (🇪🇺)**, **Espanhol (🇪🇸)**.
- Seletor de bandeiras no cabeçalho (site do cliente e painel do dono).
- A escolha é salva em `localStorage` (`perto.lang`) e o idioma inicial é detectado pelo
  navegador na primeira visita.
- Implementação própria e leve: `src/i18n/translations.ts` (dicionário) + `src/i18n/I18nContext.tsx`
  (hook `useI18n()` com a função `t('chave')`). Chaves sem tradução caem no PT como fallback.
- Cobertura: todas as telas do cliente (Home, Explorar, Mapa, Página do negócio, Agendamento,
  Login/Cadastro, Favoritos, Perfil, Meus agendamentos) e as principais do painel (Visão geral,
  Agenda, Estoque). Conteúdo cadastrado pelos donos (nomes de serviços etc.) permanece no idioma
  digitado, pois é dado do usuário, não texto de interface.

---

## 🗄️ Banco de dados & Migrations

Migrations Flyway em `backend/src/main/resources/db/`:

- `migration/V1__init_schema.sql` — schema base.
- `migration/V2__management_layer.sql` — camada de gestão (providers, resources, appointments,
  inventory_items).
- `migration/V3__client_bookings.sql` — coluna `client_user_id` em `appointments` (agendamento
  feito pelo cliente).
- `seed/R__seed_demo_data.sql` — seed repetível e idempotente: 7 negócios em São Paulo com
  serviços, horários, imagens, profissionais, recursos e itens de estoque.

**Tabelas:** `profiles`, `businesses`, `business_services`, `business_images`, `business_hours`,
`reviews`, `favorites`, `providers`, `resources`, `appointments`, `inventory_items` — com índices
e constraints (ex.: `UNIQUE(user_id, business_id)` em favoritos e reviews).

> O seed só insere se as tabelas estiverem vazias, então não polui um banco já populado.
> O mesmo schema roda em H2 (dev) e Postgres/Supabase (produção).

---

## 🔌 API REST (principais endpoints)

### Descoberta e perfil

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/businesses?category&q&latitude&longitude` | público | Lista/busca (ordenado por distância) |
| GET | `/api/businesses/nearby?latitude&longitude&radius&category` | público | Negócios dentro do raio (km) |
| GET | `/api/businesses/{id}` | público | Detalhe (serviços, fotos, horários, distância, aberto agora) |
| GET | `/api/businesses/mine` | sim | Negócios do usuário autenticado |
| POST/PUT/DELETE | `/api/businesses/{id}` | dono | CRUD do negócio (valida ownership) |
| GET/POST/PUT/DELETE | `/api/businesses/{id}/services[/{sid}]` | dono p/ escrita | Serviços |
| GET/POST/DELETE | `/api/businesses/{id}/photos[/{pid}]` | dono p/ escrita | Fotos |
| GET/PUT | `/api/businesses/{id}/hours` | dono p/ escrita | Horários (PUT substitui a semana) |
| GET/POST | `/api/businesses/{id}/reviews` | cliente p/ escrita | Avaliações (1 por usuário, upsert) |
| GET/POST/DELETE | `/api/favorites[/{id}]`, `/api/favorites/ids` | sim | Favoritos |
| GET/PUT | `/api/profile/me` | sim | Perfil do usuário |

### Gestão do negócio (multi-tenant — só o dono)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST/PUT/DELETE | `/api/businesses/{id}/providers[/{pid}]` | Profissionais |
| GET/POST/PUT/DELETE | `/api/businesses/{id}/resources[/{rid}]` | Recursos (cadeiras, salas) |
| GET/POST/PUT/DELETE | `/api/businesses/{id}/appointments[/{aid}]` | Agendamentos (`?date=YYYY-MM-DD` ou `?providerId=`) |
| GET/POST/PUT/DELETE | `/api/businesses/{id}/inventory[/{iid}]` | Estoque |
| PATCH | `/api/businesses/{id}/inventory/{iid}/quantity` | Ajuste de quantidade (`{ "delta": -1 }`) |
| GET | `/api/businesses/{id}/dashboard/stats` | KPIs: receita estimada, agendamentos, estoque baixo, etc. |

### Agendamento pelo cliente (self-booking)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/businesses/{id}/availability?date=YYYY-MM-DD&providerId=` | público | Horários do dia e se estão livres |
| GET | `/api/businesses/{id}/public-providers` | público | Profissionais ativos (para escolher ao agendar) |
| POST | `/api/businesses/{id}/bookings` | cliente | Cliente marca um horário |
| GET | `/api/me/bookings` | cliente | Agendamentos do cliente autenticado |
| DELETE | `/api/me/bookings/{id}` | cliente | Cliente cancela o próprio agendamento |

**Regras de negócio relevantes:**
- **Multi-tenant:** cada `Business` é um tenant isolado; profissionais, recursos, agendamentos e
  estoque pertencem a um negócio e só são acessíveis pelo dono (`owner_id`).
- **Agendamento do cliente** aparece automaticamente na agenda do dono. Há checagem de conflito
  (um profissional não pode ter dois agendamentos no mesmo horário).
- **Localização (lat/long) é opcional** no cadastro — sem ela o negócio funciona, mas não aparece
  no mapa nem exibe distância.
- **Distância:** cálculo **Haversine** no backend (sem PostGIS).
- **Aberto agora:** calculado a partir dos horários (fuso `America/Sao_Paulo`).
- **Autorização:** um dono só altera negócios onde `owner_id == usuário autenticado`.
- Erros seguem um formato consistente via `GlobalExceptionHandler` (status HTTP + mensagem).

---

## 🏗️ Build

```bash
# Backend (gera backend/target/*.jar)
cd backend && ./mvnw clean package

# Frontend (gera frontend/dist/)
cd frontend && npm run build
```

---

## 🚀 Deploy

### Frontend → Netlify
- `frontend/netlify.toml`: build `npm run build`, publish `dist`, proxy de `/api/*` para o Render
  e fallback SPA. O `frontend/public/_redirects` reforça o proxy no bundle.
- **Recomendado:** conectar o site ao repositório Git (**Add new site → Import an existing project
  → GitHub → `plataforma`**), com **Base directory** `frontend`, **Build command** `npm run build`,
  **Publish directory** `frontend/dist`. Assim cada `git push` dispara deploy automático.
- Alternativa manual: `npm run build` e arrastar a pasta `frontend/dist` no painel do Netlify
  (não sincroniza com o Git — precisa repetir a cada mudança).
- Defina as variáveis `VITE_*` nas configurações do site, se usar Supabase/Google Maps.

### Backend → Render
- `render.yaml` (Blueprint) + `backend/Dockerfile` prontos.
- **New + → Blueprint**, aponte para o repositório `plataforma`.
- Configure as variáveis `SUPABASE_*` e `CORS_ALLOWED_ORIGINS` (inclua o domínio do Netlify).
- O backend escuta a porta injetada pelo Render (`PORT`); health check em `/actuator/health`.
- Alternativas equivalentes: Railway, Fly.io, AWS (App Runner).

---

## 📱 PWA

- `manifest.webmanifest` + ícones (`public/pwa-192.png`, `pwa-512.png`) + service worker
  (gerado via `vite-plugin-pwa`). Instalável no celular ("Adicionar à tela inicial").
- Layout mobile-first com navegação inferior (Home, Explorar, Mapa, Favoritos, Perfil).

---

## 🧭 Decisões de MVP

- H2 em dev para rodar sem credenciais; Postgres/Supabase em produção (mesmo schema via Flyway).
- Autenticação demo quando o Supabase não está configurado, para validar os fluxos sem fricção.
- Haversine em vez de PostGIS (simples, barato, suficiente para o MVP).
- Query de busca compatível com PostgreSQL (normalização do termo em `LIKE` minúsculo para evitar
  erro de inferência de tipo do parâmetro).
- i18n próprio e leve, sem biblioteca externa.
- Métricas de engajamento (visualizações, cliques) têm estrutura preparada na UI; o dashboard já
  mostra receita estimada, contagem de agendamentos e alerta de estoque baixo.

### Fora do escopo (ainda não implementado)
- Venda de produtos / carrinho / checkout / pagamento online.
- Pagamentos, chat, IA, app nativo, microserviços.
- Tradução completa de algumas telas internas do painel (Serviços, Fotos, Horários, Equipe,
  Agenda Profissional, Avaliações) — funcionam, mas ainda com textos em PT (fallback do i18n).

---

## 📂 Estrutura

```
backend/src/main/java/com/plataforma/
├── business/     (controller, service, repository, entity, dto)
├── management/   (providers, resources, appointments, inventory, bookings, dashboard)
├── review/       favorite/       user/
├── security/     (SupabaseJwtFilter, SecurityConfig, SecurityUtils)
└── common/       (GeoUtils, exceptions, GlobalExceptionHandler)

backend/src/main/resources/db/
├── migration/    (V1 schema, V2 gestão, V3 self-booking)
└── seed/         (R__ seed de demonstração)

frontend/src/
├── pages/        (Home, Explore, Map, Business, Favorites, Profile, MyBookings,
│                  Login, Register, dashboard/*)
├── components/   (Layout, BusinessCard, MapView, FiltersBar, LocationPicker,
│                  BookingModal, LanguageSwitcher, ui/*)
├── hooks/        (useGeolocation, useGoogleMaps, useFavorites, useBusinesses, useMyBusiness)
├── i18n/         (I18nContext, translations [PT/EN/ES])
├── auth/         (AuthContext)
└── lib/          (api, services, supabase, demoAuth, storage, format)
```

---

## 🔐 Nota de segurança

Trate as credenciais do Supabase (senha do banco, JWT secret, chaves) como segredos: configure-as
apenas como variáveis de ambiente no Render/Netlify, nunca no código versionado. Se alguma chave
for exposta, rotacione-a no Supabase ("Reset database password" / rotacionar JWT) e atualize as
variáveis no Render.
