import prisma from '../../shared/db.js';

export function findDraftById(id) {
  return prisma.planningDraft.findUnique({
    where: { id },
    include: {
      service: {
        include: {
          eventType: true,
          createdBy: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export function findDraftByServiceId(serviceId) {
  return prisma.planningDraft.findUnique({
    where: { serviceId },
  });
}

export function findActiveDraftByServiceId(serviceId) {
  return prisma.planningDraft.findFirst({
    where: { serviceId, deletedAt: null },
  });
}

export function createDraft(data) {
  return prisma.planningDraft.create({ data });
}

export function updateDraft(id, data) {
  return prisma.planningDraft.update({ where: { id }, data });
}

export function softDeleteDraft(id) {
  return prisma.planningDraft.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export function restoreDraft(id, data) {
  return prisma.planningDraft.update({
    where: { id },
    data: { ...data, deletedAt: null },
  });
}

export function updateDraftSongs(id, songIds, manualAdditions) {
  return prisma.planningDraft.update({
    where: { id },
    data: { songIds, manualAdditions },
  });
}
