export type ScenarioMapMode = "TODAS" | "VOZ" | "TEXTO";

export type ScenarioMapCategoryCode =
  | "LABORAL"
  | "TRAMITES_CALLE"
  | "SOCIAL"
  | "JOVENES_ESTUDIANTES";

export type ScenarioMapCategory = {
  codigo: ScenarioMapCategoryCode;
  nombre: string;
  puntajePromedio: number | null;
  intentos: number;
  ultimoPuntaje: number | null;
  mejorPuntaje: number | null;
  nivelesPracticados: number;
  ultimaPractica: string | null;
};

export type ScenarioMapHighlight = {
  codigo: ScenarioMapCategoryCode;
  nombre: string;
  puntaje: number | null;
};

export type ScenarioMapResponse = {
  data: {
    resumen: {
      totalCompletadas: number;
      categoriasConDatos: number;
      categoriasTotales: number;
      coberturaPorcentaje: number;
      puntajePromedioGlobal: number | null;
      fortalezaActual: ScenarioMapHighlight | null;
      areaMenorPromedio: ScenarioMapHighlight | null;
      siguienteCategoriaSugerida: {
        codigo: ScenarioMapCategoryCode;
        nombre: string;
        tieneDatos: boolean;
      } | null;
    };
    categorias: ScenarioMapCategory[];
  };
  meta: {
    modalidad: ScenarioMapMode;
  };
};
