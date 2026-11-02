import type { FruitStorageProfile } from '@/types';

export const fruitProfiles: FruitStorageProfile[] = [
  {
    id: 'uva-mesa-padrao',
    fruit: 'Uva de mesa',
    maturityStage: 'Padrão pós-colheita',
    temperatureMinC: -1,
    temperatureMaxC: 0,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl: 'https://postharvest.ucdavis.edu/produce-facts-sheets/grape',
    notes:
      'Valores de referência científica para conservação pós-colheita. Não representam limites operacionais definitivos para todos os cultivares e processos de transporte.',
  },
  {
    id: 'manga-verde-madura',
    fruit: 'Manga',
    maturityStage: 'Verde-madura',
    temperatureMinC: 13,
    temperatureMaxC: 13,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl: 'https://postharvest.ucdavis.edu/produce-facts-sheets/mango',
    notes:
      'Temperatura ótima única (13 °C) — tratar como alvo de referência, não como prova de que qualquer pequeno desvio danifica a fruta.',
  },
  {
    id: 'manga-parcialmente-madura',
    fruit: 'Manga',
    maturityStage: 'Parcialmente madura/madura',
    temperatureMinC: 10,
    temperatureMaxC: 10,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl: 'https://postharvest.ucdavis.edu/produce-facts-sheets/mango',
    notes:
      'Temperatura ótima única (10 °C) — tratar como alvo de referência.',
  },
  {
    id: 'goiaba-verde-madura',
    fruit: 'Goiaba',
    maturityStage: 'Verde-madura/parcialmente madura',
    temperatureMinC: 8,
    temperatureMaxC: 10,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl:
      'https://postharvest.ucdavis.edu/ar/produce-facts-sheets/guava',
    notes:
      'Valores de referência científica para conservação pós-colheita. Limites operacionais devem ser definidos por responsável técnico conforme cultivar e condições de transporte.',
  },
  {
    id: 'goiaba-madura',
    fruit: 'Goiaba',
    maturityStage: 'Madura',
    temperatureMinC: 5,
    temperatureMaxC: 8,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl:
      'https://postharvest.ucdavis.edu/ar/produce-facts-sheets/guava',
    notes:
      'Valores de referência científica. Goiabas maduras requerem temperaturas mais baixas que verde-maduras.',
  },
  {
    id: 'banana-verde-madura',
    fruit: 'Banana',
    maturityStage: 'Verde-madura',
    temperatureMinC: 13,
    temperatureMaxC: 14,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl:
      'https://postharvest.ucdavis.edu/ar/produce-facts-sheets/banana',
    notes:
      'Bananas são sensíveis a chilling injury abaixo de 13 °C. Valores de referência científica.',
  },
  {
    id: 'mamao-verde-maduro',
    fruit: 'Mamão',
    maturityStage: 'Verde-maduro',
    temperatureMinC: 13,
    temperatureMaxC: 13,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl:
      'https://postharvest.ucdavis.edu/ar/produce-facts-sheets/papaya',
    notes:
      'Temperatura ótima única (13 °C) — tratar como alvo de referência.',
  },
  {
    id: 'mamao-parcialmente-maduro',
    fruit: 'Mamão',
    maturityStage: 'Parcialmente maduro',
    temperatureMinC: 10,
    temperatureMaxC: 10,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl:
      'https://postharvest.ucdavis.edu/ar/produce-facts-sheets/papaya',
    notes:
      'Temperatura ótima única (10 °C) — tratar como alvo de referência.',
  },
  {
    id: 'mamao-maduro',
    fruit: 'Mamão',
    maturityStage: 'Maduro',
    temperatureMinC: 7,
    temperatureMaxC: 7,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl:
      'https://postharvest.ucdavis.edu/ar/produce-facts-sheets/papaya',
    notes:
      'Temperatura ótima única (7 °C) — tratar como alvo de referência.',
  },
  {
    id: 'melao-honeydew-padrao',
    fruit: 'Melão honeydew',
    maturityStage: 'Padrão pós-colheita',
    temperatureMinC: 7,
    temperatureMaxC: 10,
    relativeHumidityMin: 85,
    relativeHumidityMax: 90,
    sourceUrl:
      'https://postharvest.ucdavis.edu/produce-facts-sheets/honeydew',
    notes:
      'Valores de referência científica. Faixa de umidade relativa ligeiramente inferior à maioria das frutas tropicais.',
  },
  {
    id: 'melao-cantaloupe-padrao',
    fruit: 'Melão cantaloupe',
    maturityStage: 'Padrão pós-colheita',
    temperatureMinC: 2.2,
    temperatureMaxC: 5,
    relativeHumidityMin: 90,
    relativeHumidityMax: 95,
    sourceUrl:
      'https://postharvest.ucdavis.edu/produce-facts-sheets/cantaloupe',
    notes:
      'Valores de referência científica. Cantaloupe tolera temperaturas mais baixas que honeydew.',
  },
];

export function getFruitProfileById(
  id: string,
): FruitStorageProfile | undefined {
  return fruitProfiles.find((p) => p.id === id);
}

export function getFruitProfilesByFruit(fruit: string): FruitStorageProfile[] {
  return fruitProfiles.filter(
    (p) => p.fruit.toLowerCase() === fruit.toLowerCase(),
  );
}
