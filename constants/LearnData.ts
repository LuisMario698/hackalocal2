export type LearnItemType = 'video' | 'article';

export interface LearnItem {
  id: string;
  type: LearnItemType;
  title: string;
  source: string;
  url: string;
  thumbnail?: string; // For videos
  duration?: string; // For videos
  summary?: string; // For articles
}

export const LEARN_DATA: LearnItem[] = [
  {
    id: '1',
    type: 'video',
    title: '¿Qué es el Cambio Climático?',
    source: 'ONU Medio Ambiente',
    url: 'https://www.youtube.com/watch?v=miEJI0XQiN4',
    thumbnail: 'https://img.youtube.com/vi/miEJI0XQiN4/hqdefault.jpg',
    duration: '3:45',
  },
  {
    id: '2',
    type: 'article',
    title: 'Informe sobre la Brecha de Emisiones 2023',
    source: 'PNUMA (Programa de las Naciones Unidas para el Medio Ambiente)',
    url: 'https://www.unep.org/es/resources/informe-sobre-la-brecha-de-emisiones-2023',
    summary: 'El informe muestra que las promesas actuales bajo el Acuerdo de París pondrían al mundo en la senda de un calentamiento de 2,5 a 2,9 °C en este siglo.',
  },
  {
    id: '3',
    type: 'video',
    title: 'La importancia de la biodiversidad',
    source: 'National Geographic',
    url: 'https://www.youtube.com/watch?v=b6Ua_zWDH6U',
    thumbnail: 'https://img.youtube.com/vi/b6Ua_zWDH6U/hqdefault.jpg',
    duration: '5:12',
  },
  {
    id: '4',
    type: 'article',
    title: 'Guía práctica para reducir el uso de plástico en el hogar',
    source: 'Greenpeace',
    url: 'https://es.greenpeace.org/es/trabajamos-en/consumismo/plasticos/como-reducir-tu-consumo-de-plastico/',
    summary: 'Consejos prácticos y fáciles de implementar en la vida cotidiana para disminuir de forma significativa nuestra huella plástica.',
  },
  {
    id: '5',
    type: 'video',
    title: 'Economía Circular: Qué es y cómo funciona',
    source: 'Fundación Ellen MacArthur',
    url: 'https://www.youtube.com/watch?v=Lc4-2cVKxp0',
    thumbnail: 'https://img.youtube.com/vi/Lc4-2cVKxp0/hqdefault.jpg',
    duration: '4:20',
  },
];
