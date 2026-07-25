// repertoire.controller.js
import * as repertoireService from './repertoire.service.js';

export async function createSongHandler(req, res, next) {
  try {
    const song = await repertoireService.createSong(req.body);
    res.status(201).json({ song });
  } catch (err) {
    next(err);
  }
}

export async function listSongsHandler(req, res, next) {
  try {
    const songs = await repertoireService.listSongs(req.query);
    res.status(200).json({ songs });
  } catch (err) {
    next(err);
  }
}

export async function getSongHandler(req, res, next) {
  try {
    const song = await repertoireService.getSongById(req.params.id);
    res.status(200).json({ song });
  } catch (err) {
    next(err);
  }
}

export async function updateSongHandler(req, res, next) {
  try {
    const song = await repertoireService.updateSong(req.params.id, req.body);
    res.status(200).json({ song });
  } catch (err) {
    next(err);
  }
}

export async function deleteSongHandler(req, res, next) {
  try {
    await repertoireService.softDeleteSong(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}