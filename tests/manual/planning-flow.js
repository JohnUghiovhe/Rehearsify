import app from '../../src/app.js';
import prisma from '../../src/shared/db.js';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';

const request = supertest(app);

describe('Planning Module - Manual End-to-End', () => {
  let user, service, songs, token, draft;

  before(async () => {
    await prisma.planningDraft.deleteMany();
    await prisma.service.deleteMany({ where: { date: new Date('2026-08-15T10:00:00.000Z') } });
    await prisma.user.deleteMany({ where: { email: 'planner-e2e@test.com' } });

    user = await prisma.user.create({
      data: {
        name: 'E2E Planner',
        email: 'planner-e2e@test.com',
        passwordHash: '$2b$10$dummyhash',
        role: 'CHOIR_DIRECTOR',
      },
    });

    const eventType = await prisma.eventType.findFirstOrThrow();
    service = await prisma.service.create({
      data: {
        eventTypeId: eventType.id,
        date: new Date('2026-08-15T10:00:00.000Z'),
        season: 'ORDINARY',
        createdById: user.id,
      },
    });

    songs = await prisma.song.findMany({ take: 3 });

    token = jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, { expiresIn: '1h' });
  });

  after(async () => {
    await prisma.planningDraft.deleteMany();
    await prisma.service.deleteMany({ where: { date: new Date('2026-08-15T10:00:00.000Z') } });
    await prisma.user.deleteMany({ where: { email: 'planner-e2e@test.com' } });
    await prisma.$disconnect();
  });

  it('TC1: Create draft → empty song basket', async () => {
    const res = await request
      .post('/api/plans/draft')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: service.id });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.serviceId, service.id);
    assert.deepStrictEqual(res.body.data.songIds, []);
    assert.deepStrictEqual(res.body.data.manualAdditions, []);
    draft = res.body.data;
  });

  it('TC2: Add song → verify in DB', async () => {
    const res = await request
      .post(`/api/plans/draft/${draft.id}/song/${songs[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data.songIds, [songs[0].id]);

    const inDb = await prisma.planningDraft.findUnique({ where: { id: draft.id } });
    assert.deepStrictEqual(inDb.songIds, [songs[0].id]);
  });

  it('TC3: Add second song → order preserved', async () => {
    const res = await request
      .post(`/api/plans/draft/${draft.id}/song/${songs[1].id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data.songIds, [songs[0].id, songs[1].id]);
  });

  it('TC4: Remove song → verify removal in DB', async () => {
    const res = await request
      .delete(`/api/plans/draft/${draft.id}/song/${songs[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data.songIds, [songs[1].id]);

    const inDb = await prisma.planningDraft.findUnique({ where: { id: draft.id } });
    assert.deepStrictEqual(inDb.songIds, [songs[1].id]);
  });

  it('TC5: Fetch draft with multiple songs → verify structure', async () => {
    await request
      .post(`/api/plans/draft/${draft.id}/song/${songs[0].id}`)
      .set('Authorization', `Bearer ${token}`);
    await request
      .post(`/api/plans/draft/${draft.id}/song/${songs[2].id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .get(`/api/plans/draft/${draft.id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.songIds.length, 3);
    assert.deepStrictEqual(res.body.data.songIds, [songs[1].id, songs[0].id, songs[2].id]);
    assert.ok(res.body.data.service);
    assert.strictEqual(res.body.data.service.eventType.name, 'Regular Sunday Service');
  });

  it('TC6: Duplicate song → 409', async () => {
    const res = await request
      .post(`/api/plans/draft/${draft.id}/song/${songs[1].id}`)
      .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 409);
  });

  it('TC7: Remove non-existent song → 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request
      .delete(`/api/plans/draft/${draft.id}/song/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 404);
  });
});
