export const supabaseUrlVariableName = 'EXPO_PUBLIC_SUPABASE_URL';

export const supabasePublishableKeyVariableNames = [
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_KEY',
] as const;

// Only EXPO_PUBLIC_ variables are inlined into the client bundle, so a
// server-only secret must never be given an EXPO_PUBLIC_ name. Both the
// canonical secret names and their EXPO_PUBLIC_ variants are rejected.
export const serverOnlyVariableNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_JWT_SECRET',
  'EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'EXPO_PUBLIC_SUPABASE_SECRET_KEY',
  'EXPO_PUBLIC_SUPABASE_SERVICE_KEY',
  'EXPO_PUBLIC_SUPABASE_JWT_SECRET',
] as const;

export type EnvironmentSource = Record<string, string | undefined>;

export type SupabaseEnvironment = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export type SupabaseEnvironmentResult =
  | { isConfigured: true; environment: SupabaseEnvironment }
  | { isConfigured: false; missingVariables: string[] };

/**
 * Rejects server-only variable names before any configuration is read. A secret
 * that uses an EXPO_PUBLIC_ name would be bundled into the shipped app, so this
 * fails loudly rather than shipping one.
 */
export function rejectServerOnlyVariables(source: EnvironmentSource): void {
  const leakedVariableNames = serverOnlyVariableNames.filter(
    (name) => normalize(source[name]) !== null,
  );

  if (leakedVariableNames.length > 0) {
    throw new Error(
      `Server-only environment variables must never be exposed to the app: ${leakedVariableNames.join(
        ', ',
      )}. Only EXPO_PUBLIC_ variables are bundled into the client.`,
    );
  }
}

/**
 * Reads and validates the public Supabase configuration.
 *
 * - Rejects server-only variable names.
 * - Throws on partial configuration, which is always a mistake and should fail
 *   fast rather than fall back to a confusing runtime error.
 * - Throws when the URL is not a valid http(s) URL.
 * - Returns an unconfigured result when neither value is present. The current
 *   prototype supports running without Supabase and shows a setup message; when
 *   environment separation lands (milestone M3) a missing configuration will
 *   become a hard startup failure.
 */
export function readSupabaseEnvironment(
  source: EnvironmentSource,
): SupabaseEnvironmentResult {
  rejectServerOnlyVariables(source);

  const supabaseUrl = normalize(source[supabaseUrlVariableName]);
  const supabasePublishableKey = firstNonNull(
    supabasePublishableKeyVariableNames.map((name) => normalize(source[name])),
  );

  if (supabaseUrl === null && supabasePublishableKey === null) {
    return {
      isConfigured: false,
      missingVariables: [
        supabaseUrlVariableName,
        supabasePublishableKeyVariableNames[0],
      ],
    };
  }

  if (supabaseUrl === null) {
    throw new Error(
      `Supabase URL is missing. Set ${supabaseUrlVariableName} before setting a key.`,
    );
  }

  if (supabasePublishableKey === null) {
    throw new Error(
      `Supabase key is missing. Set ${supabasePublishableKeyVariableNames[0]}.`,
    );
  }

  assertHttpUrl(supabaseUrl, supabaseUrlVariableName);

  return {
    isConfigured: true,
    environment: { supabaseUrl, supabasePublishableKey },
  };
}

export function describeSupabaseEnvironmentFailure(
  result: SupabaseEnvironmentResult,
): string {
  if (result.isConfigured) {
    return '';
  }

  return `Supabase is not configured. Add ${result.missingVariables.join(
    ' and ',
  )} to your environment.`;
}

function normalize(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function firstNonNull(values: Array<string | null>): string | null {
  for (const value of values) {
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function assertHttpUrl(value: string, variableName: string): void {
  if (!/^https?:\/\//i.test(value)) {
    throw new Error(`${variableName} must be a valid http or https URL.`);
  }
}
