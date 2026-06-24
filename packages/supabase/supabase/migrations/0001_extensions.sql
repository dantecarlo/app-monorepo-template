-- 0001_extensions.sql
-- Concern: dedicated schemas + base Postgres extensions.
-- Source of truth: packages/supabase/docs/database.md (Migration conventions).
-- Idempotency: every statement uses CREATE ... IF NOT EXISTS.
--
-- Schemas:
--   extensions   — hosts all installed extensions (keeps public clean).
--   auth_helpers — hosts SECURITY DEFINER helper functions (API-unreachable;
--                  not listed in config.toml api.schemas).
--
-- config.toml already sets extra_search_path = ["public", "extensions"], so
-- citext/pg_trgm operators resolve without schema-qualifying every call.

-- =====================================================================
-- Section 1: schemas
-- =====================================================================

create schema if not exists extensions;

create schema if not exists auth_helpers;

-- =====================================================================
-- Section 2: extensions (installed into the extensions schema)
-- =====================================================================

-- pgcrypto: gen_random_uuid() used for uuid PK defaults across the domain.
create extension if not exists pgcrypto with schema extensions;

-- citext: case-insensitive text for normalized email columns.
create extension if not exists citext with schema extensions;

-- pg_trgm: trigram indexes for typeahead / similarity search.
create extension if not exists pg_trgm with schema extensions;

-- moddatetime: standard updated_at trigger mechanism.
-- Usage: extensions.moddatetime(updated_at) — schema-qualify in trigger bodies.
create extension if not exists moddatetime with schema extensions;
