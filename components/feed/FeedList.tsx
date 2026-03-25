import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import FeedCard, { ReportData } from './FeedCard';

// -- Datos mock de reportes con imagenes reales --
const MOCK_REPORTS: ReportData[] = [
  {
    id: '1',
    userName: 'Maria Lopez',
    userInitials: 'ML',
    timeAgo: 'Hace 25 min',
    category: 'trash',
    status: 'pending',
    title: 'Acumulacion de basura en playa norte',
    description:
      'Se han acumulado residuos plasticos y desechos en la zona costera norte. Es necesario organizar una jornada de limpieza urgente. La situacion se ha agravado despues de las lluvias.',
    location: 'Playa Norte, Guaymas',
    photoUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=500&fit=crop',
    likesCount: 23,
    commentsCount: 2,
    severity: 4,
    initialComments: [
      {
        id: 'c1',
        userName: 'Pedro Gomez',
        userInitials: 'PG',
        text: 'Yo paso por ahi todos los dias y cada vez esta peor. Cuenten conmigo para la limpieza.',
        timeAgo: 'Hace 15 min',
      },
      {
        id: 'c2',
        userName: 'Laura Rios',
        userInitials: 'LR',
        text: 'Ya reporte esto al municipio la semana pasada pero no han hecho nada.',
        timeAgo: 'Hace 10 min',
      },
    ],
  },
  {
    id: '2',
    userName: 'Carlos Mendoza',
    userInitials: 'CM',
    timeAgo: 'Hace 1 hora',
    category: 'water',
    status: 'in_progress',
    title: 'Contaminacion en arroyo municipal',
    description:
      'El arroyo que cruza la colonia centro presenta coloracion anormal y mal olor. Posible vertido industrial no autorizado. Las autoridades ya fueron notificadas.',
    location: 'Col. Centro, Empalme',
    photoUrl: 'https://images.unsplash.com/photo-1569012871812-f38ee64cd54c?w=800&h=500&fit=crop',
    likesCount: 45,
    commentsCount: 3,
    severity: 5,
    initialComments: [
      {
        id: 'c3',
        userName: 'Ana Torres',
        userInitials: 'AT',
        text: 'Se necesita que alguien tome muestras del agua para analisis. Esto puede ser peligroso.',
        timeAgo: 'Hace 45 min',
      },
      {
        id: 'c4',
        userName: 'Roberto Diaz',
        userInitials: 'RD',
        text: 'Las autoridades ya estan investigando. Vi personal de CONAGUA esta manana.',
        timeAgo: 'Hace 30 min',
      },
      {
        id: 'c5',
        userName: 'Sofia Herrera',
        userInitials: 'SH',
        text: 'Hay que evitar que los ninos jueguen cerca del arroyo por ahora.',
        timeAgo: 'Hace 20 min',
      },
    ],
  },
  {
    id: '3',
    userName: 'Ana Torres',
    userInitials: 'AT',
    timeAgo: 'Hace 2 horas',
    category: 'wildlife',
    status: 'pending',
    title: 'Aves marinas atrapadas en redes',
    description:
      'Se encontraron varias aves marinas enredadas en residuos de redes de pesca abandonadas cerca del muelle. Se requiere apoyo de proteccion civil y ambientalistas.',
    location: 'Muelle San Carlos',
    photoUrl: 'https://images.unsplash.com/photo-1470093851219-69951fcbb533?w=800&h=500&fit=crop',
    likesCount: 67,
    commentsCount: 1,
    severity: 5,
    initialComments: [
      {
        id: 'c6',
        userName: 'Fernando Castillo',
        userInitials: 'FC',
        text: 'Ya contacte a la asociacion de proteccion animal. Van en camino.',
        timeAgo: 'Hace 1 hora',
      },
    ],
  },
  {
    id: '4',
    userName: 'Roberto Diaz',
    userInitials: 'RD',
    timeAgo: 'Hace 3 horas',
    category: 'electronic',
    status: 'pending',
    title: 'Deposito ilegal de aparatos electronicos',
    description:
      'Alguien abandono monitores viejos, cables y baterias en el terreno baldio de la esquina. Los materiales pueden ser toxicos y representan un riesgo para los ninos del area.',
    location: 'Col. Las Palmas, Guaymas',
    photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop',
    likesCount: 18,
    commentsCount: 0,
    severity: 3,
    initialComments: [],
  },
  {
    id: '5',
    userName: 'Lucia Fernandez',
    userInitials: 'LF',
    timeAgo: 'Hace 5 horas',
    category: 'organic',
    status: 'resolved',
    title: 'Residuos organicos en mercado local',
    description:
      'Los puestos del mercado municipal estaban dejando restos de frutas y verduras sin recoger al final del dia. Despues del reporte, el municipio instalo contenedores especiales para composta.',
    location: 'Mercado Municipal, Guaymas',
    photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=500&fit=crop',
    likesCount: 34,
    commentsCount: 2,
    severity: 2,
    initialComments: [
      {
        id: 'c7',
        userName: 'Maria Lopez',
        userInitials: 'ML',
        text: 'Los contenedores de composta fueron una excelente solucion. Felicidades al equipo.',
        timeAgo: 'Hace 3 horas',
      },
      {
        id: 'c8',
        userName: 'Jorge Ramirez',
        userInitials: 'JR',
        text: 'Ojala pongan contenedores asi en todos los mercados de la ciudad.',
        timeAgo: 'Hace 2 horas',
      },
    ],
  },
  {
    id: '6',
    userName: 'Jorge Ramirez',
    userInitials: 'JR',
    timeAgo: 'Hace 8 horas',
    category: 'trash',
    status: 'in_progress',
    title: 'Basura acumulada en canal pluvial',
    description:
      'El canal pluvial de la avenida principal esta obstruido con bolsas de plastico y escombros. Con la temporada de lluvias esto puede causar inundaciones serias en las colonias bajas.',
    location: 'Av. Serdan, Guaymas',
    photoUrl: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800&h=500&fit=crop',
    likesCount: 52,
    commentsCount: 1,
    severity: 4,
    initialComments: [
      {
        id: 'c9',
        userName: 'Carlos Mendoza',
        userInitials: 'CM',
        text: 'Proteccion civil ya esta coordinando una cuadrilla para esta tarde.',
        timeAgo: 'Hace 6 horas',
      },
    ],
  },
  {
    id: '7',
    userName: 'Patricia Vega',
    userInitials: 'PV',
    timeAgo: 'Hace 1 dia',
    category: 'water',
    status: 'resolved',
    title: 'Fuga de agua tratada cerca de estero',
    description:
      'Se detecto una fuga de agua tratada que estaba escurriendo hacia el estero. La planta tratadora fue notificada y ya reparo la tuberia danada. El ecosistema esta siendo monitoreado.',
    location: 'Estero del Soldado',
    photoUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=500&fit=crop',
    likesCount: 89,
    commentsCount: 2,
    severity: 4,
    initialComments: [
      {
        id: 'c10',
        userName: 'Ana Torres',
        userInitials: 'AT',
        text: 'Excelente respuesta de la planta tratadora. Ojala siempre fueran asi de rapidos.',
        timeAgo: 'Hace 20 horas',
      },
      {
        id: 'c11',
        userName: 'Lucia Fernandez',
        userInitials: 'LF',
        text: 'El estero se ve mucho mejor ahora. Gracias a todos los que reportaron.',
        timeAgo: 'Hace 18 horas',
      },
    ],
  },
  {
    id: '8',
    userName: 'Fernando Castillo',
    userInitials: 'FC',
    timeAgo: 'Hace 2 dias',
    category: 'wildlife',
    status: 'resolved',
    title: 'Tortugas marinas en zona de anidacion',
    description:
      'Se identifico una zona de anidacion de tortugas marinas que estaba siendo afectada por basura y actividades turisticas. Se instalo senalizacion y se organizo limpieza con voluntarios.',
    location: 'Playa Miramar, San Carlos',
    photoUrl: 'https://images.unsplash.com/photo-1591025207163-942350e47db2?w=800&h=500&fit=crop',
    likesCount: 112,
    commentsCount: 3,
    severity: 3,
    initialComments: [
      {
        id: 'c12',
        userName: 'Patricia Vega',
        userInitials: 'PV',
        text: 'Fue increible ver a los voluntarios trabajando juntos. La playa quedo impecable.',
        timeAgo: 'Hace 1 dia',
      },
      {
        id: 'c13',
        userName: 'Maria Lopez',
        userInitials: 'ML',
        text: 'Las tortugas estan protegidas ahora. Gran trabajo de la comunidad.',
        timeAgo: 'Hace 1 dia',
      },
      {
        id: 'c14',
        userName: 'Roberto Diaz',
        userInitials: 'RD',
        text: 'Yo participe en la limpieza. Recolectamos mas de 200 kilos de basura.',
        timeAgo: 'Hace 22 horas',
      },
    ],
  },
];

export default function FeedList({ filter }: { filter: string }) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filteredReports = React.useMemo(() => {
    if (filter === 'recientes') {
      return [...MOCK_REPORTS].sort((a, b) => {
        const order: Record<string, number> = {
          'Hace 25 min': 1,
          'Hace 1 hora': 2,
          'Hace 2 horas': 3,
          'Hace 3 horas': 4,
          'Hace 5 horas': 5,
          'Hace 8 horas': 6,
          'Hace 1 dia': 7,
          'Hace 2 dias': 8,
        };
        return (order[a.timeAgo] || 99) - (order[b.timeAgo] || 99);
      });
    }
    if (filter === 'apoyados') {
      return [...MOCK_REPORTS].sort((a, b) => b.likesCount - a.likesCount);
    }
    return MOCK_REPORTS;
  }, [filter]);

  const renderItem = useCallback(
    ({ item }: { item: ReportData }) => <FeedCard report={item} />,
    []
  );

  const keyExtractor = useCallback((item: ReportData) => item.id, []);

  return (
    <FlatList
      data={filteredReports}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1D9E75']}
          tintColor="#1D9E75"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  separator: {
    height: 2,
  },
});
