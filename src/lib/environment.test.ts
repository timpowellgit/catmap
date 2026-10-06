import test from 'node:test';
import assert from 'node:assert/strict';

import {
  describeSupabaseEnvironmentFailure,
  readSupabaseEnvironment,
} from './environment';

test('readSupabaseEnvironment returns a configured environment for valid values', () => {
  const result = readSupabaseEnvironment({
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  });

  assert.equal(result.isConfigured, true);
  assert.deepEqual(result, {
    isConfigured: true,
    environment: {
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_publishable_example',
    },
  });
});

test('readSupabaseEnvironment accepts the documented fallback key names', () => {
  const result = readSupabaseEnvironment({
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  });

  assert.equal(result.isConfigured, true);
});

test('readSupabaseEnvironment reports a missing configuration', () => {
  const result = readSupabaseEnvironment({});

  assert.equal(result.isConfigured, false);
  assert.deepEqual(result, {
    isConfigured: false,
    missingVariables: [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ],
  });
  assert.match(
    describeSupabaseEnvironmentFailure(result),
    /EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );
});

test('readSupabaseEnvironment treats blank values as missing', () => {
  const result = readSupabaseEnvironment({
    EXPO_PUBLIC_SUPABASE_URL: '   ',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
  });

  assert.equal(result.isConfigured, false);
});

test('readSupabaseEnvironment fails fast on partial configuration', () => {
  assert.throws(
    () =>
      readSupabaseEnvironment({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      }),
    /Supabase key is missing/,
  );

  assert.throws(
    () =>
      readSupabaseEnvironment({
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    /Supabase URL is missing/,
  );
});

test('readSupabaseEnvironment rejects server-only variable names', () => {
  assert.throws(
    () =>
      readSupabaseEnvironment({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
        EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'super-secret',
      }),
    /Server-only environment variables must never be exposed/,
  );
});

test('readSupabaseEnvironment rejects a non-http Supabase URL', () => {
  assert.throws(
    () =>
      readSupabaseEnvironment({
        EXPO_PUBLIC_SUPABASE_URL: 'ftp://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    /must be a valid http or https URL/,
  );
});
