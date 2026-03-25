import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import FeedCard, { ReportData } from './FeedCard';

// -- Datos mock de reportes --
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
    likesCount: 23,
    commentsCount: 8,
    severity: 4,
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
    likesCount: 45,
    commentsCount: 15,
    severity: 5,
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
    likesCount: 67,
    commentsCount: 22,
    severity: 5,
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
    likesCount: 18,
    commentsCount: 5,
    severity: 3,
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
    likesCount: 34,
    commentsCount: 12,
    severity: 2,
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
    likesCount: 52,
    commentsCount: 19,
    severity: 4,
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
    likesCount: 89,
    commentsCount: 31,
    severity: 4,
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
    likesCount: 112,
    commentsCount: 40,
    severity: 3,
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
