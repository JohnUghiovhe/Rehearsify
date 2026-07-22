// Business logic and public API for repertoire.
// Other modules call functions exported from HERE, never from repertoire.model.js.
// Follow the pattern in auth.service.js.

import * as repertoireModel from './repertoire.model.js';

const VALID_SEASONS = ['ADVENT', 'CHRISTMAS', 'LENT', 'EASTER', 'PENTECOST', 'ORDINARY'];


function assertValidSeason(season) {
    if (!VALID_SEASONS.includes(season)) {
        const err = new Error(`Invalid season: ${season}`);
        err.statusCode = 400;
        throw err;
    }
}

function assertValidDifficulty(difficulty) {
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
        const err = new Error(`Difficulty must be an integer between 1 and 5`)
        err.statusCode = 400;
        throw err;
    }
}

export async function createSong(data) {
    assertValidSeason(data.season);
    assertValidDifficulty(data.difficulty);
    
    const existing = await repertoireModel.findSongByTitleAndComposer(data.title, data.composer);
    if (existing) {
        const err = new Error('A song with this title and composer already exists');
        err.statusCode = 400;
        throw err;
    }
    return repertoireModel.createSong(data);
}


export async function listSongs(filters) {
    if (filters.season) assertValidSeason(filters.season);
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
    await getSongById(id); // throws 404 if missing
    if (data.season) assertValidSeason(data.season);
    if (data.difficulty !== undefined) assertValidDifficulty(data.difficulty);
    return repertoireModel.updateSong(id, data);
}

export async function softDeleteSong(id) {
    await getSongById(id); // throws 404 if missing
    return repertoireModel.softDeleteSong(id);
}
