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
                                           setShowScheduled = null
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
        const success = await handleSubmit(null, canComment);
        if (success && showScheduled && setShowScheduled) {
            setShowScheduled(false);
        }
    };

    const handleScheduleClick = async (date, canComment) => {
        const success = await handleSubmit(date, canComment);
        if (success && setShowScheduled) {
            setShowScheduled(true);
        }
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
                {isSpaceAdmin && currentUser ? (
                    <IdentitySwitcher
                        currentUser={currentUser}
                        ownedSpaces={ownedSpaces}
                        selectedUsername={authorUsername}
                        onChangeIdentity={setAuthorUsername}
                    />
                ) : currentUser ? (
                    <div className="shrink-0 w-[38px] h-[38px] rounded-[4px] border border-border overflow-hidden">
                        <img src={currentUser.avatar || '/default-avatar.png'} alt={currentUser.username} className="w-full h-full object-cover" />
                    </div>
                ) : null}

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

            <MediaPreviews previews={previews} onRemove={removeFile} onToggleFlag={toggleMediaFlag}/>
            <YouTubePreviews youtubeLinks={external.youtube} removedPreviews={removedPreviews} onToggle={toggleYouTubePreview} />

            <div className="flex justify-between items-center mt-[4px] pt-[8px] border-t border-border">
                <div className="flex items-center gap-[15px]">
                    <AttachBar onFileSelect={handleFileSelect} />
                </div>
                
                <div className="flex items-center gap-[10px]">
                    {onToggleScheduled && (
                        <button
                            type="button"
                            onClick={onToggleScheduled}
                            className={`bg-transparent border-none cursor-pointer p-[4px] flex items-center justify-center outline-none transition-colors rounded-[2px] ${showScheduled ? 'text-theme-link bg-[rgba(0,102,204,0.1)]' : 'text-text-muted hover:text-theme-link hover:bg-bg-page'}`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </button>
                    )}
                    
                    <PublishButton
                        onPublish={handlePublishClick}
                        onSchedule={handleScheduleClick}
                        isSubmitting={isSubmitting}
                    />
                </div>
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