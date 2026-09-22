import { notifyError, notifyWarn } from "../components/common/Notify";
import { MAX_FILE_SIZE_KB } from "../config";
import i18n from "../i18n";

export const checkFileSize = (file) => {
    const maxBytes = MAX_FILE_SIZE_KB * 1024;
    if (file.size > maxBytes) {
        notifyWarn(i18n.t('error.file_too_large', { size: MAX_FILE_SIZE_KB / 1024 }));
        return false;
    }
    return true;
};

export const validateImageFile = (file) => {
    // Жорсткіша перевірка на дозволені типи (захист від завантаження скриптів під виглядом картинки)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        notifyError(i18n.t('error.not_image'));
        return false;
    }
    return checkFileSize(file);
};

export const validateGenericFile = (file) => {
    // Розширений список заборонених форматів для безпеки
    const forbiddenExtensions = ['.exe', '.bat', '.sh', '.js', '.php', '.py', '.cmd'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (forbiddenExtensions.includes(ext)) {
        notifyError(i18n.t('error.not_allowed_types'));
        return false;
    }

    return checkFileSize(file);
};

export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 ' + i18n.t('file.bytes');
    const k = 1024;
    // Використовуємо переклади для Bytes, KB, MB
    const sizes = [i18n.t('file.bytes'), i18n.t('file.kb'), i18n.t('file.mb'), i18n.t('file.gb')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Конвертує Base64 рядок з редактора у повноцінний File об'єкт
export const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
        
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};