-- Structured tutorial content for type=Vídeo prompts (OPER "Implementar
-- tutoriais dos 152 vídeos"): goal, ordered steps, settings and expected
-- result, plus an optional external tutorial URL. Nullable and additive
-- only - Imagem/Texto prompts are unaffected, and prompt_text keeps being
-- the copyable generation command.
--
-- Shape:
-- {
--   "goal": "...",
--   "steps": ["...", "...", "..."],
--   "settings": "...",
--   "result": "...",
--   "url": null
-- }

alter table public.prompts
  add column if not exists tutorial_data jsonb;
