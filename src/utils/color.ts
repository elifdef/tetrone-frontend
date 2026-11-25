export interface HslColor {
    h: number;
    s: number;
    l: number;
}

export interface GradientValue {
    deg: string;
    c1: string;
    c2: string;
}

const DEFAULT_HSL: HslColor = { h: 211, s: 35, l: 41 };
const DEFAULT_SECONDARY_HSL: HslColor = { h: 210, s: 38, l: 62 };

const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

export const formatHsl = ({ h, s, l }: HslColor): string => {
    const normalizedH = ((Math.round(h) % 360) + 360) % 360;
    const normalizedS = clamp(Math.round(s), 0, 100);
    const normalizedL = clamp(Math.round(l), 0, 100);
    return `hsl(${normalizedH}, ${normalizedS}%, ${normalizedL}%)`;
};

export const parseHsl = (value: string): HslColor | null => {
    const match = /^hsl\(\s*(-?\d+(?:\.\d+)?)(?:deg)?\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i.exec(
        value.trim()
    );
    if (!match) return null;

    return {
        h: ((Math.round(Number(match[1])) % 360) + 360) % 360,
        s: clamp(Math.round(Number(match[2])), 0, 100),
        l: clamp(Math.round(Number(match[3])), 0, 100),
    };
};

export const normalizeHsl = (
    value: string,
    fallback: string = formatHsl(DEFAULT_HSL)
): string => {
    const parsed = parseHsl(value);
    return parsed ? formatHsl(parsed) : fallback;
};

export const randomHsl = (options?: {
    minS?: number;
    maxS?: number;
    minL?: number;
    maxL?: number;
}): string => {
    const minS = options?.minS ?? 60;
    const maxS = options?.maxS ?? 100;
    const minL = options?.minL ?? 30;
    const maxL = options?.maxL ?? 60;

    const h = Math.floor(Math.random() * 361);
    const s = Math.floor(Math.random() * (maxS - minS + 1)) + minS;
    const l = Math.floor(Math.random() * (maxL - minL + 1)) + minL;

    return formatHsl({ h, s, l });
};

export const hexToHsl = (hex: string): string => {
    const clean = hex.trim().replace(/^#/, '');
    if (!/^[a-f\d]{6}$/i.test(clean)) {
        return formatHsl(DEFAULT_HSL);
    }

    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / delta + 2) / 6;
                break;
            default:
                h = ((r - g) / delta + 4) / 6;
                break;
        }
    }

    return formatHsl({ h: h * 360, s: s * 100, l: l * 100 });
};

export const hslToHex = (hslString: string, fallback = '#45688e'): string => {
    const parsed = parseHsl(hslString);
    if (!parsed) return fallback;

    const sNorm = parsed.s / 100;
    const lNorm = parsed.l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((parsed.h / 60) % 2) - 1));
    const m = lNorm - c / 2;

    let rPrime = 0;
    let gPrime = 0;
    let bPrime = 0;

    if (parsed.h < 60) {
        rPrime = c;
        gPrime = x;
    } else if (parsed.h < 120) {
        rPrime = x;
        gPrime = c;
    } else if (parsed.h < 180) {
        gPrime = c;
        bPrime = x;
    } else if (parsed.h < 240) {
        gPrime = x;
        bPrime = c;
    } else if (parsed.h < 300) {
        rPrime = x;
        bPrime = c;
    } else {
        rPrime = c;
        bPrime = x;
    }

    const toHex = (channel: number): string =>
        Math.round((channel + m) * 255)
            .toString(16)
            .padStart(2, '0');

    return `#${toHex(rPrime)}${toHex(gPrime)}${toHex(bPrime)}`;
};

export const generateUsernameColorPresets = (count = 8): string[] => {
    if (count <= 0) return [];
    const baseHue = 211;
    const step = 360 / count;

    return Array.from({ length: count }, (_, index) => {
        const hue = (baseHue + Math.round(step * index)) % 360;
        const saturation = index % 2 === 0 ? 68 : 78;
        const lightness = index % 2 === 0 ? 41 : 47;
        return formatHsl({ h: hue, s: saturation, l: lightness });
    });
};

export const generateBannerGradientPresets = (count = 6): GradientValue[] => {
    if (count <= 0) return [];
    const baseHue = 211;
    const step = 360 / count;

    return Array.from({ length: count }, (_, index) => {
        const h1 = (baseHue + Math.round(step * index)) % 360;
        const h2 = (h1 + 32) % 360;
        return {
            deg: index === 0 ? '90deg' : '135deg',
            c1: formatHsl({ h: h1, s: 56, l: 28 }),
            c2: formatHsl({ h: h2, s: 78, l: 54 }),
        };
    });
};

const splitTopLevelArgs = (input: string): string[] => {
    const args: string[] = [];
    let current = '';
    let depth = 0;

    for (const ch of input) {
        if (ch === '(') depth++;
        else if (ch === ')') depth = Math.max(0, depth - 1);

        if (ch === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) args.push(current.trim());
    return args;
};

export const parseGradientHsl = (value: string): GradientValue => {
    const defaultGrad: GradientValue = {
        deg: '90deg',
        c1: formatHsl(DEFAULT_HSL),
        c2: formatHsl(DEFAULT_SECONDARY_HSL),
    };

    const trimmed = value.trim();
    if (!trimmed) return defaultGrad;

    if (trimmed.startsWith('linear-gradient(') && trimmed.endsWith(')')) {
        const inner = trimmed.slice('linear-gradient('.length, -1);
        const parts = splitTopLevelArgs(inner);
        if (parts.length >= 3) {
            const deg = /^\d+deg$/i.test(parts[0]) ? parts[0] : '90deg';
            return {
                deg,
                c1: normalizeHsl(parts[1], defaultGrad.c1),
                c2: normalizeHsl(parts[2], defaultGrad.c2),
            };
        }
    }

    const single = parseHsl(trimmed);
    if (single) {
        const formatted = formatHsl(single);
        return { deg: '90deg', c1: formatted, c2: formatted };
    }

    return defaultGrad;
};

export const formatGradientHsl = ({ deg, c1, c2 }: GradientValue): string => {
    const formattedDeg = deg.endsWith('deg') ? deg : `${deg}deg`;
    return `linear-gradient(${formattedDeg}, ${normalizeHsl(c1)}, ${normalizeHsl(c2)})`;
};

export default function randomRGB(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}