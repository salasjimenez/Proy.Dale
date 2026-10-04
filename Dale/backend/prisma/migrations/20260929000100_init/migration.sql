-- CreateEnum
CREATE TYPE "categoria_escenario" AS ENUM ('LABORAL', 'TRAMITES_CALLE', 'SOCIAL', 'JOVENES_ESTUDIANTES');

-- CreateEnum
CREATE TYPE "nivel_dificultad" AS ENUM ('BASICO', 'INTERMEDIO', 'DIFICIL');

-- CreateEnum
CREATE TYPE "modalidad_respuesta" AS ENUM ('VOZ', 'TEXTO');

-- CreateEnum
CREATE TYPE "estado_sesion" AS ENUM ('INICIADA', 'COMPLETADA', 'ABANDONADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(100),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escenarios" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "situacion" TEXT NOT NULL,
    "instrucciones" TEXT,
    "categoria" "categoria_escenario" NOT NULL,
    "nivel" "nivel_dificultad" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "escenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "escenario_id" UUID NOT NULL,
    "modalidad" "modalidad_respuesta" NOT NULL,
    "estado" "estado_sesion" NOT NULL DEFAULT 'INICIADA',
    "transcripcion" TEXT,
    "duracion_ms" INTEGER,
    "iniciada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizada_en" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metricas" (
    "id" UUID NOT NULL,
    "sesion_id" UUID NOT NULL,
    "palabras" INTEGER NOT NULL DEFAULT 0,
    "palabras_por_minuto" DOUBLE PRECISION,
    "cantidad_pausas" INTEGER NOT NULL DEFAULT 0,
    "duracion_pausas_ms" INTEGER NOT NULL DEFAULT 0,
    "pausa_promedio_ms" DOUBLE PRECISION,
    "pausa_maxima_ms" INTEGER,
    "muletillas_total" INTEGER NOT NULL DEFAULT 0,
    "muletillas_detalle" JSONB,
    "repeticiones" INTEGER NOT NULL DEFAULT 0,
    "puntaje_ritmo" INTEGER,
    "puntaje_pausas" INTEGER,
    "puntaje_muletillas" INTEGER,
    "puntaje_general" INTEGER,
    "pausas_detalle" JSONB,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "metricas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "escenarios_slug_key" ON "escenarios"("slug");

-- CreateIndex
CREATE INDEX "escenarios_categoria_nivel_activo_idx" ON "escenarios"("categoria", "nivel", "activo");

-- CreateIndex
CREATE INDEX "escenarios_activo_orden_idx" ON "escenarios"("activo", "orden");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_creado_en_idx" ON "sesiones"("usuario_id", "creado_en");

-- CreateIndex
CREATE INDEX "sesiones_escenario_id_idx" ON "sesiones"("escenario_id");

-- CreateIndex
CREATE INDEX "sesiones_estado_idx" ON "sesiones"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "metricas_sesion_id_key" ON "metricas"("sesion_id");

-- CreateIndex
CREATE INDEX "metricas_puntaje_general_idx" ON "metricas"("puntaje_general");

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_escenario_id_fkey" FOREIGN KEY ("escenario_id") REFERENCES "escenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metricas" ADD CONSTRAINT "metricas_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
