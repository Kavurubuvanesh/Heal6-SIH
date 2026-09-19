import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses and normalizes orientation for a captured photo before upload.
 * Keeps a max width of 1600px (foot close-ups don't need more) and
 * re-encodes as JPEG at 80% quality to keep multipart uploads fast on
 * mobile data.
 */
export async function prepareImageForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
