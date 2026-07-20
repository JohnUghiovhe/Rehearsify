// Thin HTTP layer for scheduling — calls scheduling.service.js, shapes responses.
// Follow the pattern in auth.controller.js.

import * as service from './scheduling.service.js';

export async function createServiceHandler(req, res, next) {
  try {
    const result = await service.createService({
      ...req.body,
      createdById: req.user.id,
    });
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getServiceHandler(req, res, next) {
  try {
    const result = await service.getService(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listServicesHandler(req, res, next) {
  try {
    const result = await service.listServices(req.query);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateServiceHandler(req, res, next) {
  try {
    const result = await service.updateService(req.params.id, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function deleteServiceHandler(req, res, next) {
  try {
    await service.deleteService(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function updateServiceStatusHandler(req, res, next) {
  try {
    const result = await service.updateServiceStatus(req.params.id, req.body.status);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
