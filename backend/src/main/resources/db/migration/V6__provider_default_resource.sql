-- =====================================================================
-- V6: Recurso padrão do profissional.
--   Permite associar um profissional (provider) a um recurso (resource),
--   ex: o barbeiro "Jorginho" atende sempre na "Cadeira 1". Assim, quando
--   um cliente agenda escolhendo o profissional, o agendamento também cai
--   automaticamente na agenda daquele recurso (cadeira).
-- Compatível com PostgreSQL (Supabase) e H2 em modo PostgreSQL.
-- =====================================================================

ALTER TABLE providers ADD COLUMN default_resource_id BIGINT;

ALTER TABLE providers
    ADD CONSTRAINT fk_provider_default_resource
    FOREIGN KEY (default_resource_id) REFERENCES resources (id) ON DELETE SET NULL;
