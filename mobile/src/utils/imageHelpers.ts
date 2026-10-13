import * as ImageManipulator from 'expo-image-manipulator';

export interface ScreenBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size2D {
  width: number;
  height: number;
}

/**
 * Calculates the exact crop rectangle within the captured photo's native resolution
 * corresponding to the on-screen reticle guide box.
 */
export function calculateReticleCropRect(
  screenBox: ScreenBox,
  viewport: Size2D,
  photoSize: Size2D
): { originX: number; originY: number; width: number; height: number } {
  const { width: viewW, height: viewH } = viewport;
  const { width: imgW, height: imgH } = photoSize;

  if (!viewW || !viewH || !imgW || !imgH) {
    return { originX: 0, originY: 0, width: imgW || 1, height: imgH || 1 };
  }

  // CameraView with StyleSheet.absoluteFill acts as aspect-fill ("cover")
  const scale = Math.max(viewW / imgW, viewH / imgH);
  const renderedW = imgW * scale;
  const renderedH = imgH * scale;

  const offsetX = (viewW - renderedW) / 2;
  const offsetY = (viewH - renderedH) / 2;

  let originX = Math.round((screenBox.x - offsetX) / scale);
  let originY = Math.round((screenBox.y - offsetY) / scale);
  let width = Math.round(screenBox.width / scale);
  let height = Math.round(screenBox.height / scale);

  // Clamp within image bounds
  originX = Math.max(0, Math.min(originX, imgW - 10));
  originY = Math.max(0, Math.min(originY, imgH - 10));
  width = Math.max(10, Math.min(width, imgW - originX));
  height = Math.max(10, Math.min(height, imgH - originY));

  return { originX, originY, width, height };
}

/**
 * Crops a captured photo to the exact region framed by the viewfinder reticle.
 * This extracts ONLY the proper photo part (the foot and ArUco marker),
 * discarding background floor/bedding/room clutter.
 */
export async function cropPhotoToReticle(
  photoUri: string,
  photoSize: Size2D,
  screenBox: ScreenBox,
  viewport: Size2D
): Promise<string> {
  try {
    const cropRect = calculateReticleCropRect(screenBox, viewport, photoSize);

    const actions: ImageManipulator.Action[] = [
      {
        crop: cropRect,
      },
    ];

    if (cropRect.width > 1600) {
      actions.push({ resize: { width: 1600 } });
    }

    const result = await ImageManipulator.manipulateAsync(
      photoUri,
      actions,
      { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  } catch (err) {
    console.warn('⚠️ [cropPhotoToReticle] Cropping note, falling back to original photo:', err);
    return photoUri;
  }
}

/**
 * Compresses and normalizes orientation for a captured photo before upload.
 * Keeps a max width of 1600px (foot close-ups don't need more) and
 * re-encodes as JPEG at 85% quality to keep multipart uploads fast on
 * mobile data.
 */
export async function prepareImageForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

