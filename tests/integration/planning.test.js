import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';
import prisma from '../../src/shared/db.js';

const API = '/api/plans';

let authToken;
let testUserId;
let testServiceId;
let testServiceId2;
let testSongIds = [];
let testDraftId;

async function registerAndGetToken(email, password, role = 'CHOIR_DIRECTOR') {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, password, role }),
  });
  const data = await res.json();
  return { token: data.token, userId: data.user.id };
}

async function createService(date, season = 'ORDINARY') {
  const eventType = await prisma.eventType.findFirst();
  const res = await fetch('http://localhost:3000/api/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      eventTypeId: eventType.id,
      date: date.toISOString(),
      season,
    }),
  });
  const data = await res.json();
  return data.data.id;
}

async function seedTestSongs() {
  const songs = await prisma.song.findMany({ take: 5 });
  return songs.map((s) => s.id);
}

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`http://localhost:3000${path}`, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

describe('Planning Module Integration', () => {
  before(async () => {
    const { token, userId } = await registerAndGetToken(
      `planner-${Date.now()}@test.com`,
      'password123',
    );
    authToken = token;
    testUserId = userId;

    const now = new Date();
    testServiceId = await createService(new Date(now.getTime() + 7 * 86400000));
    testServiceId2 = await createService(new Date(now.getTime() + 14 * 86400000));
    testSongIds = await seedTestSongs();
  });

  after(async () => {
    await prisma.planningDraft.deleteMany({
      where: { serviceId: { in: [testServiceId, testServiceId2] } },
    });
    await prisma.service.deleteMany({ where: { createdById: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  });

  describe('POST /draft - create draft', () => {
    it('creates a draft for a service', async () => {
      const { status, data } = await apiCall('POST', `${API}/draft`, {
        serviceId: testServiceId,
      });
      assert.equal(status, 201);
      assert.ok(data.data.id);
      testDraftId = data.data.id;
    });

    it('returns 409 for duplicate service', async () => {
      const { status } = await apiCall('POST', `${API}/draft`, {
        serviceId: testServiceId,
      });
      assert.equal(status, 409);
    });
  });

  describe('POST /draft/:draftId/song/:songId - add songs', () => {
    it('adds a song to the draft', async () => {
      const { status } = await apiCall(
        'POST',
        `${API}/draft/${testDraftId}/song/${testSongIds[0]}`,
      );
      assert.equal(status, 200);
    });

    it('adds second song', async () => {
      const { status } = await apiCall(
        'POST',
        `${API}/draft/${testDraftId}/song/${testSongIds[1]}`,
      );
      assert.equal(status, 200);
    });

    it('returns 409 for duplicate song', async () => {
      const { status } = await apiCall(
        'POST',
        `${API}/draft/${testDraftId}/song/${testSongIds[0]}`,
      );
      assert.equal(status, 409);
    });
  });

  describe('GET /draft/:draftId - enriched fetch', () => {
    it('returns enriched draft with song details and duration', async () => {
      const { status, data } = await apiCall('GET', `${API}/draft/${testDraftId}`);
      assert.equal(status, 200);

      const draft = data.data;
      assert.equal(draft.id, testDraftId);
      assert.equal(draft.serviceId, testServiceId);
      assert.ok(draft.serviceName);
      assert.ok(draft.serviceDate);
      assert.equal(draft.songCount, 2);
      assert.ok(draft.totalDuration > 0);
      assert.ok(Array.isArray(draft.songs));
      assert.equal(draft.songs.length, 2);

      const song = draft.songs[0];
      assert.ok(song.songId);
      assert.ok(song.title);
      assert.ok(typeof song.duration === 'number');
      assert.ok(typeof song.difficulty === 'number');
    });
  });

  describe('GET /drafts - list with filters', () => {
    it('lists active drafts', async () => {
      const { status, data } = await apiCall('GET', `${API}/drafts?status=active`);
      assert.equal(status, 200);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.pagination);
      assert.ok(data.pagination.total >= 1);
    });

    it('filters by serviceId', async () => {
      const { status, data } = await apiCall(
        'GET',
        `${API}/drafts?serviceId=${testServiceId}`,
      );
      assert.equal(status, 200);
      assert.equal(data.data.length, 1);
      assert.equal(data.data[0].serviceId, testServiceId);
    });

    it('paginates correctly', async () => {
      const { status, data } = await apiCall('GET', `${API}/drafts?limit=1&page=1`);
      assert.equal(status, 200);
      assert.equal(data.data.length, 1);
      assert.equal(data.pagination.totalPages >= 1, true);
    });

    it('sorts by serviceDate ascending', async () => {
      const { status, data } = await apiCall(
        'GET',
        `${API}/drafts?sortBy=serviceDate&sortOrder=asc`,
      );
      assert.equal(status, 200);
      if (data.data.length >= 2) {
        const d1 = new Date(data.data[0].service?.date ?? 0);
        const d2 = new Date(data.data[1].service?.date ?? 0);
        assert.ok(d1 <= d2);
      }
    });

    it('sorts by createdAt descending', async () => {
      const { status, data } = await apiCall(
        'GET',
        `${API}/drafts?sortBy=createdAt&sortOrder=desc`,
      );
      assert.equal(status, 200);
      assert.ok(data.data.length >= 1);
    });
  });

  describe('PATCH /draft/:draftId/clear - clear songs', () => {
    it('clears all songs from draft', async () => {
      const { status, data } = await apiCall('PATCH', `${API}/draft/${testDraftId}/clear`);
      assert.equal(status, 200);
      assert.equal(data.data.songIds.length, 0);
      assert.equal(data.data.manualAdditions.length, 0);
    });

    it('getDraft shows 0 songs after clear', async () => {
      const { status, data } = await apiCall('GET', `${API}/draft/${testDraftId}`);
      assert.equal(status, 200);
      assert.equal(data.data.songCount, 0);
      assert.equal(data.data.totalDuration, 0);
    });
  });

  describe('POST /draft/:draftId/clone - clone draft', () => {
    it('clones draft to new service', async () => {
      await apiCall('POST', `${API}/draft/${testDraftId}/song/${testSongIds[2]}`);

      const { status, data } = await apiCall('POST', `${API}/draft/${testDraftId}/clone`, {
        targetServiceId: testServiceId2,
      });
      assert.equal(status, 201);
      assert.equal(data.data.serviceId, testServiceId2);
      assert.deepEqual(data.data.songIds, [testSongIds[2]]);
    });

    it('returns 409 if target service already has draft', async () => {
      const { status } = await apiCall('POST', `${API}/draft/${testDraftId}/clone`, {
        targetServiceId: testServiceId2,
      });
      assert.equal(status, 409);
    });
  });

  describe('DELETE /draft/:draftId - soft delete', () => {
    it('soft-deletes the draft', async () => {
      const { status } = await apiCall('DELETE', `${API}/draft/${testDraftId}`);
      assert.equal(status, 204);
    });

    it('returns 404 for deleted draft', async () => {
      const { status } = await apiCall('GET', `${API}/draft/${testDraftId}`);
      assert.equal(status, 404);
    });

    it('deleted draft excluded from active list', async () => {
      const { data } = await apiCall('GET', `${API}/drafts?status=active`);
      const found = data.data.find((d) => d.id === testDraftId);
      assert.equal(found, undefined);
    });
  });

  describe('Validation', () => {
    it('rejects invalid serviceId on create', async () => {
      const { status } = await apiCall('POST', `${API}/draft`, {
        serviceId: 'not-a-uuid',
      });
      assert.equal(status, 400);
    });

    it('rejects invalid query params', async () => {
      const { status } = await apiCall('GET', `${API}/drafts?page=-1`);
      assert.equal(status, 400);
    });
  });
});
