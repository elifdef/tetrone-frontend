import type { ImgHTMLAttributes } from 'react';
import { avatar, type AvatarUserInput } from '@/utils/avatar';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
    user?: AvatarUserInput;
}

export default function Avatar({ user, alt, ...props }: AvatarProps) {
    return (
        <img
            src={avatar(user)}
            alt={alt ?? user?.username ?? ''}
            {...props}
        />
    );
}