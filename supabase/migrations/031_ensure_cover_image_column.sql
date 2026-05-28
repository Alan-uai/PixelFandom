-- Migration 031: Garantir que a coluna cover_image exista na tabela tenants
-- Esta coluna pode não ter sido criada nas migrations iniciais (001-007)
-- que não estão presentes no repositório.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cover_image TEXT;
