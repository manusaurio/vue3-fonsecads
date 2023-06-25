const templates: string[] = [
  'sé cauteloso con ***',
  'que viva ***',
  'hay visiones de ***',
  '*** es necesidad adelante',
];

interface Filler {
  category: string,
  choices: string[],
}

const fillers: Filler[] = [
  {
    category: 'carreras',
    choices: [
      'el diseño multimedial',
      'las artes plásticas',
      'la música',
      'la historia del arte',
    ],
  },
  {
    category: 'acciones',
    choices: [
      'ordenar',
      'desordenar todo',
      'saltarse las clases',
      'asistir a clase',
      'estudiar',
      'conseguir apuntes',
      'tener todo al día',
      'entrar al salón',
      'salir del salón',
    ],
  },

  {
    category: 'objetos',
    choices: [
      'las sillas',
      'los bancos',
      'les estudiantes',
      'las autoridades',
      'la comida',
      'los útiles',
    ],
  },
  {
    category: 'geografía',
    choices: [
      'el patio',
      'el baño',
      'el salón de clase',
      'las escaleras',
      'el ascensor',
      'diagonal 78',
      'la salida principal',
    ],
  },
  {
    category: 'conceptos',
    choices: [
      'la cantidad de gente',
      'la suciedad',
      'la limpieza',
      'la velocidad',
      'el tiempo de clase',
      'la felicidad',
      'la tristeza',
      'las votaciones',
    ],
  },
];

const conjunctions: string[] = [
  'por lo tanto',
  'por sobre todo',
  'sin embargo',
  'a pesar de eso',
  'y además',
  'específicamente',
];

const NULL_CONJUNCTION = 0xffn;

const fillersMap = new Map();
const categoryRanges = new Map();

let range = 0n;

for (let i = 0; i < fillers.length; i++) {
  const category = fillers[i];
  let n = 0n;

  for (let j = 0; j < category.choices.length; j++) {
    const choice = category.choices[j];
    fillersMap.set(range + (n++), choice);
  }

  categoryRanges.set(category.category, [range, range + n - 1n]);
  range += 64n;
}

class Message {
  template1?: bigint;

  filler1?: bigint;

  conjunction: bigint;

  template2?: bigint;

  filler2?: bigint;

  constructor(
    template1?: bigint,
    filler1?: bigint,
    // eslint-disable-next-line
    conjunction: bigint = NULL_CONJUNCTION,
    template2?: bigint,
    filler2?: bigint,
  ) {
    this.template1 = template1;
    this.filler1 = filler1;
    this.conjunction = conjunction;
    this.template2 = template2;
    this.filler2 = filler2;
  }

  static fromString(s: string) {
    const asBigInt = BigInt(s);
    const template1 = asBigInt & 0xffn;
    const filler1 = asBigInt >> 8n & 0xfffn;
    const conjunction = asBigInt >> 20n & 0xffn;
    const template2 = asBigInt >> 28n & 0xffn;
    const filler2 = asBigInt >> 36n & 0xfffn;

    return new Message(template1, filler1, conjunction, template2, filler2);
  }

  toString(): string {
    // i'm tired and feeling lazy so let's write a one liner
    return (this.template1 !== undefined
      ? templates[Number(this.template1)].replace('***', fillersMap.get(this.filler1) ?? '***') : '')
        + (this.conjunction < NULL_CONJUNCTION
          ? `, ${conjunctions[Number(this.conjunction)]} ` + (this.template2 !== undefined
            ? templates[Number(this.template2)].replace('***', fillersMap.get(this.filler2) ?? '***') : '') : '');
  }

  toBigInt() {
    return (this.template1 ?? 0n)
      + ((this.filler1 ?? 0n) << 8n)
      + (NULL_CONJUNCTION << 20n)
      + ((this.template2 ?? 0n) << 28n)
      + ((this.filler2 ?? 0n) << 36n);
  }

  isValid() {
    return this.template1 !== undefined && this.template1 >= 0 && this.template1 < templates.length
      && fillersMap.has(this.filler1)
      && (this.conjunction === NULL_CONJUNCTION
        || this.conjunction >= 0 && this.conjunction < conjunctions.length
        && this.template2 !== undefined && this.template2 >= 0 && this.template2 < templates.length
        && fillersMap.has(this.filler2));
  }
}

export {
  Message, Filler,
  templates, fillersMap, conjunctions,
  NULL_CONJUNCTION, categoryRanges,
};
