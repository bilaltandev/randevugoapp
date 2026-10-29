import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import appIcon from '../../assets/images/icon.png';

/**
 * The CalendlyGo icon on its own dark tile, like the home-screen icon. The cut-out mark (logo-mark.png)
 * lost its dark "face" with its background and washes out on light screens; this reads the same on both.
 */
export function AppMark({ size = 48, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size * 0.26, overflow: 'hidden', backgroundColor: '#0B0E13' }, style]}>
      {/* icon.png keeps the store icon's safe margin; zoom past it so the mark fills the tile. */}
      <Image source={appIcon} style={{ width: size, height: size, transform: [{ scale: 1.32 }] }} contentFit="cover" alt="" />
    </View>
  );
}
