import * as model from './planning.model.js';
import * as schedulingService from '../scheduling/index.js';
import * as repertoireService from '../repertoire/repertoire.service.js';
import prisma from '../../shared/db.js';

const DURATION_BY_DIFFICULTY = { 1: 120, 2: 180, 3: 240, 4: 300, 5: 360 };

function estimateDuration(difficulty) {
  return DURATION_BY_DIFFICULTY[difficulty] ?? 180;
}

function assertDraftActive(draft) {
  if (!draft || draft.deletedAt) {
    throw Object.assign(new Error('Draft not found'), { statusCode: 404 });
  }
}

function buildEnrichedResponse(draft, songs) {
  const songMap = new Map(songs.map((s) => [s.id, s]));
  const allIds = [...new Set([...draft.songIds, ...draft.manualAdditions])];

  const enrichedSongs = allIds
    .filter((id) => songMap.has(id))
    .map((id) => {
      const song = songMap.get(id);
      const duration = estimateDuration(song.difficulty);
      return { songId: song.id, title: song.title, duration, difficulty: song.difficulty };
    });

  const totalDuration = enrichedSongs.reduce((sum, s) => sum + s.duration, 0);

  return {
    id: draft.id,
    serviceId: draft.serviceId,
    serviceName: draft.service?.eventType?.name ?? null,
    serviceDate: draft.service?.date ?? null,
    songs: enrichedSongs,
    songCount: enrichedSongs.length,
    totalDuration,
    manualAdditions: draft.manualAdditions,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

export async function fetchService(serviceId) {
  const service = await schedulingService.getService(serviceId);
  const draft = await model.findActiveDraftByServiceId(serviceId);
  return {
    ...service,
    draft: draft ?? null,
  };
}

export async function createDraft(input) {
  const service = await schedulingService.getService(input.serviceId);
  const existing = await model.findDraftByServiceId(input.serviceId);

  if (existing) {
    if (existing.deletedAt) {
      const restored = await model.restoreDraft(existing.id, {
        songIds: [],
        manualAdditions: input.manualAdditions ?? [],
      });
      return restored;
    }
    throw Object.assign(new Error('Draft already exists for this service'), { statusCode: 409 });
  }

  try {
    return await model.createDraft({
      serviceId: input.serviceId,
      songIds: [],
      manualAdditions: input.manualAdditions ?? [],
    });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.modelName === 'PlanningDraft') {
      throw Object.assign(new Error('Draft already exists for this service'), { statusCode: 409 });
    }
    throw err;
  }
}

export async function addSongToDraft(draftId, songId) {
  await repertoireService.getSongById(songId);

  return prisma.$transaction(async (tx) => {
    const draft = await tx.planningDraft.findUnique({
      where: { id: draftId },
    });
    assertDraftActive(draft);

    if (draft.songIds.includes(songId)) {
      throw Object.assign(new Error('Song already in draft'), { statusCode: 409 });
    }

    const songIds = [...draft.songIds, songId];
    const manualAdditions = draft.manualAdditions.includes(songId)
      ? draft.manualAdditions
      : [...draft.manualAdditions, songId];

    return tx.planningDraft.update({
      where: { id: draftId },
      data: { songIds, manualAdditions },
    });
  });
}

export async function removeSongFromDraft(draftId, songId) {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.planningDraft.findUnique({
      where: { id: draftId },
    });
    assertDraftActive(draft);

    if (!draft.songIds.includes(songId)) {
      throw Object.assign(new Error('Song not found in draft'), { statusCode: 404 });
    }

    const songIds = draft.songIds.filter((id) => id !== songId);
    const manualAdditions = draft.manualAdditions.filter((id) => id !== songId);

    return tx.planningDraft.update({
      where: { id: draftId },
      data: { songIds, manualAdditions },
    });
  });
}

export async function getDraft(draftId) {
  const draft = await model.findDraftById(draftId);
  assertDraftActive(draft);

  const songs = await model.findSongsByIds(draft.songIds);
  return buildEnrichedResponse(draft, songs);
}

export async function deleteDraft(draftId) {
  const draft = await model.findDraftById(draftId);
  assertDraftActive(draft);
  return model.softDeleteDraft(draftId);
}

export async function listDrafts(filters) {
  const where = {};

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  if (filters.status === 'active') {
    where.deletedAt = null;
  } else if (filters.status === 'deleted') {
    where.deletedAt = { not: null };
  }

  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
    if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
  }

  const { sortBy, sortOrder, page, limit } = filters;
  const skip = (page - 1) * limit;
  const take = limit;

  // TODO: songCount sort fetches all drafts in memory because songCount is computed
  // from the songIds array — not a DB column. Fine for seed data volumes, but will
  // need a materialised songCount column or similar if drafts/songs grow large.
  if (sortBy === 'songCount') {
    const allDrafts = await model.listDrafts({
      where,
      orderBy: { createdAt: 'asc' },
      skip: 0,
      take: undefined,
    });

    const allSongs = await model.findSongsByIds(
      allDrafts.flatMap((d) => d.songIds),
    );
    const songMap = new Map(allSongs.map((s) => [s.id, s]));

    const scored = allDrafts.map((d) => ({
      draft: d,
      songCount: d.songIds.filter((id) => songMap.has(id)).length,
    }));

    scored.sort((a, b) =>
      sortOrder === 'asc' ? a.songCount - b.songCount : b.songCount - a.songCount,
    );

    const total = scored.length;
    const paginated = scored.slice(skip, skip + take);

    return {
      drafts: paginated.map(({ draft }) => ({
        ...draft,
        songCount: draft.songIds.filter((id) => songMap.has(id)).length,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  const orderBy =
    sortBy === 'serviceDate'
      ? { service: { date: sortOrder } }
      : { createdAt: sortOrder };

  const [drafts, total] = await Promise.all([
    model.listDrafts({ where, orderBy, skip, take }),
    model.countDrafts(where),
  ]);

  const allSongs = await model.findSongsByIds(
    drafts.flatMap((d) => d.songIds),
  );
  const songMap = new Map(allSongs.map((s) => [s.id, s]));

  return {
    drafts: drafts.map((d) => ({
      ...d,
      songCount: d.songIds.filter((id) => songMap.has(id)).length,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function cloneDraft(draftId, targetServiceId) {
  const sourceDraft = await model.findDraftById(draftId);
  if (!sourceDraft || sourceDraft.deletedAt) {
    throw Object.assign(new Error('Source draft not found'), { statusCode: 404 });
  }

  await schedulingService.getService(targetServiceId);

  const existingTarget = await model.findDraftByServiceId(targetServiceId);
  if (existingTarget && !existingTarget.deletedAt) {
    throw Object.assign(new Error('Draft already exists for target service'), { statusCode: 409 });
  }

  if (existingTarget && existingTarget.deletedAt) {
    return model.restoreDraft(existingTarget.id, {
      songIds: sourceDraft.songIds,
      manualAdditions: sourceDraft.manualAdditions,
    });
  }

  try {
    return await model.createDraft({
      serviceId: targetServiceId,
      songIds: [...sourceDraft.songIds],
      manualAdditions: [...sourceDraft.manualAdditions],
    });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.modelName === 'PlanningDraft') {
      throw Object.assign(new Error('Draft already exists for target service'), { statusCode: 409 });
    }
    throw err;
  }
}

export async function clearDraft(draftId) {
  const draft = await model.findDraftById(draftId);
  assertDraftActive(draft);

  return model.updateDraftSongs(draftId, [], []);
}
