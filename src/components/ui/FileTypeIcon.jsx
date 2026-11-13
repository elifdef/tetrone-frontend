import { memo, useId } from 'react';

const FILE_GROUPS = {
    pdf: {
        exts: ['pdf'],
        topColor: '#e5534b',
        bottomColor: '#b92b27',
        borderColor: '#961e1b'
    },
    word: {
        exts: ['doc', 'docx', 'dot', 'dotx', 'odt', 'pages', 'wpd'],
        topColor: '#5b88bd',
        bottomColor: '#366092',
        borderColor: '#26466d'
    },
    excel: {
        exts: ['xls', 'xlsx', 'xlsm', 'xlsb', 'ods', 'csv', 'tsv', 'numbers'],
        topColor: '#4da353',
        bottomColor: '#2b7330',
        borderColor: '#1e5222'
    },
    powerpoint: {
        exts: ['ppt', 'pptx', 'pps', 'ppsx', 'odp', 'key'],
        topColor: '#e87643',
        bottomColor: '#bf4b1b',
        borderColor: '#913610'
    },
    archive: {
        exts: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst', 'cab', 'lz', 'lzma'],
        topColor: '#b07db8',
        bottomColor: '#7d4b85',
        borderColor: '#5c3463'
    },
    text: {
        exts: ['txt', 'md', 'markdown', 'rtf', 'log', 'nfo', 'tex', 'org', 'adoc'],
        topColor: '#78909c',
        bottomColor: '#546e7a',
        borderColor: '#37474f'
    },
    markup: {
        exts: ['html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'astro'],
        topColor: '#42a5f5',
        bottomColor: '#1976d2',
        borderColor: '#0d47a1'
    },
    code: {
        exts: ['c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'java', 'kt', 'swift', 'dart', 'lua', 'r', 'sql', 'graphql'],
        topColor: '#7e57c2',
        bottomColor: '#512da8',
        borderColor: '#311b92'
    },
    data: {
        exts: ['json', 'json5', 'xml', 'yaml', 'yml', 'toml', 'ini', 'env', 'conf', 'cfg', 'sqlite', 'db', 'dump', 'bak'],
        topColor: '#26a69a',
        bottomColor: '#00796b',
        borderColor: '#004d40'
    },
    design: {
        exts: [
            'psd', 'psb', 'ai', 'eps', 'fig', 'sketch', 'xd', 'cdr', 'ico', 'icns',
            'tga', 'tiff', 'tif', 'bmp', 'raw', 'cr2', 'nef', 'arw', 'dng',
            'blend', 'obj', 'fbx', 'stl', '3ds', 'dae', 'gltf', 'glb', 'drawio'
        ],
        topColor: '#ec407a',
        bottomColor: '#ad1457',
        borderColor: '#880e4f'
    },
    mediaProject: {
        exts: ['srt', 'vtt', 'ass', 'ssa', 'sub', 'aep', 'prproj', 'veg', 'drp', 'flp', 'als', 'ptx', 'mid', 'midi'],
        topColor: '#5c6bc0',
        bottomColor: '#303f9f',
        borderColor: '#1a237e'
    },
    book: {
        exts: ['epub', 'fb2', 'mobi', 'azw', 'azw3', 'djvu', 'chm', 'cbr', 'cbz'],
        topColor: '#ffa726',
        bottomColor: '#ef6c00',
        borderColor: '#e65100'
    },
    font: {
        exts: ['ttf', 'otf', 'woff', 'woff2', 'eot', 'fon'],
        topColor: '#5c769d',
        bottomColor: '#344966',
        borderColor: '#1f2d40'
    },
    torrent: {
        exts: ['torrent', 'magnet', 'pem', 'crt', 'cer', 'pub', 'p12', 'pfx', 'gpx', 'kml', 'kmz'],
        topColor: '#7cb342',
        bottomColor: '#558b2f',
        borderColor: '#33691e'
    }
};

const DEFAULT_GROUP = {
    key: 'unknown',
    topColor: '#8497b0',
    bottomColor: '#596d87',
    borderColor: '#3f4f63'
};

const getExtension = (fileName = '') => {
    const cleanName = String(fileName).split('?')[0].split('#')[0];
    const parts = cleanName.split('.');
    if (parts.length < 2) return '';
    return parts.pop().toLowerCase();
};

const resolveGroup = (ext) => {
    for (const [key, group] of Object.entries(FILE_GROUPS)) {
        if (group.exts.includes(ext)) {
            return { key, ...group };
        }
    }
    return DEFAULT_GROUP;
};

const DocumentSvg = ({ ext, group, size = 24 }) => {
    const uid = useId();
    const paperGradId = `doc-paper-${uid}`;
    const cornerGradId = `doc-corner-${uid}`;
    const badgeGradId = `doc-badge-${uid}`;

    const badgeText = (ext || 'FILE').toUpperCase().slice(0, 4);
    const fontSize = badgeText.length >= 4 ? '6.1' : badgeText.length === 3 ? '7.1' : '7.9';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block shrink-0"
        >
            <defs>
                <linearGradient id={paperGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="65%" stopColor="#f5f7fa" />
                    <stop offset="100%" stopColor="#e4eaf2" />
                </linearGradient>

                <linearGradient id={cornerGradId} x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#cfd9e6" />
                </linearGradient>

                <linearGradient id={badgeGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={group.topColor} />
                    <stop offset="100%" stopColor={group.bottomColor} />
                </linearGradient>
            </defs>

            <path
                d="M4.5 2.5H15.2L20.5 7.8V22.5H4.5V2.5Z"
                fill="rgba(43, 88, 122, 0.14)"
            />

            <path
                d="M3.5 1.5H14.5L19.5 6.5V21.5H3.5V1.5Z"
                fill={`url(#${paperGradId})`}
                stroke="#9fb0c4"
                strokeWidth="1"
            />

            <path
                d="M4.5 2.5H14.1L18.5 6.9V20.5H4.5V2.5Z"
                stroke="#ffffff"
                strokeWidth="0.8"
            />

            <path
                d="M14.2 6.8L19.2 8.4V6.8H14.2Z"
                fill="#c2cfde"
            />

            <path
                d="M14.5 1.5V6.5H19.5L14.5 1.5Z"
                fill={`url(#${cornerGradId})`}
                stroke="#9fb0c4"
                strokeWidth="1"
                strokeLinejoin="round"
            />

            <line x1="6" y1="5.5" x2="12" y2="5.5" stroke="#b8c5d6" strokeWidth="1.2" />
            <line x1="6" y1="8.2" x2="16.5" y2="8.2" stroke="#b8c5d6" strokeWidth="1.2" />
            <line x1="6" y1="10.8" x2="14" y2="10.8" stroke="#cbd5e3" strokeWidth="1.2" />

            <rect
                x="1.5"
                y="12.5"
                width="20"
                height="8"
                rx="1"
                fill={`url(#${badgeGradId})`}
                stroke={group.borderColor}
                strokeWidth="0.9"
            />

            <line
                x1="2.4"
                y1="13.4"
                x2="20.6"
                y2="13.4"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="0.8"
            />

            <text
                x="11.5"
                y="18.7"
                textAnchor="middle"
                fill="rgba(0, 0, 0, 0.35)"
                fontFamily="Tahoma, Verdana, Arial, sans-serif"
                fontWeight="bold"
                fontSize={fontSize}
                letterSpacing="0.2"
            >
                {badgeText}
            </text>

            <text
                x="11.5"
                y="18.2"
                textAnchor="middle"
                fill="#ffffff"
                fontFamily="Tahoma, Verdana, Arial, sans-serif"
                fontWeight="bold"
                fontSize={fontSize}
                letterSpacing="0.2"
            >
                {badgeText}
            </text>
        </svg>
    );
};

const FileTypeIcon = ({ fileName, size = 24 }) => {
    const ext = getExtension(fileName);
    const group = resolveGroup(ext);
    return <DocumentSvg ext={ext} group={group} size={size} />;
};

export default memo(FileTypeIcon);