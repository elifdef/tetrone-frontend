import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useModal } from "../../../context/ModalContext";
import { notifyError, notifySuccess } from "../../common/Notify";
import PostService from "../../../services/post.service";

export const usePostActions = (initialPost, readonly, onLikeToggle, onRepostSuccess) => {
    const { t } = useTranslation();
    const { openPrompt } = useModal();

    const [postData, setPostData] = useState(initialPost);
    const [isReposting, setIsReposting] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    // Синхронізація з батьківським станом
    useEffect(() => {
        setPostData(initialPost);
    }, [initialPost]);

    const updateLocalPost = (updates) => {
        if (readonly) return;
        setPostData(prev => ({ ...prev, ...updates }));
    };

    const toggleLike = async () => {
        if (readonly || isLiking) return;

        setIsLiking(true);
        const originalLiked = postData.is_liked;
        const originalCount = postData.likes_count;

        // 1. Оптимістичне оновлення (Перший рендер)
        setPostData(prev => ({
            ...prev,
            is_liked: !originalLiked,
            likes_count: originalLiked ? Math.max(0, prev.likes_count - 1) : prev.likes_count + 1
        }));

        try {
            const res = await PostService.toggleLike(postData.id);

            if (res) {
                // 2. ЗАБРАНО локальний setPostData.
                // Викликаємо тільки onLikeToggle, щоб оновити батька.
                // Батько оновить initialPost, і спрацює useEffect вище.
                if (onLikeToggle) {
                    onLikeToggle(postData.id, res.like_info.liked);
                }
            } else {
                throw new Error(res.message);
            }
        } catch (err) {
            // Відкат у разі помилки
            setPostData(prev => ({
                ...prev,
                is_liked: originalLiked,
                likes_count: originalCount
            }));
            notifyError(err.message || t('api.error.ERR_NETWORK'));
        } finally {
            setIsLiking(false);
        }
    };

    const createRepost = async () => {
        if (readonly) return;

        const content = await openPrompt(t('common.repost'), t('action.comment'), '', true);
        if (content === null) return;

        setIsReposting(true);

        const targetId = postData.id;

        let payloadText = null;
        if (content && content.trim() !== '') {
            payloadText = {
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: content.trim() }]
                    }
                ]
            };
        }

        try {
            const res = await PostService.create({
                payload: payloadText ? { text: payloadText } : null,
                original_post_id: targetId
            });

            if (res) {
                notifySuccess(t('post.repost_success'));

                // Тут також можна покластися на onRepostSuccess замість локального стейту,
                // якщо батько повністю контролює reposts_count
                setPostData(prev => ({
                    ...prev,
                    reposts_count: (prev.reposts_count || 0) + 1
                }));

                if (onRepostSuccess && res.post) onRepostSuccess(res.post);
            } else {
                notifyError(t('error.save_failed'));
            }
        } catch (err) {
        } finally {
            setIsReposting(false);
        }
    };

    return {
        postData,
        isReposting,
        isReportModalOpen,
        setIsReportModalOpen,
        updateLocalPost,
        toggleLike,
        createRepost
    };
};