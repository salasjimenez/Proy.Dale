export type PracticeMetric = {
  id: string;
  palabras: number;
  palabrasPorMinuto: number | null;
  cantidadPausas: number;
  duracionPausasMs: number;
  pausaPromedioMs: number | null;
  pausaMaximaMs: number | null;
  muletillasTotal: number;
  muletillasDetalle: Record<string, number> | null;
  repeticiones: number;
  puntajeRitmo: number | null;
  puntajePausas: number | null;
  puntajeMuletillas: number | null;
  puntajeGeneral: number | null;
};

export type PracticeFeedback = {
  strengths: string[];
  suggestions: string[];
  note: string;
};

export type PracticeScenario = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  situacion: string;
  instrucciones: string | null;
  categoria: {
    codigo: string;
    nombre: string;
  };
  nivel: {
    codigo: string;
    nombre: string;
  };
};

export type PracticeSession = {
  id: string;
  modalidad: "TEXTO" | "VOZ";
  estado: "INICIADA" | "COMPLETADA" | "ABANDONADA";
  transcripcion: string | null;
  duracionMs: number | null;
  iniciadaEn: string;
  finalizadaEn: string | null;
  creadoEn: string;
  escenario: PracticeScenario;
  metrica: PracticeMetric | null;
  feedback?: PracticeFeedback;
};

export type PracticeSessionResponse = {
  data: {
    session: PracticeSession;
  };
};

export type PracticeSessionListResponse = {
  data: PracticeSession[];
  meta: {
    total: number;
    limit: number;
  };
};
