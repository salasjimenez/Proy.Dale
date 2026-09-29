export type ScenarioCardData = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  situacion: string;
  instrucciones: string;
  categoria: {
    codigo: string;
    nombre: string;
  };
  nivel: {
    codigo: string;
    nombre: string;
  };
};
