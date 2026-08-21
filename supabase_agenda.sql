-- ==============================================================================
-- FITPRO SUITE PRO — AGENDA DEL ENTRENADOR
-- ------------------------------------------------------------------------------
-- Tabla, índices, realtime y políticas RLS para las citas de la agenda
-- (sesiones de entrenamiento personal y citas de medición).
--
-- Sigue el mismo modelo que `finances` y `lesiones` en
-- `supabase_rls_policies.sql`: cada fila pertenece a un entrenador (`user_id`)
-- dentro de una sede (`gym_id`), y el atleta sólo puede leer las suyas.
--
-- Ejecutar una vez en el SQL Editor del proyecto de Supabase.
-- Es idempotente: se puede volver a correr sin romper nada.
-- ==============================================================================

-- ── TABLA ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agenda (
  id          text PRIMARY KEY,
  -- Nullable a propósito: el entrenador puede agendar a alguien que todavía no
  -- está dado de alta como cliente. Si el cliente se borra, la cita sobrevive
  -- con el nombre en `atleta` en lugar de desaparecer del historial.
  client_id   bigint REFERENCES clients(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id      text NOT NULL DEFAULT 'gym_central_01',
  atleta      text NOT NULL,
  tipo        text NOT NULL DEFAULT 'entrenamiento',
  fecha       date NOT NULL,
  hora        time NOT NULL,
  duracion    integer NOT NULL DEFAULT 60,
  lugar       text,
  notas       text,
  estado      text NOT NULL DEFAULT 'programada',
  creado_en   timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Sólo los dos tipos que el modelo distingue, y los tres estados de ciclo.
-- Si mañana se añade un tipo, hay que tocar TIPOS_CITA en app.js y esta
-- restricción a la vez: es a propósito, para que no se desincronicen en silencio.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agenda_tipo_check') THEN
    ALTER TABLE agenda ADD CONSTRAINT agenda_tipo_check
      CHECK (tipo IN ('entrenamiento', 'medicion'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agenda_estado_check') THEN
    ALTER TABLE agenda ADD CONSTRAINT agenda_estado_check
      CHECK (estado IN ('programada', 'completada', 'cancelada'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agenda_duracion_check') THEN
    ALTER TABLE agenda ADD CONSTRAINT agenda_duracion_check
      CHECK (duracion > 0 AND duracion <= 480);
  END IF;
END $$;

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────
-- La consulta principal es "mis citas de esta sede ordenadas por fecha y hora".
CREATE INDEX IF NOT EXISTS idx_agenda_user_gym_fecha ON agenda(user_id, gym_id, fecha, hora);
CREATE INDEX IF NOT EXISTS idx_agenda_client_id      ON agenda(client_id);

-- ── REALTIME ──────────────────────────────────────────────────────────────────
ALTER TABLE agenda REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'agenda'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agenda;
  END IF;
END $$;

-- ── updated_at AUTOMÁTICO ─────────────────────────────────────────────────────
-- El cliente ya manda `updated_at` en cada upsert, pero un trigger evita que una
-- escritura hecha desde otro sitio (SQL Editor, un script) deje el campo obsoleto.
CREATE OR REPLACE FUNCTION agenda_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agenda_updated_at ON agenda;
CREATE TRIGGER trg_agenda_updated_at
  BEFORE UPDATE ON agenda
  FOR EACH ROW EXECUTE FUNCTION agenda_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coaches_gym_agenda" ON agenda;
DROP POLICY IF EXISTS "athletes_select_own_agenda" ON agenda;

-- Coach/Admin: sus propias citas, o las de su sede si tiene rol de coach/admin.
CREATE POLICY "coaches_gym_agenda" ON agenda
  FOR ALL
  USING (
    user_id = auth.uid()
    OR (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('coach', 'admin')
      AND gym_id = (auth.jwt() -> 'user_metadata' ->> 'gym_id')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('coach', 'admin')
      AND gym_id = (auth.jwt() -> 'user_metadata' ->> 'gym_id')
    )
  );

-- Atleta: sólo LECTURA de las citas donde él es el cliente. No puede crear,
-- mover ni cancelar: la agenda la gobierna el entrenador.
CREATE POLICY "athletes_select_own_agenda" ON agenda
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE auth_user_id = auth.uid() OR email = (auth.jwt() ->> 'email')
    )
  );
