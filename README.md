# Perto · Plataforma de Negócios Locais (MVP)

Marketplace/diretório para descoberta de negócios locais, começando pelo segmento de
**cabeleireiros e barbearias**. A arquitetura é genérica (`Business` + `category`), pronta
para suportar pubs, restaurantes, academias e clínicas no futuro.

> **"Encontre lugares incríveis perto de você."**

O MVP permite que um cliente abra a plataforma, encontre um cabeleireiro próximo pelo mapa,
filtre, veja serviços/preços/horários e entre em contato — e que um dono de negócio crie seu
perfil com serviços, fotos, preços e horários.

---

## 🧱 Arquitetura

```
React (Vite + TS + Tailwind + PWA + Google Maps)
        │  REST + JWT (Supabase Auth)
        ▼
Spring Boot 3 (Java 21) — regras de negócio, validação, autorização
        │  Spring Data JPA + Flyway
        ▼
PostgreSQL (Supabase)  +  Supabase Storage (fotos)  +  Supabase Auth
```

Monólito Spring Boot (sem microserviços). O frontend **não** acessa o banco diretamente para
dados de negócio — tudo passa pela API REST. Supabase é usado para Auth, Storage e Postgres.

```
backend/   → API REST (Java 21, Spring Boot, Flyway, Spring Security)
frontend/  → SPA/PWA (React, TypeScript, Vite, Tailwind)
```

---

## ✅ Rodando localmente (modo demo, zero configuração)

O projeto funciona **imediatamente**, sem Supabase e sem Google Maps:

- Sem Supabase → autenticação **demo** (contas salvas no navegador) e banco **H2 em memória**
  com dados de teste (7 negócios em São Paulo).
- Sem Google Maps → o mapa mostra um aviso amigável e a **lista continua funcionando**.

### Pré-requisitos

| Ferramenta | Versão |
|-----------|--------|
| Java      | 21 (JDK) |
| Node.js   | 20+ |

> O backend inclui o **Maven Wrapper** (`mvnw`), então não é preciso instalar o Maven.

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

1. Clique em **Criar conta** → escolha **"Tenho um negócio"** → cadastre negócio, serviços,
   fotos (por URL no modo demo), horários → veja a página pública.
2. Crie outra conta como **"Quero encontrar negócios"** → permita localização → explore no mapa
   e na lista → filtre → abra um negócio → favorite → WhatsApp / Como chegar.

---

## ⚙️ Configuração completa (Supabase + Google Maps)

### Variáveis de ambiente — Backend

Perfil `supabase` (produção). Defina estas variáveis:

```bash
SPRING_PROFILES_ACTIVE=supabase
SUPABASE_DB_URL=jdbc:postgresql://db.<ref>.supabase.co:5432/postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=<sua-senha-do-banco>
SUPABASE_JWT_SECRET=<Project Settings → API → JWT Secret>
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://seu-site.netlify.app
```

Rodando com o perfil Supabase:

```bash
# Windows (PowerShell)
$env:SPRING_PROFILES_ACTIVE="supabase"; ./mvnw.cmd spring-boot:run
# Linux/macOS
SPRING_PROFILES_ACTIVE=supabase ./mvnw spring-boot:run
```

> A connection string do Supabase está em **Project Settings → Database → Connection string →
> JDBC**. Use a porta `5432` (ou `6543` para o pooler).

### Variáveis de ambiente — Frontend

Copie `frontend/.env.example` para `frontend/.env` e preencha:

```bash
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_GOOGLE_MAPS_API_KEY=<chave Google Maps JavaScript API>
VITE_API_BASE_URL=            # vazio em dev (usa proxy); em prod: https://perto-backend.onrender.com
```

Quando `VITE_SUPABASE_URL`/`ANON_KEY` estão preenchidos, o app usa **Supabase Auth** de verdade
(login, cadastro, recuperação de senha). Caso contrário, usa o modo demo.

### Supabase Storage (fotos)

Crie um bucket **público** chamado `business-images`:

1. Supabase → Storage → New bucket → nome `business-images` → marque como **Public**.
2. Com o bucket e as chaves do Supabase configurados no frontend, o upload de arquivos
   fica disponível no painel (**Dashboard → Fotos**). Sem Storage, use "Por URL".

### Google Maps

1. Google Cloud Console → ative **Maps JavaScript API**.
2. Crie uma API Key e restrinja por domínio (HTTP referrers).
3. Defina `VITE_GOOGLE_MAPS_API_KEY`. **Nunca** faça commit da chave.

---

## 🗄️ Banco de dados & Migrations

- **Flyway** controla o schema: `backend/src/main/resources/db/migration/V1__init_schema.sql`.
- **Seed** de demonstração (repetível, idempotente):
  `backend/src/main/resources/db/seed/R__seed_demo_data.sql` — cria 7 negócios em São Paulo
  com serviços, horários e imagens.

Tabelas: `profiles`, `businesses`, `business_services`, `business_images`, `business_hours`,
`reviews`, `favorites` — com índices e constraints (ex.: `UNIQUE(user_id, business_id)` em
favoritos e reviews).

> O seed roda em dev (H2) e também no Supabase, mas só insere se a tabela `businesses` estiver
> vazia, então não polui um banco já populado.

---

## 🔌 API REST (principais endpoints)

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

### Camada de gestão (multi-tenant — cada negócio é um tenant)

Todos exigem autenticação e validam ownership (só o dono do negócio gerencia).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST/PUT/DELETE | `/api/businesses/{id}/providers[/{pid}]` | Profissionais |
| GET/POST/PUT/DELETE | `/api/businesses/{id}/resources[/{rid}]` | Recursos (cadeiras, salas) |
| GET/POST/PUT/DELETE | `/api/businesses/{id}/appointments[/{aid}]` | Agendamentos (`?date=YYYY-MM-DD` ou `?providerId=`) |
| GET/POST/PUT/DELETE | `/api/businesses/{id}/inventory[/{iid}]` | Estoque |
| PATCH | `/api/businesses/{id}/inventory/{iid}/quantity` | Ajuste de quantidade (`{ "delta": -1 }`) |
| GET | `/api/businesses/{id}/dashboard/stats` | KPIs: receita estimada, agendamentos, estoque baixo, etc. |

### Agendamento pelo cliente (self-booking)

O cliente final marca um horário direto na página pública do negócio.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/businesses/{id}/availability?date=YYYY-MM-DD&providerId=` | público | Horários do dia e se estão livres |
| GET | `/api/businesses/{id}/public-providers` | público | Profissionais ativos (para escolher ao agendar) |
| POST | `/api/businesses/{id}/bookings` | cliente | Cliente marca um horário |
| GET | `/api/me/bookings` | cliente | Agendamentos do cliente autenticado |
| DELETE | `/api/me/bookings/{id}` | cliente | Cliente cancela o próprio agendamento |

O agendamento do cliente aparece automaticamente na agenda do dono. Há checagem de conflito
(um profissional não pode ter dois agendamentos no mesmo horário). A localização do negócio
(latitude/longitude) é **opcional** no cadastro — sem ela o negócio ainda funciona, apenas não
aparece no mapa nem exibe distância.

**Multi-tenant**: cada `Business` é um tenant isolado. Profissionais, recursos, agendamentos
e estoque pertencem a um negócio e só são acessíveis pelo dono (`owner_id`). O painel do dono
tem Agenda (grade recurso × horário), Agenda por profissional, Equipe/Recursos e Estoque, além
de um dashboard com receita estimada (soma dos preços dos serviços agendados) e alertas de
estoque baixo. Agendamentos têm checagem de conflito de horário por recurso.

**Distância**: cálculo **Haversine** no backend (sem PostGIS, mantendo o MVP simples).
**Aberto agora**: calculado a partir dos horários (fuso `America/Sao_Paulo`).
**Autorização**: um dono só altera negócios onde `owner_id == usuário autenticado`.

Erros seguem um formato consistente via `GlobalExceptionHandler` (status HTTP + mensagem).

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
- `netlify.toml` já configurado (`npm run build`, publish `dist`, SPA redirect).
- Defina as variáveis `VITE_*` nas configurações do site.
- `VITE_API_BASE_URL` = URL pública do backend.

### Backend → Render
- `render.yaml` (Blueprint) + `backend/Dockerfile` prontos.
- Em "New + → Blueprint", aponte para o repositório.
- Configure as variáveis `SUPABASE_*` e `CORS_ALLOWED_ORIGINS` (inclua o domínio do Netlify).
- Health check: `/actuator/health`.
- Alternativas equivalentes: Railway, AWS (App Runner / Elastic Beanstalk).

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
- Métricas (visualizações, cliques) têm a estrutura preparada na UI, sem analytics complexo.
- **Fora do escopo** (propositalmente): pagamentos, chat, IA, agenda, app nativo, microserviços.

---

## 📂 Estrutura

```
backend/src/main/java/com/plataforma/
├── business/   (controller, service, repository, entity, dto)
├── review/     favorite/     user/
├── security/   (SupabaseJwtFilter, SecurityConfig, SecurityUtils)
└── common/     (GeoUtils, exceptions, GlobalExceptionHandler)

frontend/src/
├── pages/ (Home, Explore, Map, Business, Favorites, Profile, Login, Register, dashboard/*)
├── components/ (Layout, BusinessCard, MapView, FiltersBar, LocationPicker, ui/*)
├── hooks/ (useGeolocation, useGoogleMaps, useFavorites, useBusinesses, useMyBusiness)
├── auth/  (AuthContext)
└── lib/   (api, services, supabase, demoAuth, storage, format)
```
