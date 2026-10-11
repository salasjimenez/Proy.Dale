import {
  CategoriaEscenario,
  NivelDificultad,
  PrismaClient,
} from "@prisma/client";

// El seed crea solo escenarios. Nunca crea usuarios ni elude su aceptación legal.
const prisma = new PrismaClient();

type ScenarioTemplate = {
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaEscenario;
  orden: number;
  situaciones: Record<NivelDificultad, string>;
  instrucciones: Record<NivelDificultad, string>;
};

const levelSlug: Record<NivelDificultad, string> = {
  BASICO: "basico",
  INTERMEDIO: "intermedio",
  DIFICIL: "dificil",
};

const templates: ScenarioTemplate[] = [
  {
    slug: "entrevista-trabajo",
    titulo: "Entrevista de trabajo",
    descripcion: "Practica cómo presentarte y responder preguntas de una entrevista laboral.",
    categoria: CategoriaEscenario.LABORAL,
    orden: 10,
    situaciones: {
      BASICO: "La persona entrevistadora te pide que te presentes y cuentes brevemente quién eres.",
      INTERMEDIO: "Te preguntan por una dificultad que hayas enfrentado y cómo la resolviste.",
      DIFICIL: "Te preguntan por qué deberían elegirte frente a otros candidatos y te piden justificar tu respuesta con ejemplos.",
    },
    instrucciones: {
      BASICO: "Responde en 30 a 60 segundos. Prioriza claridad, orden y una presentación sencilla.",
      INTERMEDIO: "Usa una situación concreta: contexto, acción y resultado. Evita respuestas demasiado largas.",
      DIFICIL: "Argumenta con evidencia concreta. Mantén un ritmo estable aunque la pregunta sea exigente.",
    },
  },
  {
    slug: "pedir-aumento",
    titulo: "Pedir un aumento",
    descripcion: "Ensaya una conversación profesional para solicitar una revisión salarial.",
    categoria: CategoriaEscenario.LABORAL,
    orden: 20,
    situaciones: {
      BASICO: "Solicitas una reunión para conversar sobre tu crecimiento y compensación.",
      INTERMEDIO: "Tu responsable te pregunta qué resultados concretos respaldan tu solicitud.",
      DIFICIL: "Tu responsable indica que no hay presupuesto inmediato y te pide explicar qué alternativa propones.",
    },
    instrucciones: {
      BASICO: "Explica el motivo con respeto y sin disculparte excesivamente por plantearlo.",
      INTERMEDIO: "Menciona dos o tres aportes medibles y formula una petición concreta.",
      DIFICIL: "Mantén la calma, reconoce la restricción y negocia próximos pasos verificables.",
    },
  },
  {
    slug: "hablar-con-jefatura",
    titulo: "Hablar con tu jefatura",
    descripcion: "Practica cómo comunicar un problema laboral de forma directa y profesional.",
    categoria: CategoriaEscenario.LABORAL,
    orden: 30,
    situaciones: {
      BASICO: "Necesitas informar que una tarea se retrasará y explicar el motivo.",
      INTERMEDIO: "Debes señalar que una prioridad nueva entra en conflicto con trabajo ya comprometido.",
      DIFICIL: "Debes discrepar con una decisión de tu jefatura que puede afectar un resultado importante.",
    },
    instrucciones: {
      BASICO: "Indica el hecho, el impacto y el nuevo plazo propuesto.",
      INTERMEDIO: "Expón el conflicto de prioridades y solicita una decisión explícita.",
      DIFICIL: "Separa hechos de opiniones, propone una alternativa y evita un tono confrontacional.",
    },
  },
  {
    slug: "hacer-reclamo",
    titulo: "Hacer un reclamo",
    descripcion: "Practica cómo explicar un problema y pedir una solución sin perder claridad.",
    categoria: CategoriaEscenario.TRAMITES_CALLE,
    orden: 40,
    situaciones: {
      BASICO: "Un servicio que pagaste no fue entregado como se ofreció y explicas el problema en atención al cliente.",
      INTERMEDIO: "La primera respuesta no resuelve tu problema y debes repetir tu solicitud con precisión.",
      DIFICIL: "Te indican que no pueden ayudarte y necesitas solicitar una escalación o una respuesta formal.",
    },
    instrucciones: {
      BASICO: "Describe qué ocurrió, cuándo ocurrió y qué solución esperas.",
      INTERMEDIO: "Reformula sin elevar el tono. Evita repetir información innecesaria.",
      DIFICIL: "Mantén firmeza, solicita el siguiente canal de atención y confirma los próximos pasos.",
    },
  },
  {
    slug: "pedir-informacion",
    titulo: "Pedir información",
    descripcion: "Entrena preguntas claras para obtener información en un trámite o servicio.",
    categoria: CategoriaEscenario.TRAMITES_CALLE,
    orden: 50,
    situaciones: {
      BASICO: "Necesitas saber qué documentos debes presentar para realizar un trámite.",
      INTERMEDIO: "La explicación que recibes es incompleta y debes hacer preguntas de seguimiento.",
      DIFICIL: "Recibes indicaciones contradictorias y necesitas confirmar cuál procedimiento corresponde.",
    },
    instrucciones: {
      BASICO: "Pregunta una cosa a la vez y confirma los requisitos principales.",
      INTERMEDIO: "Identifica qué información falta y formula preguntas específicas.",
      DIFICIL: "Resume lo entendido y pide que confirmen el procedimiento correcto antes de retirarte.",
    },
  },
  {
    slug: "cobro-incorrecto",
    titulo: "Resolver un cobro incorrecto",
    descripcion: "Practica cómo cuestionar un cobro y solicitar una corrección con datos concretos.",
    categoria: CategoriaEscenario.TRAMITES_CALLE,
    orden: 60,
    situaciones: {
      BASICO: "Detectas un monto que no reconoces en una cuenta y consultas qué corresponde.",
      INTERMEDIO: "Te explican el cobro, pero la explicación no coincide con tu comprobante.",
      DIFICIL: "La persona que atiende mantiene el cobro y debes solicitar revisión formal aportando tus evidencias.",
    },
    instrucciones: {
      BASICO: "Indica el monto, fecha y motivo de tu consulta.",
      INTERMEDIO: "Contrasta la explicación con la información que tienes sin asumir mala intención.",
      DIFICIL: "Pide una revisión, número de caso o constancia y confirma el plazo de respuesta.",
    },
  },
  {
    slug: "iniciar-conversacion",
    titulo: "Iniciar una conversación",
    descripcion: "Practica una apertura sencilla para hablar con alguien que no conoces bien.",
    categoria: CategoriaEscenario.SOCIAL,
    orden: 70,
    situaciones: {
      BASICO: "Coincides con una persona en una actividad y quieres iniciar una conversación breve.",
      INTERMEDIO: "La respuesta inicial es corta y necesitas continuar sin convertirlo en un interrogatorio.",
      DIFICIL: "Te integras a un grupo que ya está conversando y buscas participar de manera natural.",
    },
    instrucciones: {
      BASICO: "Usa una observación del contexto y una pregunta sencilla.",
      INTERMEDIO: "Alterna preguntas con información breve sobre ti para equilibrar la conversación.",
      DIFICIL: "Escucha primero, conecta con el tema existente y evita interrumpir abruptamente.",
    },
  },
  {
    slug: "expresar-desacuerdo",
    titulo: "Expresar desacuerdo",
    descripcion: "Practica cómo decir que no estás de acuerdo sin convertir la conversación en un conflicto.",
    categoria: CategoriaEscenario.SOCIAL,
    orden: 80,
    situaciones: {
      BASICO: "Un amigo propone un plan que no te acomoda y quieres sugerir otra opción.",
      INTERMEDIO: "Alguien interpreta tu desacuerdo como una crítica personal y debes aclarar tu punto.",
      DIFICIL: "La conversación se vuelve tensa y necesitas mantener tu posición sin atacar a la otra persona.",
    },
    instrucciones: {
      BASICO: "Di qué prefieres y ofrece una alternativa concreta.",
      INTERMEDIO: "Aclara que estás discutiendo la idea, no calificando a la persona.",
      DIFICIL: "Reduce la velocidad, reconoce el punto contrario y formula tu posición con límites claros.",
    },
  },
  {
    slug: "pedir-ayuda",
    titulo: "Pedir ayuda",
    descripcion: "Entrena una solicitud de ayuda concreta y fácil de entender.",
    categoria: CategoriaEscenario.SOCIAL,
    orden: 90,
    situaciones: {
      BASICO: "Necesitas ayuda con una tarea concreta y se la pides a una persona de confianza.",
      INTERMEDIO: "La persona está ocupada y debes explicar qué necesitas y para cuándo.",
      DIFICIL: "Te cuesta pedir apoyo, pero la situación ya supera lo que puedes resolver solo.",
    },
    instrucciones: {
      BASICO: "Explica brevemente qué necesitas y pregunta si la persona puede ayudarte.",
      INTERMEDIO: "Delimita tiempo, alcance y urgencia para que la solicitud sea clara.",
      DIFICIL: "Evita minimizar demasiado la necesidad. Expón el problema y pide una acción específica.",
    },
  },
  {
    slug: "exposicion-clase",
    titulo: "Exposición en clase",
    descripcion: "Practica cómo presentar una idea frente a compañeros o docentes.",
    categoria: CategoriaEscenario.JOVENES_ESTUDIANTES,
    orden: 100,
    situaciones: {
      BASICO: "Debes explicar el tema principal de tu exposición durante un minuto.",
      INTERMEDIO: "Durante la exposición te hacen una pregunta que requiere aclarar una idea.",
      DIFICIL: "Te hacen una pregunta crítica sobre una debilidad de tu trabajo y debes responder sin bloquearte.",
    },
    instrucciones: {
      BASICO: "Usa una apertura, una idea principal y un cierre.",
      INTERMEDIO: "Escucha la pregunta completa, responde primero lo central y luego amplía.",
      DIFICIL: "Si no sabes algo, reconoce el límite y explica lo que sí puedes sostener con seguridad.",
    },
  },
  {
    slug: "hablar-con-profesor",
    titulo: "Hablar con un profesor",
    descripcion: "Practica cómo plantear dudas, dificultades o solicitudes académicas.",
    categoria: CategoriaEscenario.JOVENES_ESTUDIANTES,
    orden: 110,
    situaciones: {
      BASICO: "No entendiste una parte de la clase y quieres pedir una explicación adicional.",
      INTERMEDIO: "Tienes un problema con una entrega y necesitas explicar la situación y proponer una solución.",
      DIFICIL: "No estás de acuerdo con una evaluación y quieres solicitar una revisión argumentada.",
    },
    instrucciones: {
      BASICO: "Señala exactamente qué parte no entendiste y formula una pregunta concreta.",
      INTERMEDIO: "Explica el problema sin excusas extensas y propón una alternativa realista.",
      DIFICIL: "Habla desde criterios y evidencias. Pide revisión sin exigir un resultado específico.",
    },
  },
  {
    slug: "entrevista-beca",
    titulo: "Entrevista para una beca",
    descripcion: "Practica cómo explicar tus objetivos, motivación y experiencia académica.",
    categoria: CategoriaEscenario.JOVENES_ESTUDIANTES,
    orden: 120,
    situaciones: {
      BASICO: "Te preguntan por qué quieres obtener la beca y qué quieres estudiar o desarrollar.",
      INTERMEDIO: "Te piden explicar un logro del que estés orgulloso y qué aprendiste de él.",
      DIFICIL: "Te preguntan qué harías si no obtienes la beca y por qué deberían invertir en tu formación.",
    },
    instrucciones: {
      BASICO: "Relaciona la beca con un objetivo concreto y evita respuestas genéricas.",
      INTERMEDIO: "Cuenta un ejemplo real y explica qué cambió gracias a esa experiencia.",
      DIFICIL: "Muestra iniciativa y un plan alternativo sin restar importancia a la oportunidad.",
    },
  },
];

async function seedScenarios(): Promise<void> {
  const levels = Object.values(NivelDificultad);
  let processed = 0;

  for (const template of templates) {
    for (const [levelIndex, nivel] of levels.entries()) {
      const slug = `${template.slug}-${levelSlug[nivel]}`;
      const data = {
        slug,
        titulo: template.titulo,
        descripcion: template.descripcion,
        situacion: template.situaciones[nivel],
        instrucciones: template.instrucciones[nivel],
        categoria: template.categoria,
        nivel,
        activo: true,
        orden: template.orden + levelIndex,
      };

      await prisma.escenario.upsert({
        where: { slug },
        update: data,
        create: data,
      });

      processed += 1;
    }
  }

  console.log(`Dale seed completed: ${processed} scenario levels available.`);
}

seedScenarios()
  .catch((error) => {
    console.error("Dale seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
