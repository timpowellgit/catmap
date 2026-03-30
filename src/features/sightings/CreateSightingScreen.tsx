import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ensureAnonymousSession } from '../auth/ensureAnonymousSession';
import { isSupabaseConfigured } from '../../lib/supabase';
import { saveSighting } from './api/saveSighting';
import {
  buildSaveSightingInput,
  coatColors,
  coatPatterns,
  createInitialDraftSightingForm,
  hasDraftSightingErrors,
  type CoatColor,
  type CoatPattern,
  type DraftSightingFieldError,
  type DraftSightingForm,
  type SavedSighting,
  validateDraftSighting,
} from './createSighting';

export function CreateSightingScreen() {
  const [draftSightingForm, setDraftSightingForm] = useState<DraftSightingForm>(
    () => createInitialDraftSightingForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<DraftSightingFieldError>({});
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrappingSession, setIsBootstrappingSession] =
    useState(isSupabaseConfigured);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(
    null,
  );
  const [recentSavedSighting, setRecentSavedSighting] = useState<{
    sighting: SavedSighting;
    localPhotoUri: string;
  } | null>(null);

  const publicLocationSummary = useMemo(() => {
    if (!recentSavedSighting) {
      return null;
    }

    return `${recentSavedSighting.sighting.publicLocation.latitude.toFixed(3)}, ${recentSavedSighting.sighting.publicLocation.longitude.toFixed(3)}`;
  }, [recentSavedSighting]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAnonymousSession() {
      if (!isSupabaseConfigured) {
        setIsBootstrappingSession(false);
        return;
      }

      try {
        const session = await ensureAnonymousSession();

        if (!isMounted) {
          return;
        }

        setSessionUserId(session.user.id);
        setSessionErrorMessage(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSessionErrorMessage(toErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsBootstrappingSession(false);
        }
      }
    }

    bootstrapAnonymousSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleChoosePhoto() {
    setIsPickingImage(true);

    try {
      const permissionResponse =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResponse.granted) {
        Alert.alert(
          'Photo access needed',
          'CatMap needs photo library access so you can post a sighting.',
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (pickerResult.canceled || pickerResult.assets.length === 0) {
        return;
      }

      setDraftSightingForm((currentForm) => ({
        ...currentForm,
        photoUri: pickerResult.assets[0].uri,
      }));
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        photoUri: undefined,
      }));
    } finally {
      setIsPickingImage(false);
    }
  }

  async function handleCaptureLocation() {
    setIsCapturingLocation(true);

    try {
      const permissionResponse =
        await Location.requestForegroundPermissionsAsync();

      if (!permissionResponse.granted) {
        Alert.alert(
          'Location access needed',
          'CatMap uses a rough location for nearby sightings and lost-cat alerts.',
        );
        return;
      }

      const locationSnapshot = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setDraftSightingForm((currentForm) => ({
        ...currentForm,
        location: {
          latitude: locationSnapshot.coords.latitude,
          longitude: locationSnapshot.coords.longitude,
          accuracyMeters: Math.round(locationSnapshot.coords.accuracy ?? 150),
          capturedAt: new Date().toISOString(),
        },
      }));
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        location: undefined,
      }));
    } catch {
      Alert.alert(
        'Location unavailable',
        'Try again outside or with location services enabled.',
      );
    } finally {
      setIsCapturingLocation(false);
    }
  }

  function handleSelectColor(color: CoatColor) {
    setDraftSightingForm((currentForm) => ({
      ...currentForm,
      primaryColor: currentForm.primaryColor === color ? null : color,
    }));
  }

  function handleSelectPattern(pattern: CoatPattern) {
    setDraftSightingForm((currentForm) => ({
      ...currentForm,
      pattern: currentForm.pattern === pattern ? null : pattern,
    }));
  }

  function handleUpdateNotes(notes: string) {
    setDraftSightingForm((currentForm) => ({
      ...currentForm,
      notes,
    }));
  }

  function handleToggleOutdoorConfirmation() {
    setDraftSightingForm((currentForm) => ({
      ...currentForm,
      isOutdoorConfirmed: !currentForm.isOutdoorConfirmed,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      isOutdoorConfirmed: undefined,
    }));
  }

  async function handleSubmitSighting() {
    setIsSubmitting(true);

    try {
      const nextFieldErrors = validateDraftSighting(draftSightingForm);
      setFieldErrors(nextFieldErrors);

      if (hasDraftSightingErrors(nextFieldErrors)) {
        return;
      }

      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to continue.',
        );
      }

      const saveInput = buildSaveSightingInput(draftSightingForm);
      const savedSighting = await saveSighting(saveInput);

      setRecentSavedSighting({
        sighting: savedSighting,
        localPhotoUri: saveInput.photoUri,
      });
      setSessionUserId(savedSighting.userId);
      setDraftSightingForm(createInitialDraftSightingForm());
      Alert.alert(
        'Sighting saved',
        'The sighting was uploaded to Supabase and the saved record came back from the database.',
      );
    } catch (error) {
      Alert.alert('Could not save sighting', toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              Vertical slice 1, persisted
            </Text>
          </View>
          <Text style={styles.heroTitle}>Create Sighting</Text>
          <Text style={styles.heroSubtitle}>
            Capture a street-cat sighting with a photo, coarse location, and
            enough detail to make it useful later for lost-cat matching.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Backend Status</Text>
          {!isSupabaseConfigured ? (
            <Text style={styles.errorText}>
              Missing Supabase environment variables. Add
              EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              in a local `.env`.
            </Text>
          ) : null}
          {isSupabaseConfigured && isBootstrappingSession ? (
            <Text style={styles.supportText}>
              Connecting to Supabase with an anonymous session...
            </Text>
          ) : null}
          {sessionUserId ? (
            <Text style={styles.supportText}>
              Anonymous user: {shortUserId(sessionUserId)}
            </Text>
          ) : null}
          {sessionErrorMessage ? (
            <Text style={styles.errorText}>{sessionErrorMessage}</Text>
          ) : null}
          <Text style={styles.supportText}>
            Saved sightings now upload the image to private storage and insert
            the record through a server-side RPC.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Photo</Text>
          {draftSightingForm.photoUri ? (
            <Image
              source={{ uri: draftSightingForm.photoUri }}
              style={styles.photoPreview}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderTitle}>
                No photo selected
              </Text>
              <Text style={styles.photoPlaceholderBody}>
                Pick one clear image of the cat from your library.
              </Text>
            </View>
          )}
          <Pressable
            onPress={handleChoosePhoto}
            style={styles.primaryButton}
            disabled={isPickingImage}
          >
            <Text style={styles.primaryButtonText}>
              {isPickingImage ? 'Opening library...' : 'Choose photo'}
            </Text>
          </Pressable>
          {fieldErrors.photoUri ? (
            <Text style={styles.errorText}>{fieldErrors.photoUri}</Text>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Rough Location</Text>
          <Text style={styles.supportText}>
            Public sightings should show only a coarse map point, never the
            exact address.
          </Text>
          <Pressable
            onPress={handleCaptureLocation}
            style={styles.secondaryButton}
            disabled={isCapturingLocation}
          >
            <Text style={styles.secondaryButtonText}>
              {isCapturingLocation
                ? 'Capturing location...'
                : 'Use my location'}
            </Text>
          </Pressable>
          {draftSightingForm.location ? (
            <View style={styles.locationCard}>
              <Text style={styles.locationText}>
                Exact capture: {draftSightingForm.location.latitude.toFixed(5)},{' '}
                {draftSightingForm.location.longitude.toFixed(5)}
              </Text>
              <Text style={styles.locationText}>
                Accuracy: about {draftSightingForm.location.accuracyMeters} m
              </Text>
            </View>
          ) : null}
          {fieldErrors.location ? (
            <Text style={styles.errorText}>{fieldErrors.location}</Text>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Coat Details</Text>
          <Text style={styles.supportText}>
            Optional details now, but these tags will help when we add matching.
          </Text>
          <Text style={styles.groupLabel}>Primary color</Text>
          <View style={styles.chipGroup}>
            {coatColors.map((color) => (
              <SelectableChip
                key={color}
                label={color}
                isSelected={draftSightingForm.primaryColor === color}
                onPress={() => handleSelectColor(color)}
              />
            ))}
          </View>
          <Text style={styles.groupLabel}>Pattern</Text>
          <View style={styles.chipGroup}>
            {coatPatterns.map((pattern) => (
              <SelectableChip
                key={pattern}
                label={pattern}
                isSelected={draftSightingForm.pattern === pattern}
                onPress={() => handleSelectPattern(pattern)}
              />
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Field Notes</Text>
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="Friendly? Wearing a collar? Seen near a shop or alley?"
            placeholderTextColor="#9b8a76"
            style={styles.notesInput}
            value={draftSightingForm.notes}
            onChangeText={handleUpdateNotes}
          />
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Safety Check</Text>
          <Pressable
            onPress={handleToggleOutdoorConfirmation}
            style={[
              styles.confirmationRow,
              draftSightingForm.isOutdoorConfirmed &&
                styles.confirmationRowSelected,
            ]}
          >
            <View
              style={[
                styles.confirmationDot,
                draftSightingForm.isOutdoorConfirmed &&
                  styles.confirmationDotSelected,
              ]}
            />
            <View style={styles.confirmationTextWrap}>
              <Text style={styles.confirmationTitle}>
                This is an outdoor cat sighting
              </Text>
              <Text style={styles.confirmationBody}>
                Do not post indoor cats or use precise public home addresses.
              </Text>
            </View>
          </Pressable>
          {fieldErrors.isOutdoorConfirmed ? (
            <Text style={styles.errorText}>
              {fieldErrors.isOutdoorConfirmed}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleSubmitSighting}
          style={[
            styles.submitButton,
            (isSubmitting || !isSupabaseConfigured) && styles.submitButtonMuted,
          ]}
          disabled={isSubmitting || !isSupabaseConfigured}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fffaf3" />
          ) : (
            <Text style={styles.submitButtonText}>
              Save sighting to Supabase
            </Text>
          )}
        </Pressable>

        {recentSavedSighting ? (
          <View style={styles.resultPanel}>
            <Text style={styles.resultTitle}>Latest Saved Sighting</Text>
            <Image
              source={{ uri: recentSavedSighting.localPhotoUri }}
              style={styles.savedPhotoPreview}
            />
            <Text style={styles.resultHeadline}>
              {recentSavedSighting.sighting.pointsAwarded} pts ·{' '}
              {recentSavedSighting.sighting.rarityLabel}
            </Text>
            <Text style={styles.resultBody}>
              Record ID: {recentSavedSighting.sighting.id}
            </Text>
            <Text style={styles.resultBody}>
              Public map point: {publicLocationSummary}
            </Text>
            <Text style={styles.resultBody}>
              Captured at:{' '}
              {formatObservedAt(recentSavedSighting.sighting.observedAt)}
            </Text>
            <Text style={styles.resultBody}>
              Saved at:{' '}
              {formatObservedAt(recentSavedSighting.sighting.createdAt)}
            </Text>
            <Text style={styles.resultBody}>
              Details:{' '}
              {recentSavedSighting.sighting.primaryColor ?? 'Unknown color'} /{' '}
              {recentSavedSighting.sighting.pattern ?? 'Unknown pattern'}
            </Text>
            <Text style={styles.resultBody}>
              Status: {recentSavedSighting.sighting.status}
            </Text>
            {recentSavedSighting.sighting.notes ? (
              <Text style={styles.resultBody}>
                Notes: {recentSavedSighting.sighting.notes}
              </Text>
            ) : null}
            <Text style={styles.resultBody}>
              Private photo path: {recentSavedSighting.sighting.photoPath}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type SelectableChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function SelectableChip({ label, isSelected, onPress }: SelectableChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, isSelected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function formatObservedAt(value: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while talking to Supabase.';
}

function shortUserId(userId: string): string {
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f1e7',
  },
  content: {
    gap: 20,
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#f4e9d8',
    borderColor: '#d7b98f',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 24,
    shadowColor: '#53351d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    borderColor: '#d9a066',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: '#8a4b08',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#2f1d12',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: '#563c2b',
    fontSize: 16,
    lineHeight: 23,
  },
  panel: {
    backgroundColor: '#fffaf3',
    borderColor: '#ead8bc',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  resultPanel: {
    backgroundColor: '#2f1d12',
    borderRadius: 24,
    gap: 10,
    padding: 20,
  },
  resultTitle: {
    color: '#fffaf3',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#2f1d12',
    fontSize: 18,
    fontWeight: '800',
  },
  supportText: {
    color: '#6f5241',
    fontSize: 14,
    lineHeight: 20,
  },
  photoPreview: {
    borderRadius: 20,
    height: 240,
    width: '100%',
  },
  savedPhotoPreview: {
    borderRadius: 18,
    height: 180,
    width: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#dec6a5',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 6,
    padding: 28,
  },
  photoPlaceholderTitle: {
    color: '#4a2e1f',
    fontSize: 16,
    fontWeight: '700',
  },
  photoPlaceholderBody: {
    color: '#7d6656',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2f1d12',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#fffaf3',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ede0ca',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#4a2e1f',
    fontSize: 15,
    fontWeight: '700',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderColor: '#f1e4cf',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  locationText: {
    color: '#5b4434',
    fontSize: 14,
  },
  groupLabel: {
    color: '#4a2e1f',
    fontSize: 14,
    fontWeight: '700',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#f8efe2',
    borderColor: '#dec6a5',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: '#2f1d12',
    borderColor: '#2f1d12',
  },
  chipText: {
    color: '#5b4434',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fffaf3',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderColor: '#dec6a5',
    borderRadius: 18,
    borderWidth: 1,
    color: '#2f1d12',
    fontSize: 15,
    lineHeight: 21,
    minHeight: 120,
    padding: 16,
    textAlignVertical: 'top',
  },
  confirmationRow: {
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderColor: '#dec6a5',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  confirmationRowSelected: {
    backgroundColor: '#fff2d7',
    borderColor: '#d9a066',
  },
  confirmationDot: {
    backgroundColor: '#fffaf3',
    borderColor: '#d7b98f',
    borderRadius: 999,
    borderWidth: 2,
    height: 22,
    marginTop: 2,
    width: 22,
  },
  confirmationDotSelected: {
    backgroundColor: '#2f1d12',
    borderColor: '#2f1d12',
  },
  confirmationTextWrap: {
    flex: 1,
    gap: 4,
  },
  confirmationTitle: {
    color: '#4a2e1f',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmationBody: {
    color: '#6f5241',
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#b64926',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  submitButtonMuted: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fffaf3',
    fontSize: 16,
    fontWeight: '800',
  },
  resultHeadline: {
    color: '#fffaf3',
    fontSize: 22,
    fontWeight: '800',
  },
  resultBody: {
    color: '#efe1d0',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#a12d19',
    fontSize: 13,
    fontWeight: '600',
  },
});
