import { notifyError, notifyWarn } from '../components/common/Notify';
import { MAX_FILE_SIZE_KB } from '../config';
import i18n from '../i18n';
import { isForbiddenFile } from './fileTypes';

export const checkFileSize = (file: File): boolean => {
    const maxBytes = MAX_FILE_SIZE_KB * 1024;
    if (file.size > maxBytes) {
        notifyWarn(i18n.t('error.file_too_large', { size: MAX_FILE_SIZE_KB / 1024 }));
        return false;
    }
    return true;
};

export const validateImageFile = (file: File): boolean => {
    const rasterMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!rasterMimes.includes(file.type)) {
        notifyError(i18n.t('error.not_image'));
        return false;
    }
    return checkFileSize(file);
};

export const validateGenericFile = (file: File): boolean => {
    if (isForbiddenFile(file)) {
        notifyError(i18n.t('error.not_allowed_types'));
        return false;
    }

    return checkFileSize(file);
};

export const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes <= 0) return `0 ${i18n.t('file.bytes')}`;
    const k = 1024;
    const sizes = [i18n.t('file.bytes'), i18n.t('file.kb'), i18n.t('file.mb'), i18n.t('file.gb')];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0]?.match(/:(.*?);/);
    const mime = mimeMatch?.[1] ?? 'application/octet-stream';
    const bstr = atob(arr[1] ?? '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};