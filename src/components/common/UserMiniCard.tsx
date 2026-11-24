import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import RichText from './RichText.jsx';
import { isTipTapDoc, type TipTapDoc } from '@/types/tiptap';
import type { UserData } from '@/types/user';

export type UserMiniCardUser = Partial<UserData> & {
    username: string;
    bio?: TipTapDoc | string | null;
    is_online?: boolean;
};

export interface UserMiniCardProps {
    user: UserMiniCardUser | null | undefined;
    headerLabel?: string | null;
    className?: string;
}

const parseBioContent = (bio: unknown): TipTapDoc | null => {
    if (!bio) return null;
    if (isTipTapDoc(bio)) return bio;
    if (typeof bio === 'string') {
        try {
            const parsed: unknown = JSON.parse(bio);
            return isTipTapDoc(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
    return null;
};

const hasBioContent = (node: unknown): boolean => {
    if (!node) return false;
    if (Array.isArray(node)) return node.some(hasBioContent);
    if (typeof node === 'object') {
        const record = node as Record<string, unknown>;
        if (record.type === 'text' && typeof record.text === 'string' && record.text.trim().length > 0) {
            return true;
        }
        if (record.type === 'customSticker') {
            return true;
        }
        if (Array.isArray(record.content)) {
            return record.content.some(hasBioContent);
        }
    }
    return false;
};

export default function UserMiniCard({ user, headerLabel = null, className = '' }: UserMiniCardProps) {
    const { t } = useTranslation();

    const parsedBio = useMemo(() => parseBioContent(user?.bio), [user?.bio]);
    const showBio = useMemo(() => hasBioContent(parsedBio), [parsedBio]);

    if (!user) return null;

    const bannerImage = user.personalization?.banner_image;
    const bannerColor = user.personalization?.banner_color;
    const usernameColor = user.personalization?.username_color;
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;

    return (
        <div className={`border border-border bg-bg-page overflow-hidden ${className}`}>
            {headerLabel && (
                <div className="px-[8px] py-[4px] bg-bg-box border-b border-border flex items-center justify-between text-[10px] font-bold text-theme-link uppercase tracking-wider">
                    <span>{headerLabel}</span>
                    <Link
                        to={`/${user.username}`}
                        className="text-[10px] font-normal text-theme-link hover:underline normal-case"
                    >
                        {t('chat.badges.open_profile')}
                    </Link>
                </div>
            )}

            <div
                className="h-[48px] w-full relative bg-cover bg-center"
                style={{
                    background: bannerImage
                        ? `url(${bannerImage}) center/cover no-repeat`
                        : (bannerColor || 'var(--theme-header-bg)'),
                }}
            />

            <div className="px-[10px] pb-[10px] pt-[0px]">
                <div className="relative flex items-end gap-[10px]">
                    <div className="-mt-[20px] shrink-0 relative z-10">
                        <Link to={`/${user.username}`} className="block relative">
                            <Avatar
                                user={user}
                                className="w-[40px] h-[40px] object-cover border-2 border-bg-box block bg-bg-box"
                            />
                            {user.is_online && (
                                <span className="absolute bottom-[1px] right-[1px] w-[8px] h-[8px] rounded-full bg-theme-success border border-bg-box" />
                            )}
                        </Link>
                    </div>

                    <div className="min-w-0 flex-1 pt-[4px]">
                        <Link
                            to={`/${user.username}`}
                            className={`text-[11px] font-bold hover:underline block truncate ${usernameColor ? '' : 'text-theme-link'}`}
                            style={usernameColor ? { color: usernameColor } : undefined}
                        >
                            {fullName}
                        </Link>
                        <div className="text-[10px] text-text-muted truncate">
                            @{user.username}
                        </div>
                    </div>
                </div>

                {showBio && (
                    <div className="mt-[6px] pt-[6px] border-t border-border text-[11px] text-text-main leading-[1.35] break-words">
                        <RichText
                            text={parsedBio}
                            limit={160}
                            className="bio-text line-clamp-3 [&_p]:m-0 [&_p+p]:mt-[2px]"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}