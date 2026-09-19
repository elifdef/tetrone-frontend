import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError } from "../../common/Notify";
import { usePostMedia } from "./usePostMedia";
import { usePostForm } from "./usePostForm";
import { isEditorEmpty } from "../../../utils/editorHelpers";

export const useCreatePost = (onSubmitSuccess, options = {}) => {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [removedPreviews, setRemovedPreviews] = useState([]);
    const [pollData, setPollData] = useState(null);
    const [showPollCreator, setShowPollCreator] = useState(false);

    const formTools = usePostForm(0);
    const { external } = usePostMedia(content, [], { removed_previews: removedPreviews });

    const toggleYouTubePreview = (videoId) => {
        setRemovedPreviews(prev => prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]);
    };

    const toggleMediaFlag = (id, flagType, isExisting = false) => {
        if (isExisting && formTools.setExistingMedia) {
            formTools.setExistingMedia(prev => prev.map(m => m.id === id ? { ...m, [flagType]: !m[flagType] } : m));
        } else {
            if (formTools.setPreviews) {
                formTools.setPreviews(prev => prev.map((m, index) => index === id ? { ...m, [flagType]: !m[flagType] } : m));
            }
            if (formTools.setFiles) {
                formTools.setFiles(prev => {
                    const newFiles = [...prev];
                    if (newFiles[id]) newFiles[id][flagType] = !newFiles[id][flagType];
                    return newFiles;
                });
            }
        }
    };

    const handleSubmit = async (publishedAt = null, canComment = true) => {
        const emptyEditor = isEditorEmpty(content);

        if (emptyEditor && formTools.files.length === 0 && !pollData) {
            notifyError(t('api.errors.ERR_POST_EMPTY'));
            return false;
        }

        const contentPayload = {};
        if (!emptyEditor) contentPayload.text = content;
        if (pollData) contentPayload.poll = pollData;
        if (removedPreviews.length > 0) contentPayload.youtube = { removed_previews: removedPreviews };

        const finalData = {
            payload: Object.keys(contentPayload).length > 0 ? contentPayload : null,
            author_username: options.author_username || undefined,
            target_username: options.target_username || undefined,
            published_at: publishedAt || null,
            can_comment: canComment,
            images: formTools.files // Файли тепер передаються прямо всередині об'єкта
        };

        // Відправляємо 1 аргумент
        const success = await onSubmitSuccess(finalData);

        if (success !== false && success !== undefined) {
            setContent('');
            setRemovedPreviews([]);
            setPollData(null);
            formTools.clearFiles();
            return true;
        }
        return false;
    };

    return {
        content, setContent, pollData, setPollData, showPollCreator, setShowPollCreator,
        removedPreviews, toggleYouTubePreview, toggleMediaFlag, external, handleSubmit,
        ...formTools
    };
};