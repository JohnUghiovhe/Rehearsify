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
    apiKey: process.env.EMAIL_API_KEY,
    fromAddress: process.env.EMAIL_FROM_ADDRESS,
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
};

export default config;