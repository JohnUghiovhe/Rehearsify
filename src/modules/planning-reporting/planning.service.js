import * as model from './planning.model.js';
import * as schedulingService from '../scheduling/index.js';
import prisma from '../../shared/db.js';

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

function assertDraftActive(draft) {
  if (!draft || draft.deletedAt) {
    throw Object.assign(new Error('Draft not found'), { statusCode: 404 });
  }
}

export async function addSongToDraft(draftId, songId, actor) {
  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) {
    throw Object.assign(new Error('Song not found'), { statusCode: 404 });
  }

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
  if (!draft || draft.deletedAt) {
    throw Object.assign(new Error('Draft not found'), { statusCode: 404 });
  }
  return draft;
}

export async function deleteDraft(draftId) {
  const draft = await model.findDraftById(draftId);
  if (!draft || draft.deletedAt) {
    throw Object.assign(new Error('Draft not found'), { statusCode: 404 });
  }
  return model.softDeleteDraft(draftId);
}
