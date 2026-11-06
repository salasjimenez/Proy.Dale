---
layout: default
title: "frontend/src/lib/charmyTrial.ts | Dale"
---

# frontend/src/lib/charmyTrial.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
/** Dale 0.16.5: prueba guiada de hasta 5 minutos, sin API ni persistencia. */
export const CHARMY_TRIAL_SECONDS = 300;

export const CHARMY_CASES = [
  {
    id: 'entrevista-trabajo',
    label: 'Entrevista laboral',
    area: 'Vida profesional',
    description: 'Practica tu presentación y responde preguntas inesperadas.',
    image: '/landing/entrevista-laboral.webp',
    icon: 'briefcase',
    intro: 'Estás en una entrevista y quieres explicar tu experiencia con naturalidad.',
    prompts: [
      'Imagina que soy quien te entrevista. ¿Cómo te presentarías en un minuto?',
      '¿Qué habilidad tuya te ayuda a resolver problemas? Dame un ejemplo concreto.',
      'Te voy a hacer una pregunta más exigente: ¿qué aprendiste de un error reciente?',
      'Si tuvieras que hacer una pregunta al final de esta entrevista, ¿cuál sería?',
      'Para terminar, resume por qué eres una buena opción y qué podrías aportar.',
    ],
  },
  {
    id: 'exposicion-clase',
    label: 'Exponer en público',
    area: 'Estudios',
    description: 'Presenta una idea y responde preguntas de forma ordenada.',
    image: '/landing/exposicion-clase.webp',
    icon: 'presentation',
    intro: 'Vas a presentar un tema a un grupo que no lo conoce.',
    prompts: [
      'Hola. Soy Charmy y estoy escuchando tu exposición. ¿Cuál es tu tema y por qué es importante?',
      'Explícame tu idea principal con un ejemplo fácil de entender.',
      'Una persona no entendió el ejemplo. ¿Cómo lo explicarías de otra manera?',
      '¿Qué pregunta podría hacerte el público y cómo responderías?',
      'Cierra tu exposición con una conclusión breve y memorable.',
    ],
  },
  {
    id: 'hacer-reclamo',
    label: 'Resolver un reclamo',
    area: 'Vida cotidiana',
    description: 'Expresa un problema, formula una petición y busca un acuerdo.',
    image: '/landing/hacer-reclamo.webp',
    icon: 'message-circle',
    intro: 'Necesitas explicar un problema a una persona de atención al público.',
    prompts: [
      'Soy quien atiende tu solicitud. ¿Qué ocurrió y qué necesitas resolver?',
      '¿Qué detalle o evidencia ayudaría a entender mejor tu situación?',
      'Te digo que hoy no podemos resolverlo. ¿Qué alternativa propondrías?',
      '¿Cómo mantendrías la conversación clara y respetuosa si no estás de acuerdo?',
      'Resume el acuerdo que buscarías y cuál sería el siguiente paso.',
    ],
  },
  {
    id: 'pedir-informacion',
    label: 'Pedir información',
    area: 'Trámites',
    description: 'Haz preguntas precisas y confirma las indicaciones recibidas.',
    image: '/landing/pedir-informacion.webp',
    icon: 'info',
    intro: 'Quieres consultar cómo realizar un trámite importante.',
    prompts: [
      'Hola, soy Charmy. ¿Qué trámite quieres realizar y qué información necesitas?',
      '¿Qué pregunta harías para conocer los requisitos y documentos?',
      'Te indico dos pasos, pero hay una parte confusa. ¿Cómo pedirías que la aclare?',
      '¿Cómo confirmarías horarios y plazos para evitar un error?',
      'Resume los pasos que entendiste y despídete de forma amable.',
    ],
  },
  {
    id: 'iniciar-conversacion',
    label: 'Iniciar una conversación',
    area: 'Vida social',
    description: 'Rompe el hielo y mantén una conversación natural.',
    image: '/landing/conversacion-social.webp',
    icon: 'users',
    intro: 'Estás conociendo a alguien en una actividad social.',
    prompts: [
      '¡Hola! Acabamos de coincidir en un evento. ¿Cómo iniciarías una conversación conmigo?',
      'Ahora quiero conocerte mejor. ¿Qué contarías sobre tus intereses?',
      'Se acaba el tema del que hablábamos. ¿Qué pregunta abierta me harías?',
      'Tenemos opiniones diferentes. ¿Cómo expresarías tu punto de vista con respeto?',
      '¿Cómo cerrarías esta conversación de manera cordial y natural?',
    ],
  },
  {
    id: 'hablar-con-jefatura',
    label: 'Conversación en el trabajo',
    area: 'Trabajo',
    description: 'Plantea una propuesta o explica una dificultad con claridad.',
    image: '/landing/atencion-cliente.webp',
    icon: 'sparkles',
    intro: 'Necesitas hablar con tu responsable sobre un asunto de trabajo.',
    prompts: [
      'Tenemos unos minutos para hablar. ¿Qué asunto necesitas plantearme?',
      '¿Qué contexto o datos me darías para explicar la situación?',
      'Te respondo que hay otras prioridades. ¿Cómo presentarías tu propuesta?',
      '¿Qué alternativa podrías ofrecer si la primera opción no funciona?',
      'Cierra la conversación resumiendo el acuerdo y el próximo paso.',
    ],
  },
] as const;

export type CharmyCaseId = (typeof CHARMY_CASES)[number]['id'];
export type CharmyCase = (typeof CHARMY_CASES)[number];

export function findCharmyCase(id: string | null | undefined): CharmyCase | null {
  return CHARMY_CASES.find((entry) => entry.id === id) ?? null;
}

export function formatTrialClock(seconds: number): string {
  const left = Math.max(0, CHARMY_TRIAL_SECONDS - Math.floor(Math.max(0, seconds)));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

/** Ruta de práctica autenticada existente; no incluye respuestas de invitado. */
export function continuedPracticeUrl(id: CharmyCaseId): string {
  return `/simulacion?${new URLSearchParams({ escenario: `${id}-basico`, modalidad: 'VOZ' })}`;
}

export function accountUrl(action: 'login' | 'registro', id: CharmyCaseId): string {
  return `/${action}?next=${encodeURIComponent(continuedPracticeUrl(id))}`;
}

export function guestObservation(answer: string): string {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (words < 10) return 'Buen comienzo. En el siguiente turno, prueba añadir el contexto y un ejemplo.';
  if (words < 25) return 'Has desarrollado una idea. Puedes mejorarla con un ejemplo y un cierre concreto.';
  return 'Has dado una respuesta desarrollada. Para la siguiente, intenta ordenar inicio, ejemplo y conclusión.';
}
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
