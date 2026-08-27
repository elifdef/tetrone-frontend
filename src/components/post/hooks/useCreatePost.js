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

    // Усі файли та прев'юшки керуються тут
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

    const handleSubmit = async () => {
        const emptyEditor = isEditorEmpty(content);

        if (emptyEditor && formTools.files.length === 0 && !pollData) {
            notifyError(t('api.error.ERR_POST_EMPTY'));
            return;
        }

        const payload = {};
        if (!emptyEditor) payload.text = content;
        if (pollData) payload.poll = pollData;
        if (removedPreviews.length > 0) payload.youtube = { removed_previews: removedPreviews };

        // ФІКС: Чиста поліморфіка (без старих space_username)
        if (options.author_username) payload.author_username = options.author_username;
        if (options.target_username) payload.target_username = options.target_username;
        if (options.published_at) payload.published_at = options.published_at;

        const success = await onSubmitSuccess(payload, formTools.files);

        if (success) {
            setContent('');
            setRemovedPreviews([]);
            setPollData(null);
            formTools.clearFiles();
        }
    };

    return {
        content,
        setContent,
        pollData,
        setPollData,
        showPollCreator,
        setShowPollCreator,
        removedPreviews,
        toggleYouTubePreview,
        toggleMediaFlag,
        external,
        handleSubmit,
        ...formTools
    };
};