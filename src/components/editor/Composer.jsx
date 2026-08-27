import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import IdentitySwitcher from './IdentitySwitcher';
import SmartEditor from './SmartEditor';
import PublishButton from './PublishButton';

export default function Composer({
                                     currentUser,
                                     ownedSpaces = [],
                                     onSubmit,
                                     isSubmitting = false,
                                     preset = 'post',
                                     placeholder = '',
                                     // Пропси для стікерів
                                     stickerPacks = [],
                                     favoriteStickers = [],
                                     isStickersLoading = false,
                                     onAddPoll = null
                                 }) {
    const { t } = useTranslation();

    // Стан контенту (TipTap JSON)
    const [content, setContent] = useState(null);

    // Стан автора: за замовчуванням пишемо від імені поточного юзера
    const [authorUsername, setAuthorUsername] = useState(currentUser.username);

    // Обробник миттєвої публікації
    const handlePublish = () => {
        if (!content || Object.keys(content).length === 0) return;

        onSubmit({
            content,
            author_username: authorUsername,
            published_at: null
        });

        // Очищаємо поле після відправки
        setContent(null);
    };

    // Обробник відкладеної публікації
    const handleSchedule = (dateString) => {
        if (!content || Object.keys(content).length === 0 || !dateString) return;

        onSubmit({
            content,
            author_username: authorUsername,
            published_at: dateString
        });

        setContent(null);
    };

    // Визначаємо, чи дозволено перемикати автора (наприклад, у коментарях чи біографії це не потрібно)
    const canSwitchIdentity = preset === 'post' && ownedSpaces.length > 0;

    return (
        <div className="flex flex-col gap-[10px] w-full bg-bg-box border border-border p-[12px] rounded-[4px] shadow-sm">
            <div className="flex items-start gap-[10px]">

                {/* Аватар / Перемикач особистості (Identity Switcher) */}
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

                {/* Редактор */}
                <div className="flex-1 min-w-0">
                    <SmartEditor
                        value={content}
                        onChange={setContent}
                        preset={preset}
                        placeholder={placeholder || t('editor.default_placeholder')}
                        onAddPoll={onAddPoll}
                        stickerPacks={stickerPacks}
                        favoriteStickers={favoriteStickers}
                        isStickersLoading={isStickersLoading}
                    />
                </div>
            </div>

            {/* Нижня панель з кнопками публікації */}
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