-- =====================================================================
-- V3: Agendamentos feitos pelo próprio cliente (self-booking).
-- Adiciona a referência ao usuário cliente que marcou o horário.
-- NULL para agendamentos criados internamente pelo dono.
-- =====================================================================

ALTER TABLE appointments ADD COLUMN client_user_id VARCHAR(64);

CREATE INDEX idx_appointments_client ON appointments (client_user_id);
