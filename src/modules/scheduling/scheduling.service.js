// Business logic and public API for scheduling.
// Other modules call functions exported from HERE, never from scheduling.model.js.
// Follow the pattern in auth.service.js.

import * as model from './scheduling.model.js';

export async function createService(input) {
  const eventType = await model.findEventTypeById(input.eventTypeId);
  if (!eventType) {
    throw Object.assign(new Error('EventType not found'), { status: 404 });
  }

  return model.createService({
    eventTypeId: input.eventTypeId,
    date: input.date,
    season: input.season,
    minSongCount: input.minSongCount ?? null,
    maxSongCount: input.maxSongCount ?? null,
    createdById: input.createdById,
  });
}

export async function getService(serviceId) {
  const service = await model.findServiceById(serviceId);
  if (!service || service.deletedAt) {
    throw Object.assign(new Error('Service not found'), { status: 404 });
  }
  return service;
}

export async function listServices(filters) {
  return model.listServices(filters);
}

export async function updateService(serviceId, updates) {
  const service = await model.findServiceById(serviceId);
  if (!service || service.deletedAt) {
    throw Object.assign(new Error('Service not found'), { status: 404 });
  }
  return model.updateService(serviceId, updates);
}

export async function deleteService(serviceId) {
  const service = await model.findServiceById(serviceId);
  if (!service || service.deletedAt) {
    throw Object.assign(new Error('Service not found'), { status: 404 });
  }
  return model.softDeleteService(serviceId);
}

export async function updateServiceStatus(serviceId, newStatus) {
  const service = await model.findServiceById(serviceId);
  if (!service || service.deletedAt) {
    throw Object.assign(new Error('Service not found'), { status: 404 });
  }
  if (service.status === 'CONFIRMED') {
    throw Object.assign(new Error('Cannot change status of a confirmed service'), { status: 400 });
  }
  if (newStatus !== 'CONFIRMED') {
    throw Object.assign(new Error('Only CONFIRMED is a valid status transition from DRAFT'), { status: 400 });
  }
  return model.updateService(serviceId, { status: 'CONFIRMED' });
}

export async function getDraftServicesWithinDays(days) {
  return model.findDraftServicesWithinDays(days);
}
