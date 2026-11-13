export const FORBIDDEN_EXTENSIONS = [
    'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'pif', 'cpl', 'msc', 'gadget',
    'dll', 'so', 'dylib', 'bin', 'app', 'deb', 'rpm', 'apk', 'aab', 'ipa', 'dmg', 'pkg',
    'iso', 'img', 'reg', 'inf', 'lnk', 'url',
    'sh', 'bash', 'zsh', 'ps1', 'psm1', 'vbs', 'vbe', 'wsf', 'wsh', 'hta',
    'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'php8', 'phps', 'phar',
    'py', 'pyc', 'pyo', 'rb', 'pl', 'cgi', 'asp', 'aspx', 'jsp', 'jspx',
    'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx',
    'jar', 'war', 'ear',
    'svg'
];

export const FORBIDDEN_MIMES = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-sh',
    'application/x-shellscript',
    'application/x-httpd-php',
    'text/x-php',
    'application/javascript',
    'text/javascript',
    'application/x-executable',
    'application/x-dosexec',
    'image/svg+xml'
];

export const IMAGE_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'avif'];
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'ogg'];
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus'];

export const ACCEPT_ATTRS = {
    image: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif',
    video: 'video/mp4,video/webm,video/quicktime,video/x-matroska',
    audio: 'audio/*',
    document: '*/*',
    all: '*/*'
};

export const getFileExtension = (fileOrName) => {
    if (!fileOrName) return '';
    const rawName = typeof fileOrName === 'string'
        ? fileOrName
        : (fileOrName.original_name || fileOrName.file_name || fileOrName.name || fileOrName.url || '');

    const cleanName = String(rawName).split('?')[0].split('#')[0];
    const parts = cleanName.split('.');
    if (parts.length < 2) return '';
    return parts.pop().toLowerCase();
};

export const getFileMime = (file) => {
    if (!file || typeof file === 'string') return '';
    return String(file.mime_type || file.type || '').toLowerCase().trim();
};

export const isForbiddenFile = (file) => {
    if (!file) return true;
    const ext = getFileExtension(file);
    const mime = getFileMime(file);

    if (ext && FORBIDDEN_EXTENSIONS.includes(ext)) return true;
    if (mime && FORBIDDEN_MIMES.includes(mime)) return true;

    return false;
};

export const isAllowedFile = (file) => !isForbiddenFile(file);

export const isImageFile = (file) => {
    if (!file) return false;
    const mime = getFileMime(file);
    const ext = getFileExtension(file);

    if (mime === 'image/svg+xml' || ext === 'svg') return false;
    if (mime === 'image' || mime.startsWith('image/')) return true;
    return IMAGE_EXTENSIONS.includes(ext);
};

export const isVideoFile = (file) => {
    if (!file) return false;
    const mime = getFileMime(file);
    const ext = getFileExtension(file);

    if (mime === 'video' || mime.startsWith('video/')) return true;
    return VIDEO_EXTENSIONS.includes(ext);
};

export const isAudioFile = (file) => {
    if (!file) return false;
    const mime = getFileMime(file);
    const ext = getFileExtension(file);

    if (mime === 'audio' || mime.startsWith('audio/')) return true;
    return AUDIO_EXTENSIONS.includes(ext);
};

export const getMediaCategory = (file) => {
    if (isImageFile(file)) return 'image';
    if (isVideoFile(file)) return 'video';
    if (isAudioFile(file)) return 'audio';
    return 'document';
};

export const getVideoMimeType = (file) => {
    const mime = getFileMime(file);
    if (mime && mime.includes('/')) return mime;

    const ext = getFileExtension(file);
    const map = {
        webm: 'video/webm',
        ogg: 'video/ogg',
        mov: 'video/quicktime',
        mkv: 'video/x-matroska',
        avi: 'video/x-msvideo'
    };
    return map[ext] || 'video/mp4';
};