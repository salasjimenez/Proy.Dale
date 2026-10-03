export type ProgressMode = "TODAS" | "VOZ" | "TEXTO";

export type ProgressMetricKey =
  | "puntajeGeneral"
  | "puntajeRitmo"
  | "puntajePausas"
  | "puntajeMuletillas";

export type ProgressPoint = {
  id: string;
  fecha: string;
  modalidad: "VOZ" | "TEXTO";
  escenario: {
    slug: string;
    titulo: string;
    categoria: {
      codigo: string;
      nombre: string;
    };
    nivel: {
      codigo: string;
      nombre: string;
    };
  };
  metricas: {
    palabras: number;
    palabrasPorMinuto: number | null;
    cantidadPausas: number;
    pausaPromedioMs: number | null;
    muletillasTotal: number;
    repeticiones: number;
    puntajeRitmo: number | null;
    puntajePausas: number | null;
    puntajeMuletillas: number | null;
    puntajeGeneral: number | null;
  };
};

export type ProgressSummary = {
  totalCompletadas: number;
  puntosMostrados: number;
  puntajePromedio: number | null;
  puntajeActual: number | null;
  mejorPuntaje: number | null;
  cambioDesdePrimera: number | null;
  practicasVoz: number;
  practicasTexto: number;
  promedioPalabrasPorMinuto: number | null;
};

export type ProgressResponse = {
  data: {
    resumen: ProgressSummary;
    serie: ProgressPoint[];
  };
  meta: {
    modalidad: ProgressMode;
    limit: number;
    totalCompletadas: number;
  };
};
