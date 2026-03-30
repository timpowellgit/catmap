import { ensureAnonymousSession } from '../../auth/ensureAnonymousSession';
import type { Database } from '../../../lib/database.types';
import { getSupabaseClient } from '../../../lib/supabase';
import { type SaveSightingInput, type SavedSighting } from '../createSighting';
import {
  buildSightingPhotoPath,
  inferImageContentType,
} from './sightingStorage';

type SightingRow = Database['public']['Tables']['sightings']['Row'];

const sightingBucketName = 'sightings';

export async function saveSighting(
  input: SaveSightingInput,
): Promise<SavedSighting> {
  const supabase = getSupabaseClient();
  const session = await ensureAnonymousSession();
  const photoPath = await uploadSightingPhoto({
    photoUri: input.photoUri,
    observedAt: input.observedAt,
    userId: session.user.id,
  });

  const { data, error } = await supabase
    .rpc('create_sighting', {
      photo_path: photoPath,
      observed_at: input.observedAt,
      exact_latitude: input.location.latitude,
      exact_longitude: input.location.longitude,
      location_accuracy_meters: input.location.accuracyMeters,
      notes: input.notes,
      primary_color: input.primaryColor,
      pattern: input.pattern,
      is_outdoor_confirmed: input.isOutdoorConfirmed,
    })
    .single();

  if (error) {
    await supabase.storage.from(sightingBucketName).remove([photoPath]);
    throw error;
  }

  return mapSightingRow(data as SightingRow);
}

type UploadSightingPhotoArgs = {
  photoUri: string;
  observedAt: string;
  userId: string;
};

async function uploadSightingPhoto({
  photoUri,
  observedAt,
  userId,
}: UploadSightingPhotoArgs): Promise<string> {
  const supabase = getSupabaseClient();
  const photoPath = buildSightingPhotoPath({
    userId,
    observedAt,
    photoUri,
  });
  const arrayBuffer = await fetch(photoUri).then((response) =>
    response.arrayBuffer(),
  );

  const { error } = await supabase.storage
    .from(sightingBucketName)
    .upload(photoPath, arrayBuffer, {
      contentType: inferImageContentType(photoUri),
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return photoPath;
}

function mapSightingRow(row: SightingRow): SavedSighting {
  return {
    id: row.id,
    userId: row.user_id,
    photoPath: row.photo_path,
    observedAt: row.observed_at,
    createdAt: row.created_at,
    publicLocation: {
      latitude: row.public_latitude,
      longitude: row.public_longitude,
    },
    exactLocation: {
      latitude: row.exact_latitude,
      longitude: row.exact_longitude,
    },
    locationAccuracyMeters: row.location_accuracy_meters,
    notes: row.notes ?? '',
    primaryColor: row.primary_color,
    pattern: row.pattern,
    isOutdoorConfirmed: row.is_outdoor_confirmed,
    pointsAwarded: row.points_awarded,
    rarityLabel: row.rarity_label,
    status: row.status,
  };
}
