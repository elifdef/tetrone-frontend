import type { UserData } from '@/types/user';

export type AvatarUserInput =
    | Partial<Pick<UserData, 'avatar' | 'username' | 'is_deleted' | 'is_banned'>>
    | null
    | undefined;

export const avatar = (user: AvatarUserInput): string => {
    if (!user) return './default.jpg';
    if (user.is_deleted) return './deleted.jpg';
    if (user.is_banned) return './blocked.jpg';
    if (user.avatar) return user.avatar;
    return '/default.jpg';
};