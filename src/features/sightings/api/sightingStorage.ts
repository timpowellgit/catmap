type BuildSightingPhotoPathArgs = {
  userId: string;
  observedAt: string;
  photoUri: string;
};

export function buildSightingPhotoPath({
  userId,
  observedAt,
  photoUri,
}: BuildSightingPhotoPathArgs): string {
  const observedDate = Number.isNaN(Date.parse(observedAt))
    ? new Date()
    : new Date(observedAt);
  const year = observedDate.getUTCFullYear();
  const month = String(observedDate.getUTCMonth() + 1).padStart(2, '0');
  const fileExtension = extractFileExtension(photoUri);
  const uniqueSuffix = `${observedDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${userId}/${year}/${month}/${uniqueSuffix}.${fileExtension}`;
}

export function inferImageContentType(photoUri: string): string {
  const fileExtension = extractFileExtension(photoUri);

  switch (fileExtension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

function extractFileExtension(photoUri: string): string {
  const sanitizedUri = photoUri.split('?')[0].split('#')[0];
  const maybeExtension = sanitizedUri.split('.').pop()?.toLowerCase();

  if (!maybeExtension) {
    return 'jpg';
  }

  return maybeExtension;
}
