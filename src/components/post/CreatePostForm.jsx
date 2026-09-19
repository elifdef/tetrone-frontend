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
    currentUser,
    onToggleScheduled = null,
    showScheduled = false,
    placeholder
}) {
    const { t } = useTranslation();
    const [authorUsername, setAuthorUsername] = useState(currentUser?.username || '');

    const {
        content, setContent, pollData, setPollData, showPollCreator, setShowPollCreator,
        removedPreviews, toggleYouTubePreview, external, handleSubmit, files, previews,
        isDragging, handleDragOver, handleDragLeave, handleDrop, handleFileSelect,
        handlePaste, removeFile, isSubmitting, toggleMediaFlag
    } = useCreatePost(onSubmitSuccess, {
        author_username: authorUsername,
        target_username: targetUsername || null
    });

    const handlePublishClick = async (canComment) => {
        try {
            await handleSubmit(null, canComment);
            if (showScheduled && onToggleScheduled) {
                onToggleScheduled();
            }
        } catch (error) {
            console.error("Publish error:", error);
        }
    };

    const handleScheduleClick = async (date, canComment) => {
        try {
            await handleSubmit(date, canComment);
            if (onToggleScheduled && !showScheduled) {
                onToggleScheduled();
            }
        } catch (error) {
            console.error("Schedule error:", error);
        }
    };

    const ownedSpaces = isSpaceAdmin && space ? [space] : [];

    const editorPlaceholder = isDragging
        ? t('wall.drop_files_here')
        : (placeholder || t('action.write_post'));

    return (
        <div
            className={`flex flex-col gap-[10px] w-full transition-colors pb-[15px] ${isDragging ? 'bg-[rgba(91,155,213,0.05)]' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
        >
            <div className="flex items-start gap-[12px]">

                <div className="shrink-0 mt-[1px]">
                    {isSpaceAdmin && currentUser ? (
                        <IdentitySwitcher
                            currentUser={currentUser}
                            ownedSpaces={ownedSpaces}
                            selectedUsername={authorUsername}
                            onChangeIdentity={setAuthorUsername}
                        />
                    ) : currentUser ? (
                        <div className="w-[40px] h-[40px] border border-border overflow-hidden">
                            <img src={currentUser.avatar || '/default-avatar.png'} alt={currentUser.username} className="w-full h-full object-cover" />
                        </div>
                    ) : null}
                </div>

                <div className="flex-1 flex items-end bg-bg-box border border-border focus-within:border-theme-link transition-colors min-h-[42px] min-w-0">

                    <div className="flex flex-col justify-end pb-[7px] pl-[8px] shrink-0">
                        <AttachBar
                            onFileSelect={handleFileSelect}
                            onAddPoll={() => setShowPollCreator(true)}
                            hasPoll={!!pollData}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <SmartEditor
                            preset="post"
                            placeholder={editorPlaceholder}
                            value={content}
                            onChange={setContent}
                        />
                    </div>

                    <div className="pb-[6px] pr-[6px] shrink-0 flex items-center">
                        <PublishButton
                            onPublish={handlePublishClick}
                            onSchedule={handleScheduleClick}
                            isSubmitting={isSubmitting}
                            onToggleScheduled={onToggleScheduled}
                            showScheduled={showScheduled}
                        />
                    </div>

                </div>
            </div>

            {pollData && (
                <div
                    className="bg-bg-page border border-border p-[8px_12px] flex items-center justify-between cursor-pointer hover:bg-input-bg transition-colors text-[12px] text-text-main ml-[52px]"
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

            <div className="ml-[52px]">
                <MediaPreviews previews={previews} onRemove={removeFile} onToggleFlag={toggleMediaFlag} />
                <YouTubePreviews youtubeLinks={external.youtube} removedPreviews={removedPreviews} onToggle={toggleYouTubePreview} />
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