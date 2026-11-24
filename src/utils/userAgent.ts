import type { ComponentType, SVGProps } from 'react';
import WindowsIcon from '../assets/icons/windows.svg?react';
import AppleIcon from '../assets/icons/apple.svg?react';
import AndroidIcon from '../assets/icons/android.svg?react';
import LinuxIcon from '../assets/icons/tux.svg?react';
import UnknownIcon from '../assets/icons/unknown.svg?react';

export type SvgIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface UserAgentInfo {
    os: string;
    browser: string;
    OsIcon: SvgIconComponent;
    BrowserIcon: SvgIconComponent;
}

interface OsRule {
    match: RegExp;
    name: string;
    Icon: SvgIconComponent;
}

interface BrowserRule {
    match: RegExp;
    name: string;
}

const OS_RULES: OsRule[] = [
    { match: /windows/, name: 'Windows', Icon: WindowsIcon },
    { match: /mac os|macintosh/, name: 'macOS', Icon: AppleIcon },
    { match: /android/, name: 'Android', Icon: AndroidIcon },
    { match: /iphone|ipad/, name: 'iOS', Icon: AppleIcon },
    { match: /linux/, name: 'Linux', Icon: LinuxIcon },
];

const BROWSER_RULES: BrowserRule[] = [
    { match: /edg/, name: 'Edge' },
    { match: /opr|opera/, name: 'Opera' },
    { match: /firefox/, name: 'Firefox' },
    { match: /chrome/, name: 'Chrome' },
    { match: /safari/, name: 'Safari' },
];

export const parseUserAgent = (uaString: string | null | undefined): UserAgentInfo => {
    if (!uaString) {
        return {
            os: 'Unknown OS',
            browser: 'Unknown Browser',
            OsIcon: UnknownIcon,
            BrowserIcon: UnknownIcon,
        };
    }

    const ua = uaString.toLowerCase();
    const osMatch = OS_RULES.find((rule) => rule.match.test(ua));
    const browserMatch = BROWSER_RULES.find((rule) => rule.match.test(ua));

    return {
        os: osMatch?.name || 'Unknown OS',
        OsIcon: osMatch?.Icon || UnknownIcon,
        browser: browserMatch?.name || 'Unknown Browser',
        BrowserIcon: UnknownIcon,
    };
};