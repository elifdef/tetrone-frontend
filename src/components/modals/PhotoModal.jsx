import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import CommentsSection from "../comments/CommentsSection.jsx";
import PostFooter from "../post/PostFooter.jsx";
import PostHeader from "../post/PostHeader.jsx";
import RichText from "../common/RichText.jsx";
import { usePostMedia } from "../post/hooks/usePostMedia.js";
import VideoPlayer from "../ui/VideoPlayer.jsx";
import { usePostActions } from "../post/hooks/usePostActions.js";
import Modal from "./Modal.jsx";

export default function PhotoModal({ isOpen, mediaId, post, onClose, onUpdate, onNext, onPrev, listCurrent, listTotal }) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    const { postData: modalPost, toggleLike, updateLocalPost } = usePostActions(post, false, null, null);
    const { local, external } = usePostMedia(modalPost?.content || '', modalPost?.attachments || [], modalPost?.entities || null);

    const mediaFiles = React.useMemo(() => {
        return [...local.images, ...local.videos, ...external.youtube.filter(yt => !yt.isRemoved)];
    }, [local.images, local.videos, external.youtube]);

    useEffect(() => {
        if (!mediaId || mediaFiles.length === 0) return;
        const index = mediaFiles.findIndex(m => m.id === mediaId || m.videoId === mediaId);
        setCurrentIndex(index !== -1 ? index : 0);
    }, [mediaId, mediaFiles]);

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
            if (e.key === 'ArrowRight' && showNav) clickNext();
            if (e.key === 'ArrowLeft' && showNav) clickPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, clickNext, clickPrev, showNav]);

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('common.photo')} ${displayCurrent} ${t('common.from')} ${displayTotal}`}
            sizeClass="modal-lg"
            bodyClassName="!p-0"
        >
            <div className="flex flex-col bg-bg-box">
                {/* Зона медіа */}
                <div className="relative bg-black flex justify-center items-center min-h-[300px]">
                    {showNav && (
                        <>
                            <div className="absolute top-0 bottom-0 left-0 w-[40px] flex items-center justify-center cursor-pointer opacity-50 hover:opacity-100 transition-opacity z-[10]" onClick={clickPrev}>
                                <div className="text-white text-[40px] font-bold select-none drop-shadow-md">‹</div>
                            </div>
                            <div className="absolute top-0 bottom-0 right-0 w-[40px] flex items-center justify-center cursor-pointer opacity-50 hover:opacity-100 transition-opacity z-[10]" onClick={clickNext}>
                                <div className="text-white text-[40px] font-bold select-none drop-shadow-md">›</div>
                            </div>
                        </>
                    )}

                    <div className="max-w-full max-h-[80vh] flex items-center justify-center">
                        {currentMedia?.type === 'image' && (
                            <img src={currentMedia.url} className="max-w-full max-h-[80vh] object-contain block m-auto" alt="" />
                        )}
                        {currentMedia?.type === 'video' && (
                            <VideoPlayer src={currentMedia.url} controls className="max-w-full max-h-[80vh]" />
                        )}
                        {currentMedia?.videoId && (
                            <VideoPlayer src={currentMedia.videoId} provider="youtube" className="max-w-full max-h-[80vh]" />
                        )}
                    </div>
                </div>

                {/* Зона інформації (пост + коментарі) */}
                <div className="p-[15px] bg-bg-box border-t border-border">
                    <PostHeader post={modalPost} isOwner={false} />

                    {modalPost.content && (
                        <div className="mt-[10px] mb-[15px]">
                            <RichText text={modalPost.content} />
                        </div>
                    )}

                    <PostFooter
                        postId={modalPost.id}
                        isLiked={modalPost.is_liked}
                        likesCount={modalPost.likes_count}
                        commentsCount={modalPost.comments_count}
                        onLike={handleModalLike}
                        className="!p-0 !pl-0"
                    />

                    <div className="border-t border-border my-[10px]"></div>

                    <CommentsSection
                        postId={modalPost.id}
                        onCountChange={handleCommentCountChange}
                    />
                </div>
            </div>
        </Modal>
    );
}