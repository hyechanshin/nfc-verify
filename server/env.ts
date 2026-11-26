import 'dotenv/config';

// Checks, before anything else starts, that every required environment variable is set.
// A missing variable stops the server at once with one clear message listing all of them,
// instead of a stack trace for the first one or a crash later in the middle of a request.

export interface EnvVariable {
  name: string;
  purpose: string;
}

export const REQUIRED_ENV: EnvVariable[] = [
  { name: 'MONGO_URI', purpose: 'MongoDB connection string (Atlas: Connect > Drivers).' },
  { name: 'ADMIN_PASSWORD', purpose: 'Password for the admin pages. Use a long one.' },
  { name: 'KEY_ENCRYPTION_SECRET', purpose: 'Long random string that encrypts tag keys. Keep a backup.' }
];

// A value that is empty or only spaces counts as missing.
export function findMissing(env: NodeJS.ProcessEnv = process.env): EnvVariable[] {
  return REQUIRED_ENV.filter(({ name }) => !env[name]?.trim());
}

export function missingMessage(missing: EnvVariable[]): string {
  const width = Math.max(...missing.map((v) => v.name.length));
  const them = missing.length === 1 ? 'it' : 'them';
  const lines = missing.map((v) => `  ${v.name.padEnd(width)}  ${v.purpose}`);
  return [
    `Cannot start: ${missing.length} required environment variable${missing.length === 1 ? ' is' : 's are'} missing.`,
    '',
    ...lines,
    '',
    `Running locally: add ${them} to server/.env (copy server/.env.example to start).`,
    `Running on Render or another host: add ${them} in the service settings under Environment, then redeploy.`,
    'To generate a random secret:',
    `  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    'Full instructions: "Setup, step by step" in the README.'
  ].join('\n');
}

export function checkEnv(): void {
  const missing = findMissing();
  if (missing.length === 0) return;
  console.error(missingMessage(missing));
  process.exit(1);
}
