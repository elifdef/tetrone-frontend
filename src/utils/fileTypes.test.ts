import { describe, expect, it } from 'vitest';
import { getMediaCategory, isForbiddenFile, isImageFile } from './fileTypes';

describe('fileTypes', () => {
    it('blocks executable and svg files', () => {
        expect(isForbiddenFile({ name: 'payload.exe' })).toBe(true);
        expect(isForbiddenFile({ name: 'vector.svg', type: 'image/svg+xml' })).toBe(true);
        expect(isImageFile({ name: 'vector.svg', type: 'image/svg+xml' })).toBe(false);
    });

    it('classifies allowed media categories accurately', () => {
        expect(getMediaCategory({ name: 'photo.webp', type: 'image/webp' })).toBe('image');
        expect(getMediaCategory({ name: 'clip.mp4', type: 'video/mp4' })).toBe('video');
        expect(getMediaCategory({ name: 'track.mp3', type: 'audio/mpeg' })).toBe('audio');
        expect(getMediaCategory({ name: 'archive.zip', type: 'application/zip' })).toBe('document');
    });
});