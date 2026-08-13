import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import CommentsSection from "../comments/CommentsSection.jsx";
import PostFooter from "../post/PostFooter.jsx";
import PostHeader from "../post/PostHeader.jsx";
import RichText from "../common/RichText.jsx";
import { usePostMedia } from "../post/hooks/usePostMedia.js";
import VideoPlayer from "../ui/VideoPlayer.jsx";
import { usePostActions } from "../post/hooks/usePostActions.js";
import './PhotoModal.css';

export default function PhotoModal({ isOpen, mediaId, post, onClose, onUpdate, onNext, onPrev, listCurrent, listTotal }) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    const {
        postData: modalPost,
        toggleLike,
        updateLocalPost
    } = usePostActions(post, false, null, null);

    const { local, external } = usePostMedia(
        modalPost?.content || '',
        modalPost?.attachments || [],
        modalPost?.entities || null
    );

    const mediaFiles = React.useMemo(() => {
        return [
            ...local.images,
            ...local.videos,
            ...external.youtube.filter(yt => !yt.isRemoved)
        ];
    }, [local.images, local.videos, external.youtube]);

    useEffect(() => {
        if (!mediaId || mediaFiles.length === 0) return;
        const index = mediaFiles.findIndex(m => m.id === mediaId || m.videoId === mediaId);
        setCurrentIndex(index !== -1 ? index : 0);
    }, [mediaId, mediaFiles]);

    useEffect(() => {
        if (isOpen) document.body.classList.add('modal-open');
        else document.body.classList.remove('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    useEffect(() => {
        updateLocalPost(post);
        setCurrentIndex(0);
    }, [post]);

    const handleNext = useCallback((e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % mediaFiles.length);
    }, [mediaFiles.length]);

    const handlePrev = useCallback((e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
    }, [mediaFiles.length]);

    const hasExternalNav = !!(onNext && onPrev);
    const showNav = mediaFiles.length > 1 || hasExternalNav;

    const clickPrev = (e) => {
        if (e) e.stopPropagation();
        if (mediaFiles.length > 1) handlePrev(e);
        else if (onPrev) onPrev(e);
    };

    const clickNext = (e) => {
        if (e) e.stopPropagation();
        if (mediaFiles.length > 1) handleNext(e);
        else if (onNext) onNext(e);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && showNav) clickNext();
            if (e.key === 'ArrowLeft' && showNav) clickPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, clickNext, clickPrev, showNav]);

    const handleModalLike = async () => {
        await toggleLike();
        if (onUpdate) {
            onUpdate({
                is_liked: !modalPost.is_liked,
                likes_count: modalPost.is_liked ? Math.max(0, modalPost.likes_count - 1) : modalPost.likes_count + 1
            });
        }
    };

    const handleCommentCountChange = (amount) => {
        updateLocalPost({ comments_count: modalPost.comments_count + amount });
        if (onUpdate) onUpdate({ comments_count: modalPost.comments_count + amount });
    };

    if (!isOpen || !modalPost) return null;

    const currentMedia = mediaFiles[currentIndex];

    const displayCurrent = hasExternalNav ? listCurrent : currentIndex + 1;
    const displayTotal = hasExternalNav ? listTotal : mediaFiles.length;

    return (
        <div className="tetrone-modal-overlay" onClick={onClose}>
            <div className="tetrone-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="tetrone-modal-header">
                    <h3>{t('common.photo')} {displayCurrent} {t('common.from')} {displayTotal}</h3>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body tetrone-photo-modal-body">

                    <div className="tetrone-classic-photo-container">
                        {showNav && (
                            <>
                                <div className="tetrone-photo-nav-zone left" onClick={clickPrev}>
                                    <div className="tetrone-photo-nav-arrow">‹</div>
                                </div>
                                <div className="tetrone-photo-nav-zone right" onClick={clickNext}>
                                    <div className="tetrone-photo-nav-arrow">›</div>
                                </div>
                            </>
                        )}

                        {currentMedia?.type === 'image' && (
                            <img src={currentMedia.url} className="tetrone-classic-photo" alt="" />
                        )}

                        {currentMedia?.type === 'video' && (
                            <VideoPlayer src={currentMedia.url} controls className="tetrone-classic-photo" />
                        )}

                        {currentMedia?.videoId && (
                            <div className="tetrone-classic-photo">
                                <VideoPlayer src={currentMedia.videoId} provider="youtube" />
                            </div>
                        )}
                    </div>

                    {/* Інформація про пост і коментарі знизу (як у класичному ВК) */}
                    <div className="tetrone-photo-modal-info">
                        <PostHeader post={modalPost} isOwner={false} />

                        {modalPost.content && (
                            <div className="tetrone-post-content tetrone-mt-15">
                                <RichText text={modalPost.content} />
                            </div>
                        )}

                        <PostFooter
                            postId={modalPost.id}
                            isLiked={modalPost.is_liked}
                            likesCount={modalPost.likes_count}
                            commentsCount={modalPost.comments_count}
                            onLike={handleModalLike}
                        />

                        <div className="tetrone-classic-divider"></div>

                        <CommentsSection
                            postId={modalPost.id}
                            onCountChange={handleCommentCountChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}