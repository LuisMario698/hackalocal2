import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useFontSize } from '../contexts/FontSizeContext';

/**
 * Drop-in Text replacement that auto-scales fontSize
 * based on the global font-size setting.
 */
export default function ScaledText(props: TextProps) {
  const { fs } = useFontSize();
  const { style, ...rest } = props;
  const flat = StyleSheet.flatten(style);
  const scaled = flat?.fontSize ? { ...flat, fontSize: fs(flat.fontSize) } : flat;
  return <RNText {...rest} style={scaled} />;
}
