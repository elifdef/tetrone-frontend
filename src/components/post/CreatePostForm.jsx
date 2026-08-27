import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useCreatePost } from "./hooks/useCreatePost";
import SmartEditor from '../editor/SmartEditor';
import IdentitySwitcher from '../editor/IdentitySwitcher';
import PublishButton from '../editor/PublishButton';
import AttachBar from './components/AttachBar';
import MediaPreviews from './components/MediaPreviews';
import YouTubePreviews from './components/YouTubePreviews';
import PollCreatorModal from '../modals/PollCreatorModal';
import { PollIcon, CloseIcon } from '../ui/Icons';

export default function CreatePostForm({
                                           onSubmitSuccess,
                                           space = null,
                                           isSpaceAdmin = false,
                                           targetUsername = null,
                                           currentUser
                                       }) {
    const { t } = useTranslation();

    // За замовчуванням пишемо від свого імені
    const [authorUsername, setAuthorUsername] = useState(currentUser?.username || '');
    const [publishedAt, setPublishedAt] = useState(null);

    const {
        content, setContent,
        pollData, setPollData,
        showPollCreator, setShowPollCreator,
        removedPreviews, toggleYouTubePreview,
        external, handleSubmit,
        files, previews, isDragging,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile,
        isSubmitting, toggleMediaFlag
    } = useCreatePost(onSubmitSuccess, {
        author_username: authorUsername,
        target_username: targetUsername || null,
        published_at: publishedAt
    });

    const handlePublish = () => {
        setPublishedAt(null);
        setTimeout(handleSubmit, 0); // Даємо React час оновити стейт перед сабмітом
    };

    const handleSchedule = (date) => {
        setPublishedAt(date);
        setTimeout(handleSubmit, 0);
    };

    const ownedSpaces = isSpaceAdmin && space ? [space] : [];

    return (
        <div
            className={`flex flex-col gap-[10px] w-full bg-bg-box border border-border p-[12px] rounded-[2px] shadow-sm transition-colors ${isDragging ? 'bg-input-bg' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
        >
            <div className="flex items-start gap-[10px]">
                {/* Аватарка / Вибір автора */}
                {isSpaceAdmin && currentUser ? (
                    <IdentitySwitcher
                        currentUser={currentUser}
                        ownedSpaces={ownedSpaces}
                        selectedUsername={authorUsername}
                        onChangeIdentity={setAuthorUsername}
                    />
                ) : currentUser ? (
                    <div className="shrink-0 w-[38px] h-[38px] rounded-[4px] border border-border overflow-hidden">
                        <img
                            src={currentUser.avatar || '/default-avatar.png'}
                            alt={currentUser.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : null}

                {/* Редактор */}
                <div className="flex-1 min-w-0">
                    <SmartEditor
                        preset="post"
                        placeholder={isDragging ? t('wall.drop_files_here') : t('action.write_post')}
                        value={content}
                        onChange={setContent}
                        onAddPoll={!pollData ? () => setShowPollCreator(true) : null}
                    />
                </div>
            </div>

            {/* Опитування */}
            {pollData && (
                <div
                    className="bg-bg-page border border-border p-[8px_12px] flex items-center justify-between cursor-pointer hover:bg-input-bg transition-colors text-[12px] text-text-main rounded-[2px]"
                    onClick={() => setShowPollCreator(true)}
                    title={t('poll.click_to_edit')}
                >
                    <span className="flex items-center gap-[6px] font-bold text-theme-link">
                        <PollIcon width={16} height={16} /> {pollData.question}
                    </span>
                    <button
                        type="button"
                        className="bg-transparent border-none text-text-muted hover:text-theme-error cursor-pointer p-[4px] flex items-center justify-center outline-none transition-colors"
                        onClick={(e) => { e.stopPropagation(); setPollData(null); }}
                        title={t('poll.remove_poll')}
                    >
                        <CloseIcon width={14} height={14} />
                    </button>
                </div>
            )}

            {/* Прев'ю медіа та YouTube */}
            <MediaPreviews previews={previews} onRemove={removeFile} onToggleFlag={toggleMediaFlag}/>
            <YouTubePreviews youtubeLinks={external.youtube} removedPreviews={removedPreviews} onToggle={toggleYouTubePreview} />

            {/* Нижня панель */}
            <div className="flex justify-between items-center mt-[4px] pt-[8px] border-t border-border">
                <AttachBar onFileSelect={handleFileSelect} />
                <PublishButton
                    onPublish={handlePublish}
                    onSchedule={handleSchedule}
                    isSubmitting={isSubmitting}
                />
            </div>

            <PollCreatorModal
                isOpen={showPollCreator}
                onClose={() => setShowPollCreator(false)}
                pollData={pollData}
                onSave={(data) => { setPollData(data); setShowPollCreator(false); }}
            />
        </div>
    );
}