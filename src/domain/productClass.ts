export interface ProductClass {
  id: string;
  nome: string;
  codigoInicial: number;
  codigoFinal: number;
  ultimoCodigo: number;
}

export const DEFAULT_PRODUCT_CLASSES: Omit<ProductClass, 'id' | 'ultimoCodigo'>[] = [
  { nome: 'Abraçadeira Selim', codigoInicial: 1000, codigoFinal: 1999 },
  { nome: 'Acessórios', codigoInicial: 2000, codigoFinal: 2999 },
  { nome: 'Alavancas', codigoInicial: 3000, codigoFinal: 3999 },
  { nome: 'Aros', codigoInicial: 4000, codigoFinal: 4999 },
  { nome: 'Câmaras', codigoInicial: 5000, codigoFinal: 5999 },
  { nome: 'Câmbios', codigoInicial: 6000, codigoFinal: 6999 },
  { nome: 'Canote Selim', codigoInicial: 7000, codigoFinal: 7999 },
  { nome: 'Corrente', codigoInicial: 8000, codigoFinal: 8999 },
  { nome: 'Cubos', codigoInicial: 9000, codigoFinal: 9999 },
  { nome: 'Freio', codigoInicial: 10000, codigoFinal: 10999 },
  { nome: 'Guidão', codigoInicial: 11000, codigoFinal: 11999 },
  { nome: 'Manoplas', codigoInicial: 12000, codigoFinal: 12999 },
  { nome: 'Movimento Central', codigoInicial: 13000, codigoFinal: 13999 },
  { nome: 'Movimento Direção', codigoInicial: 14000, codigoFinal: 14999 },
  { nome: 'Pedal', codigoInicial: 15000, codigoFinal: 15999 },
  { nome: 'Pedivela', codigoInicial: 16000, codigoFinal: 16999 },
  { nome: 'Pneus', codigoInicial: 17000, codigoFinal: 17999 },
  { nome: 'Quadro', codigoInicial: 18000, codigoFinal: 18999 },
  { nome: 'Raios', codigoInicial: 19000, codigoFinal: 19999 },
  { nome: 'Roda Livres e Cassetes', codigoInicial: 20000, codigoFinal: 20999 },
  { nome: 'Selim', codigoInicial: 21000, codigoFinal: 21999 },
  { nome: 'Serviço', codigoInicial: 22000, codigoFinal: 22999 },
  { nome: 'Suporte Guidão', codigoInicial: 23000, codigoFinal: 23999 },
  { nome: 'Vestuário', codigoInicial: 24000, codigoFinal: 24999 },
];
