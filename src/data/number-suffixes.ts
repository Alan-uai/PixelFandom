export interface NumberSuffix {
  suffix: string;
  exponent: number;
}

function makeEntry(suffix: string, exp: number): NumberSuffix {
  return { suffix, exponent: exp };
}

export const NUMBER_SUFFIXES: NumberSuffix[] = [
  makeEntry('K', 3),
  makeEntry('M', 6),
  makeEntry('B', 9),
  makeEntry('T', 12),
  makeEntry('Qd', 15),
  makeEntry('Qn', 18),
  makeEntry('Sx', 21),
  makeEntry('Sp', 24),
  makeEntry('Oc', 27),
  makeEntry('No', 30),
  makeEntry('De', 33),
  makeEntry('UDe', 36),
  makeEntry('DDe', 39),
  makeEntry('TDe', 42),
  makeEntry('QdDe', 45),
  makeEntry('QnDe', 48),
  makeEntry('SxDe', 51),
  makeEntry('SpDe', 54),
  makeEntry('OcDe', 57),
  makeEntry('NoDe', 60),
  makeEntry('Vt', 63),
  makeEntry('UVt', 66),
  makeEntry('DVt', 69),
  makeEntry('TVt', 72),
  makeEntry('QdVt', 75),
  makeEntry('QnVt', 78),
  makeEntry('SxVt', 81),
  makeEntry('SpVt', 84),
  makeEntry('OcVt', 87),
  makeEntry('NoVt', 90),
  makeEntry('Tg', 93),
  makeEntry('UTg', 96),
  makeEntry('DTg', 99),
  makeEntry('TTg', 102),
  makeEntry('QdTg', 105),
  makeEntry('QnTg', 108),
  makeEntry('SxTg', 111),
  makeEntry('SpTg', 114),
  makeEntry('OcTg', 117),
  makeEntry('NoTg', 120),
  makeEntry('Qg', 123),
  makeEntry('UQg', 126),
  makeEntry('DQg', 129),
  makeEntry('TQg', 132),
  makeEntry('QdQg', 135),
  makeEntry('QnQg', 138),
  makeEntry('SxQg', 141),
  makeEntry('SpQg', 144),
  makeEntry('OcQg', 147),
  makeEntry('NoQg', 150),
  makeEntry('Qi', 153),
  makeEntry('UQi', 156),
  makeEntry('DQi', 159),
  makeEntry('TQi', 162),
  makeEntry('QdQi', 165),
  makeEntry('QnQi', 168),
  makeEntry('SxQi', 171),
  makeEntry('SpQi', 174),
  makeEntry('OcQi', 177),
  makeEntry('NoQi', 180),
  makeEntry('Sg', 183),
  makeEntry('USg', 186),
  makeEntry('DSg', 189),
  makeEntry('TSg', 192),
  makeEntry('QdSg', 195),
  makeEntry('QnSg', 198),
  makeEntry('SxSg', 201),
  makeEntry('SpSg', 204),
  makeEntry('OcSg', 207),
  makeEntry('NoSg', 210),
  makeEntry('St', 213),
  makeEntry('USt', 216),
  makeEntry('DSt', 219),
  makeEntry('TSt', 222),
  makeEntry('QdSt', 225),
  makeEntry('QnSt', 228),
  makeEntry('SxSt', 231),
  makeEntry('SpSt', 234),
  makeEntry('OcSt', 237),
  makeEntry('NoSt', 240),
  makeEntry('Og', 243),
  makeEntry('UOg', 246),
  makeEntry('DOg', 249),
  makeEntry('TOg', 252),
  makeEntry('QdOg', 255),
  makeEntry('QnOg', 258),
  makeEntry('SxOg', 261),
  makeEntry('SpOg', 264),
  makeEntry('OcOg', 267),
  makeEntry('NoOg', 270),
  makeEntry('Ng', 273),
  makeEntry('UNg', 276),
  makeEntry('DNg', 279),
  makeEntry('TNg', 282),
  makeEntry('QdNg', 285),
  makeEntry('QnNg', 288),
  makeEntry('SxNg', 291),
  makeEntry('SpNg', 294),
  makeEntry('OcNg', 297),
  makeEntry('NoNg', 300),
  makeEntry('Ce', 303),
  makeEntry('Du', 603),
  makeEntry('Tr', 903),
  makeEntry('Qa', 1203),
  makeEntry('Qi', 1503),
  makeEntry('Se', 1803),
  makeEntry('Si', 2103),
  makeEntry('Ot', 2403),
  makeEntry('Ni', 2703),
  makeEntry('Mi', 3003),
];

export function findSuffix(n: number): NumberSuffix | null {
  const abs = Math.abs(n);
  if (!isFinite(abs)) {
    const last = NUMBER_SUFFIXES[NUMBER_SUFFIXES.length - 1];
    return last;
  }
  const log10 = Math.log10(abs);
  for (let i = NUMBER_SUFFIXES.length - 1; i >= 0; i--) {
    if (log10 >= NUMBER_SUFFIXES[i].exponent) {
      return NUMBER_SUFFIXES[i];
    }
  }
  return null;
}

export const SCIENTIFIC_THRESHOLD = 10000;
