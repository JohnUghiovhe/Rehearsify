// Business logic and public API for repertoire.
import * as repertoireModel from './repertoire.model.js';

export async function createSong(data) {
  // Business Rule: Prevent duplicate songs by title + composer
  const existing = await repertoireModel.findSongByTitleAndComposer(data.title, data.composer);
  if (existing) {
    const err = new Error('A song with this title and composer already exists');
    err.statusCode = 400;
    throw err;
  }

  return repertoireModel.createSong(data);
}

export async function listSongs(filters) {
  return repertoireModel.findSongs(filters);
}

export async function getSongById(id) {
  const song = await repertoireModel.findSongById(id);
  if (!song) {
    const err = new Error('Song not found');
    err.statusCode = 404;
    throw err;
  }
  return song;
}

export async function updateSong(id, data) {
  const currentSong = await getSongById(id); // Throws 404 if missing

  // Determine what the target title & composer will be after update
  const newTitle = data.title ?? currentSong.title;
  const newComposer = data.composer ?? currentSong.composer;

  // If title or composer is changing, verify no other song already uses this combination
  if (data.title || data.composer) {
    const existing = await repertoireModel.findSongByTitleAndComposer(newTitle, newComposer);
    
    // Check if a match exists AND it's not the same song we are currently updating
    if (existing && existing.id !== id) {
      const err = new Error('A song with this title and composer already exists');
      err.statusCode = 400;
      throw err;
    }
  }

  return repertoireModel.updateSong(id, data);
}

export async function softDeleteSong(id) {
  await getSongById(id); // Throws 404 if missing
  return repertoireModel.softDeleteSong(id);
}