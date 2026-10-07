-- =====================================================================
-- V4: Propriedade flexível do negócio.
--   - owner_id passa a ser opcional (negócio pode ser criado sem dono).
--   - owner_email guarda o e-mail do dono atribuído pelo admin; quando a
--     conta com esse e-mail faz login, o negócio é "reivindicado"
--     (owner_id preenchido automaticamente).
-- Compatível com PostgreSQL (Supabase) e H2 em modo PostgreSQL.
-- =====================================================================

ALTER TABLE businesses ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE businesses ADD COLUMN owner_email VARCHAR(255);

CREATE INDEX idx_businesses_owner_email ON businesses (owner_email);
