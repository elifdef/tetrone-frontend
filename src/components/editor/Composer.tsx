import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import IdentitySwitcher, { type SpaceEntity } from './IdentitySwitcher';
import SmartEditor from './SmartEditor';
import PublishButton from './PublishButton';
import type { PickerStickerItem, PickerStickerPack } from './StickerPicker';
import type { EditorPresetName, TipTapDoc } from '@/types/tiptap';
import type { UserData } from '@/types/user';

export interface ComposerSubmitPayload {
    content: TipTapDoc;
    author_username: string;
    published_at: string | null;
    can_comment: boolean;
}

export interface ComposerProps {
    currentUser: UserData;
    ownedSpaces?: SpaceEntity[];
    onSubmit: (payload: ComposerSubmitPayload) => void;
    isSubmitting?: boolean;
    preset?: EditorPresetName | string;
    placeholder?: string;
    stickerPacks?: PickerStickerPack[];
    favoriteStickers?: PickerStickerItem[];
    isStickersLoading?: boolean;
}

export default function Composer({
    currentUser,
    ownedSpaces = [],
    onSubmit,
    isSubmitting = false,
    preset = 'post',
    placeholder = '',
    stickerPacks = [],
    favoriteStickers = [],
    isStickersLoading = false,
}: ComposerProps) {
    const { t } = useTranslation();

    const [content, setContent] = useState<TipTapDoc | null>(null);
    const [authorUsername, setAuthorUsername] = useState<string>(currentUser.username);

    const handlePublish = (canComment: boolean) => {
        if (!content || Object.keys(content).length === 0) return;

        onSubmit({
            content,
            author_username: authorUsername,
            published_at: null,
            can_comment: canComment,
        });

        setContent(null);
    };

    const handleSchedule = (dateString: string, canComment: boolean) => {
        if (!content || Object.keys(content).length === 0 || !dateString) return;

        onSubmit({
            content,
            author_username: authorUsername,
            published_at: dateString,
            can_comment: canComment,
        });

        setContent(null);
    };

    const canSwitchIdentity = preset === 'post' && ownedSpaces.length > 0;

    return (
        <div className="flex flex-col gap-[10px] w-full bg-bg-box border border-border p-[12px] rounded-[4px] shadow-sm">
            <div className="flex items-start gap-[10px]">
                {canSwitchIdentity ? (
                    <IdentitySwitcher
                        currentUser={currentUser}
                        ownedSpaces={ownedSpaces}
                        selectedUsername={authorUsername}
                        onChangeIdentity={setAuthorUsername}
                    />
                ) : (
                    <div className="shrink-0 w-[40px] h-[40px] rounded-full overflow-hidden">
                        <img
                            src={currentUser.avatar || '/default-avatar.png'}
                            alt={currentUser.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <SmartEditor
                        value={content}
                        onChange={setContent}
                        preset={preset}
                        placeholder={placeholder || t('editor.default_placeholder')}
                        stickerPacks={stickerPacks}
                        favoriteStickers={favoriteStickers}
                        isStickersLoading={isStickersLoading}
                    />
                </div>
            </div>

            <div className="flex justify-end mt-[4px]">
                <PublishButton
                    onPublish={handlePublish}
                    onSchedule={handleSchedule}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}