import { config } from '@dotenvx/dotenvx';

const envVariablesToCheck = [
  // CDK env variables
  'CDK_DEFAULT_ACCOUNT',
  'CDK_DEFAULT_REGION',
  // App specific env variables
  'APP_DOMAIN_CERTIFICATE_ARN',
  'APP_WEBSOCKET_DOMAIN',
  'APP_RESTAPI_DOMAIN'
] as const;

export function loadAndVerifyEnv(
  envFiles: string[] = ['.env', '.env.local'],
): Record<(typeof envVariablesToCheck)[number], string> {
  config({ path: envFiles, override: process.env.CI !== 'true' });

  return envVariablesToCheck.reduce(
    (env, envVar) => {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} is not set`);
      }

      return Object.assign(env, { [envVar]: process.env[envVar] });
    },
    {} as Record<string, string>,
  );
}
