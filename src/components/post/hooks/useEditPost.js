import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError } from "../../common/Notify";
import { usePostMedia } from "./usePostMedia";
import { usePostForm } from "./usePostForm";
import { isEditorEmpty } from "../../../utils/editorHelpers";

export const useEditPost = (post, saveEdit) => {
    const { t } = useTranslation();

    const safePost = post || {};
    const [editContent, setEditContent] = useState(safePost.content || '');
    const [existingMedia, setExistingMedia] = useState(safePost.attachments || []);
    const [deletedMediaIds, setDeletedMediaIds] = useState([]);
    const [removedPreviews, setRemovedPreviews] = useState([]);

    useEffect(() => {
        if (post) {
            setEditContent(post.content || '');
            setExistingMedia(post.attachments || []);
            setRemovedPreviews(post.youtube_settings?.removed_previews || []);
            setDeletedMediaIds([]);
        }
    }, [post]);

    const { external } = usePostMedia(editContent, [], { removed_previews: removedPreviews });
    const formTools = usePostForm(existingMedia.length);

    const removeExistingMedia = (mediaId) => {
        setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
        setDeletedMediaIds(prev => [...prev, mediaId]);
    };

    const toggleYouTubePreview = (videoId) => {
        setRemovedPreviews(prev => prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]);
    };

    const handleSave = () => {
        const emptyEditor = isEditorEmpty(editContent);
        const hasPoll = !!safePost.poll;

        if (emptyEditor && existingMedia.length === 0 && formTools.files.length === 0 && !hasPoll) {
            notifyError(t('api.error.ERR_POST_EMPTY'));
            return;
        }

        const payload = {};
        payload.text = emptyEditor ? null : editContent;
        if (removedPreviews.length > 0) payload.youtube = { removed_previews: removedPreviews };

        saveEdit(safePost.id, {
            payload,
            images: formTools.files,
            deletedMedia: deletedMediaIds
        });
    };

    return {
        editContent, setEditContent, existingMedia, removeExistingMedia,
        removedPreviews, toggleYouTubePreview, external, handleSave, ...formTools
    };
};