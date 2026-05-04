import type { WikiArticle } from '@/lib/types';

export const scientificNotationArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'scientific-notation',
  title: 'Abreviações de Notação Científica',
  summary: 'Um guia de referência para as abreviações de números grandes usadas no jogo.',
  content: 'Entender as abreviações para números grandes é crucial para medir seu poder e o HP dos inimigos. Aqui está um guia completo.',
  tags: ['notação', 'abreviação', 'números', 'guia', 'geral'],
  imageUrl: 'wiki-13',
  tables: {
    notation1: {
      headers: ['Abreviação', 'Nome', 'Notação Científica'],
      rows: [
        { Abreviação: 'k', Nome: 'Thousand', 'Notação Científica': '1.00E+003' },
        { Abreviação: 'M', Nome: 'Million', 'Notação Científica': '1.00E+006' },
        { Abreviação: 'B', Nome: 'Billion', 'Notação Científica': '1.00E+009' },
        { Abreviação: 'T', Nome: 'Trillion', 'Notação Científica': '1.00E+012' },
        { Abreviação: 'qd', Nome: 'Quadrillion', 'Notação Científica': '1.00E+015' },
        { Abreviação: 'Qn', Nome: 'Quintillion', 'Notação Científica': '1.00E+018' },
        { Abreviação: 'sx', Nome: 'Sextillion', 'Notação Científica': '1.00E+021' },
        { Abreviação: 'Sp', Nome: 'Septillion', 'Notação Científica': '1.00E+024' },
        { Abreviação: 'O', Nome: 'Octillion', 'Notação Científica': '1.00E+027' },
        { Abreviação: 'N', Nome: 'Nonillion', 'Notação Científica': '1.00E+030' },
      ],
    },
    notation2: {
        headers: ['Abreviação', 'Nome (Decillion)', 'Notação Científica'],
        rows: [
            { Abreviação: 'de', Nome: 'Decillion', 'Notação Científica': '1.00E+033' },
            { Abreviação: 'Ud', Nome: 'Undecillion', 'Notação Científica': '1.00E+036' },
            { Abreviação: 'dD', Nome: 'Duodecillion', 'Notação Científica': '1.00E+039' },
            { Abreviação: 'tD', Nome: 'Tredecillion', 'Notação Científica': '1.00E+042' },
            { Abreviação: 'qdD', Nome: 'Quattuordecillion', 'Notação Científica': '1.00E+045' },
            { Abreviação: 'QnD', Nome: 'Quindecillion', 'Notação Científica': '1.00E+048' },
            { Abreviação: 'sxD', Nome: 'Sexdecillion', 'Notação Científica': '1.00E+051' },
            { Abreviação: 'SpD', Nome: 'Septendecillion', 'Notação Científica': '1.00E+054' },
            { Abreviação: 'OcD', Nome: 'Octodecillion', 'Notação Científica': '1.00E+057' },
            { Abreviação: 'NvD', Nome: 'Novemdecillion', 'Notação Científica': '1.00E+060' },
        ]
    },
    notation3: {
        headers: ['Abreviação', 'Nome (Vigintillion)', 'Notação Científica'],
        rows: [
            { Abreviação: 'Vgn', Nome: 'Vigintillion', 'Notação Científica': '1.00E+063' },
            { Abreviação: 'UVg', Nome: 'Unvigintillion', 'Notação Científica': '1.00E+066' },
            { Abreviação: 'DVg', Nome: 'Duovigintillion', 'Notação Científica': '1.00E+069' },
            { Abreviação: 'TVg', Nome: 'Tresvigintillion', 'Notação Científica': '1.00E+072' },
            { Abreviação: 'qtV', Nome: 'Quattuorvigintillion', 'Notação Científica': '1.00E+075' },
            { Abreviação: 'QnV', Nome: 'Quinvigintillion', 'Notação Científica': '1.00E+078' },
            { Abreviação: 'SeV', Nome: 'Sesvigintillion', 'Notação Científica': '1.00E+081' },
            { Abreviação: 'SPG', Nome: 'Septenvigintillion', 'Notação Científica': '1.00E+084' },
            { Abreviação: 'OVG', Nome: 'Octovigintillion', 'Notação Científica': '1.00E+087' },
            { Abreviação: 'NVG', Nome: 'Novemvigintillion', 'Notação Científica': '1.00E+090' },
        ]
    },
    notation4: {
        headers: ['Abreviação', 'Nome (Trigintillion)', 'Notação Científica'],
        rows: [
            { Abreviação: 'TGN', Nome: 'Trigintillion', 'Notação Científica': '1.00E+093' },
            { Abreviação: 'UTG', Nome: 'Untrigintillion', 'Notação Científica': '1.00E+096' },
            { Abreviação: 'DTG', Nome: 'Duotrigintillion', 'Notação Científica': '1.00E+099' },
            { Abreviação: 'tsTG', Nome: 'Trestrigintillion', 'Notação Científica': '1.00E+102' },
            { Abreviação: 'qTG', Nome: 'Quattuortrigintillion', 'Notação Científica': '1.00E+105' },
            { Abreviação: 'QnTG', Nome: 'Quintrigintillion', 'Notação Científica': '1.00E+108' },
            { Abreviação: 'ssTG', Nome: 'Sestrigintillion', 'Notação Científica': '1.00E+111' },
            { Abreviação: 'SpTG', Nome: 'Septentrigintillion', 'Notação Científica': '1.00E+114' },
            { Abreviação: 'OcTG', Nome: 'Octotrigintillion', 'Notação Científica': '1.00E+117' },
            { Abreviação: 'NoTG', Nome: 'Noventrigintillion', 'Notação Científica': '1.00E+120' },
        ]
    },
    notation5: {
        headers: ['Abreviação', 'Nome (Quadragintillion)', 'Notação Científica'],
        rows: [
            { Abreviação: 'QDR', Nome: 'Quadragintillion', 'Notação Científica': '1.00E+123' },
            { Abreviação: 'uQDR', Nome: 'Unquadragintillion', 'Notação Científica': '1.00E+126' },
            { Abreviação: 'dQDR', Nome: 'Duoquadragintillion', 'Notação Científica': '1.00E+129' },
            { Abreviação: 'tQDR', Nome: 'Tresquadragintillion', 'Notação Científica': '1.00E+132' },
            { Abreviação: 'qdQDR', Nome: 'Quattuorquadragintillion', 'Notação Científica': '1.00E+135' },
            { Abreviação: 'QnQDR', Nome: 'Quinquadragintillion', 'Notação Científica': '1.00E+138' },
            { Abreviação: 'sxQDR', Nome: 'Sesquadragintillion', 'Notação Científica': '1.00E+141' },
            { Abreviação: 'SpQDR', Nome: 'Septenquadragintillion', 'Notação Científica': '1.00E+144' },
            { Abreviação: 'OQQDR', Nome: 'Octoquadragintillion', 'Notação Científica': '1.00E+147' },
            { Abreviação: 'NQQDR', Nome: 'Novemquadragintillion', 'Notação Científica': '1soo.E+150' },
        ]
    }
  }
};
