// The ONLY file allowed to read process.env directly.
// Every other file imports `config` from here instead.
// This fails loudly at startup if something required is missing,
// instead of failing silently mid-request later.

import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  job: {
    lookaheadDays: Number(process.env.JOB_LOOKAHEAD_DAYS) || 7,
  },
  email: {
    // filled in once we pick an email provider in the Planning/Job blocks
    apiKey: process.env.EMAIL_API_KEY,
    fromAddress: process.env.EMAIL_FROM_ADDRESS,
  },
};

export default config;