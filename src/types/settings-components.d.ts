declare module '@/components/profile/UserProfileCard' {
    import type { ComponentType } from 'react';
    import type { UserData } from '@/types/user';

    export interface UserProfileCardProps {
        currentUser: UserData | null;
        isPreview?: boolean;
        forceTheme?: string;
    }

    const UserProfileCard: ComponentType<UserProfileCardProps>;
    export default UserProfileCard;
}

declare module '@/components/editor/StickerPicker' {
    import type { ComponentType } from 'react';

    export interface StickerItem {
        id: number;
        url?: string;
        src?: string;
        file_path?: string;
    }

    export interface StickerPickerProps {
        compact?: boolean;
        onSelect: (sticker: StickerItem) => void;
    }

    const StickerPicker: ComponentType<StickerPickerProps>;
    export default StickerPicker;
}

declare module '@/components/ui/PasswordStrengthBar' {
    import type { ComponentType } from 'react';

    export interface PasswordStrengthBarProps {
        password: string;
        onScoreChange?: (score: number) => void;
    }

    const PasswordStrengthBar: ComponentType<PasswordStrengthBarProps>;
    export default PasswordStrengthBar;
}

declare module '@/components/ui/Radio' {
    import type { ComponentType, InputHTMLAttributes } from 'react';
    const Radio: ComponentType<InputHTMLAttributes<HTMLInputElement>>;
    export default Radio;
}

declare module '@/components/ui/Button' {
    import type { ComponentType, ButtonHTMLAttributes } from 'react';

    export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
        variant?:
            | 'primary'
            | 'secondary'
            | 'danger'
            | 'warning'
            | 'approve'
            | 'success'
            | 'reject'
            | 'save';
    }

    const Button: ComponentType<ButtonProps>;
    export default Button;
}