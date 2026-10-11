-- Nullable for accounts created before the legal acceptance requirement.
-- New registrations must provide explicit consent, validated by Express.
ALTER TABLE "usuarios"
  ADD COLUMN "terminos_aceptados_en" TIMESTAMPTZ(6),
  ADD COLUMN "version_legal_aceptada" VARCHAR(20);
