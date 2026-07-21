import app from '../../src/app.js';
import prisma from '../../src/shared/db.js';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';

const request = supertest(app);

describe('fetchService endpoint', () => {
  let user, service, token;

  before(async () => {
    user = await prisma.user.create({
      data: { name: 'FS Test', email: 'fs-test@test.com', passwordHash: 'hash', role: 'CHOIR_DIRECTOR' },
    });
    const eventType = await prisma.eventType.findFirstOrThrow();
    service = await prisma.service.create({
      data: { eventTypeId: eventType.id, date: new Date('2026-09-01'), season: 'ORDINARY', createdById: user.id },
    });
    token = jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, { expiresIn: '1h' });
  });

  after(async () => {
    await prisma.planningDraft.deleteMany();
    await prisma.service.deleteMany({ where: { date: new Date('2026-09-01') } });
    await prisma.user.deleteMany({ where: { email: 'fs-test@test.com' } });
  });

  it('returns service with draft: null when no draft exists', async () => {
    const res = await request
      .get('/api/plans/service/' + service.id)
      .set('Authorization', 'Bearer ' + token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.draft, null);
    assert.strictEqual(res.body.data.eventType.name, 'Regular Sunday Service');
  });

  it('returns service with draft object when draft exists', async () => {
    const draft = await prisma.planningDraft.create({
      data: { serviceId: service.id, songIds: [], manualAdditions: [] },
    });
    const res = await request
      .get('/api/plans/service/' + service.id)
      .set('Authorization', 'Bearer ' + token);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.draft);
    assert.strictEqual(res.body.data.draft.id, draft.id);
  });
});
