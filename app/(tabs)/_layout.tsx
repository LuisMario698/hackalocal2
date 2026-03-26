import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

function getTabMeta(routeName: string) {
  if (routeName === 'index') {
    return {
      label: 'Inicio',
      icon: (color: string, size: number) => (
        <Ionicons name="home" size={size} color={color} />
      ),
    };
  }

  if (routeName === 'map') {
    return {
      label: 'Mapa',
      icon: (color: string, size: number) => (
        <Ionicons name="map" size={size} color={color} />
      ),
    };
  }

  if (routeName === 'profile') {
    return {
      label: 'Perfil',
      icon: (color: string, size: number) => (
        <Ionicons name="person" size={size} color={color} />
      ),
    };
  }

  if (routeName === 'reports') {
    return {
      label: 'Reportes',
      icon: (color: string, size: number) => (
        <Ionicons name="alert-circle" size={size} color={color} />
      ),
    };
  }

  if (routeName === 'verify') {
    return {
      label: 'Verificar',
      icon: (color: string, size: number) => (
        <Ionicons name="shield-checkmark" size={size} color={color} />
      ),
    };
  }

  return {
    label: routeName,
    icon: (color: string, size: number) => (
      <Ionicons name="ellipse" size={size} color={color} />
    ),
  };
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isVerifier } = useAuth();

  // Filter out hidden tabs based on auth role
  const visibleRoutes = state.routes.filter((route) => {
    if (route.name === 'verify' && !isVerifier) return false;
    return true;
  });
  const visibleIndex = visibleRoutes.findIndex((r) => r.key === state.routes[state.index]?.key);
  const activeIndex = visibleIndex >= 0 ? visibleIndex : 0;

  const barSideMargin = 32;
  const innerPadding = 6;
  const tabCount = visibleRoutes.length;
  const barWidth = Math.min(tabCount > 4 ? 440 : 400, Math.max(280, width - barSideMargin * 2));
  const segmentWidth = (barWidth - innerPadding * 2) / tabCount;

  const translateX = useRef(new Animated.Value(activeIndex * segmentWidth)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeIndex * segmentWidth,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.12,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(pulseScale, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulseScale, segmentWidth, activeIndex, translateX]);

  const bottomSpace = useMemo(
    () => Math.max(insets.bottom, Platform.select({ ios: 8, android: 8, default: 8 }) ?? 8),
    [insets.bottom]
  );

  return (
    <View style={[styles.outer, { paddingBottom: bottomSpace }]}>
      <View style={[styles.bar, { width: barWidth, paddingHorizontal: innerPadding }]}>
        <View style={styles.glassTint} />
        <View pointerEvents="none" style={styles.barOutline} />
        <Animated.View
          style={[
            styles.activePill,
            {
              width: segmentWidth,
              transform: [{ translateX }, { scaleX: pulseScale }],
            },
          ]}
        >
          <View style={styles.activePillTint} />
        </Animated.View>

        {visibleRoutes.map((route, index) => {
          const isFocused = activeIndex === index;
          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const meta = getTabMeta(route.name);
          const tint = isFocused ? '#1D9E75' : '#101113';
          const a11yLabel = options.tabBarAccessibilityLabel;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={a11yLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, { width: segmentWidth }]}
            >
              {meta.icon(tint, 26)}
              <Text style={[styles.label, { color: tint }]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { isVerifier } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
        }}
    
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          title: 'Verificar',
          href: isVerifier ? ('/verify' as any) : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    height: 70,
    borderRadius: 35,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#e5e5e8',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  barOutline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#f6f6f8',
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e5e5e8',
  },
  activePill: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 28,
    backgroundColor: 'rgba(246,248,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.94)',
    overflow: 'hidden',
  },
  activePillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238,241,251,0.42)',
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
