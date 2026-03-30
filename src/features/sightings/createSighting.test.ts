import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSaveSightingInput,
  createInitialDraftSightingForm,
  hasDraftSightingErrors,
  validateDraftSighting,
} from './createSighting';
import {
  buildSightingPhotoPath,
  inferImageContentType,
} from './api/sightingStorage';

test('validateDraftSighting requires photo, location, and outdoor confirmation', () => {
  const errors = validateDraftSighting(createInitialDraftSightingForm());

  assert.equal(errors.photoUri, 'Add a photo before posting a sighting.');
  assert.equal(errors.location, 'Capture a rough location before posting.');
  assert.equal(
    errors.isOutdoorConfirmed,
    'Confirm this is an outdoor cat sighting.',
  );
  assert.equal(hasDraftSightingErrors(errors), true);
});

test('buildSaveSightingInput normalizes notes and keeps the captured location', () => {
  const submission = buildSaveSightingInput({
    photoUri: 'file:///cat.jpg',
    notes: ' Friendly   street cat with a clipped ear and a red collar. ',
    primaryColor: 'Orange',
    pattern: 'Tortoiseshell',
    isOutdoorConfirmed: true,
    location: {
      latitude: 43.654321,
      longitude: -79.382456,
      accuracyMeters: 80,
      capturedAt: '2026-03-30T02:00:00.000Z',
    },
  });

  assert.equal(submission.observedAt, '2026-03-30T02:00:00.000Z');
  assert.equal(
    submission.notes,
    'Friendly street cat with a clipped ear and a red collar.',
  );
  assert.equal(submission.location.latitude, 43.654321);
  assert.equal(submission.location.longitude, -79.382456);
});

test('buildSightingPhotoPath nests uploaded files under the user folder', () => {
  const filePath = buildSightingPhotoPath({
    userId: 'user-123',
    observedAt: '2026-03-30T02:00:00.000Z',
    photoUri: 'file:///tmp/cat-shot.heic',
  });

  assert.match(filePath, /^user-123\/2026\/03\/.+\.heic$/);
});

test('inferImageContentType recognizes common mobile image formats', () => {
  assert.equal(inferImageContentType('file:///tmp/cat.png'), 'image/png');
  assert.equal(inferImageContentType('file:///tmp/cat.heic'), 'image/heic');
  assert.equal(inferImageContentType('file:///tmp/cat.unknown'), 'image/jpeg');
});
