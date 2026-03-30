export const coatColors = [
  'Black',
  'Orange',
  'Gray',
  'White',
  'Brown',
  'Cream',
  'Mixed',
] as const;

export const coatPatterns = [
  'Solid',
  'Tabby',
  'Tuxedo',
  'Calico',
  'Tortoiseshell',
  'Spotted',
  'Unknown',
] as const;

export type CoatColor = (typeof coatColors)[number];
export type CoatPattern = (typeof coatPatterns)[number];

export type LocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
};

export type DraftSightingForm = {
  photoUri: string | null;
  notes: string;
  primaryColor: CoatColor | null;
  pattern: CoatPattern | null;
  location: LocationSnapshot | null;
  isOutdoorConfirmed: boolean;
};

export type DraftSightingFieldError = Partial<
  Record<'photoUri' | 'location' | 'isOutdoorConfirmed', string>
>;

export type SaveSightingInput = {
  observedAt: string;
  photoUri: string;
  notes: string;
  primaryColor: CoatColor | null;
  pattern: CoatPattern | null;
  location: LocationSnapshot;
  isOutdoorConfirmed: boolean;
};

export type SavedSighting = {
  id: string;
  userId: string;
  photoPath: string;
  observedAt: string;
  createdAt: string;
  publicLocation: {
    latitude: number;
    longitude: number;
  };
  exactLocation: {
    latitude: number;
    longitude: number;
  };
  locationAccuracyMeters: number;
  notes: string;
  primaryColor: CoatColor | null;
  pattern: CoatPattern | null;
  isOutdoorConfirmed: boolean;
  pointsAwarded: number;
  rarityLabel: 'Common' | 'Uncommon' | 'Rare';
  status: 'active' | 'hidden' | 'removed';
};

export function createInitialDraftSightingForm(): DraftSightingForm {
  return {
    photoUri: null,
    notes: '',
    primaryColor: null,
    pattern: null,
    location: null,
    isOutdoorConfirmed: false,
  };
}

export function validateDraftSighting(
  form: DraftSightingForm,
): DraftSightingFieldError {
  const errors: DraftSightingFieldError = {};

  if (!form.photoUri) {
    errors.photoUri = 'Add a photo before posting a sighting.';
  }

  if (!form.location) {
    errors.location = 'Capture a rough location before posting.';
  }

  if (!form.isOutdoorConfirmed) {
    errors.isOutdoorConfirmed = 'Confirm this is an outdoor cat sighting.';
  }

  return errors;
}

export function hasDraftSightingErrors(
  errors: DraftSightingFieldError,
): boolean {
  return Object.values(errors).some(Boolean);
}

export function buildSaveSightingInput(
  form: DraftSightingForm,
): SaveSightingInput {
  if (!form.photoUri || !form.location) {
    throw new Error('Photo and location are required to create a sighting.');
  }

  return {
    observedAt: form.location.capturedAt,
    photoUri: form.photoUri,
    notes: normalizeNotes(form.notes),
    primaryColor: form.primaryColor,
    pattern: form.pattern,
    location: form.location,
    isOutdoorConfirmed: form.isOutdoorConfirmed,
  };
}

function normalizeNotes(notes: string): string {
  return notes.trim().replace(/\s+/g, ' ');
}
