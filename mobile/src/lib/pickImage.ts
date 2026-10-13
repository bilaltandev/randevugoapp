import * as ImagePicker from 'expo-image-picker';

import type { PickedImage } from '@/api/panel';
import { t } from '@/i18n';

/** Max upload size of the server's image endpoints. */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Lets the user choose one photo from the library. No permission prompt is needed for the library picker.
 * Resolves null when cancelled; throws a Turkish message when the file is too large.
 */
export async function pickImage(options: { aspect?: [number, number] } = {}): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
    allowsEditing: !!options.aspect,
    aspect: options.aspect,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_BYTES) throw new Error(t('Görsel 10 MB’tan büyük olamaz.'));
  return { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName };
}
