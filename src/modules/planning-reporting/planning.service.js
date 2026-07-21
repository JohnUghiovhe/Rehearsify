import * as model from './planning.model.js';
import * as schedulingService from '../scheduling/index.js';
import prisma from '../../shared/db.js';

export async function fetchService(serviceId) {
  const service = await schedulingService.getService(serviceId);
  const draft = await model.findDraftByServiceId(serviceId);
  return {
    ...service,
    draft: draft ?? null,
  };
}

export async function createDraft(input) {
  const service = await schedulingService.getService(input.serviceId);
  const existing = await model.findDraftByServiceId(input.serviceId);
  if (existing) {
    throw Object.assign(new Error('Draft already exists for this service'), { statusCode: 409 });
  }
  return model.createDraft({
    serviceId: input.serviceId,
    songIds: [],
    manualAdditions: input.manualAdditions ?? [],
  });
}

export async function addSongToDraft(draftId, songId, actor) {
  const draft = await model.findDraftById(draftId);
  if (!draft || draft.deletedAt) {
    throw Object.assign(new Error('Draft not found'), { statusCode: 404 });
  }

  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) {
    throw Object.assign(new Error('Song not found'), { statusCode: 404 });
  }

  if (draft.songIds.includes(songId)) {
    throw Object.assign(new Error('Song already in draft'), { statusCode: 409 });
  }

  const updatedSongIds = [...draft.songIds, songId];
  const updatedManualAdditions = draft.manualAdditions.includes(songId)
    ? draft.manualAdditions
    : [...draft.manualAdditions, songId];

  return model.updateDraft(draftId, {
    songIds: updatedSongIds,
    manualAdditions: updatedManualAdditions,
  });
}

export async function removeSongFromDraft(draftId, songId) {
  const draft = await model.findDraftById(draftId);
  if (!draft || draft.deletedAt) {
    throw Object.assign(new Error('Draft not found'), { statusCode: 404 });
  }

  if (!draft.songIds.includes(songId)) {
    throw Object.assign(new Error('Song not found in draft'), { statusCode: 404 });
  }

  const updatedSongIds = draft.songIds.filter((id) => id !== songId);
  const updatedManualAdditions = draft.manualAdditions.filter((id) => id !== songId);

  return model.updateDraft(draftId, {
    songIds: updatedSongIds,
    manualAdditions: updatedManualAdditions,
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
