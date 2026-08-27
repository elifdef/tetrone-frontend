import { Link } from "react-router";
import { useState, useRef } from "react";
import CommentIcon from "../../assets/comment.svg?react";
import NoCommentIcon from "../../assets/nocomment.svg?react";
import LikeIcon from "../../assets/like.svg?react";
import NoLikeIcon from "../../assets/nolike.svg?react";
import NoRepostIcon from "../../assets/norepost.svg?react";
import RepostIcon from "../../assets/repost.svg?react";
import StickerPicker from "../editor/StickerPicker";

export default function PostFooter({
                                       postId, isLiked, likesCount, commentsCount, repostsCount = 0,
                                       onToggleReaction, reactions = [], onLike, onRepost, isReposting, className, readonly = false
                                   }) {
    const [showPicker, setShowPicker] = useState(false);
    const hideTimeout = useRef(null);

    const handleMouseEnter = () => {
        if (readonly) return;
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        setShowPicker(true);
    };

    const handleMouseLeave = () => {
        if (readonly) return;
        hideTimeout.current = setTimeout(() => setShowPicker(false), 300);
    };

    const actionBtnClass = `flex items-center gap-[6px] bg-transparent border-none py-[5px] text-[11px] font-bold no-underline transition-opacity ${readonly ? 'opacity-70 cursor-default text-theme-link' : 'text-theme-link cursor-pointer hover:underline hover:opacity-85'}`;

    return (
        <div className={`flex items-center gap-[20px] pb-[10px] px-[15px] pl-[60px] mt-0 max-md:px-[10px] ${className || ''}`}>
            <div className="flex gap-[15px] items-center pt-[15px] flex-wrap relative w-full">

                {/* Лайки + Ховер Меню */}
                <div className="relative flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <button
                        type="button"
                        className={`${actionBtnClass} ${isLiked ? '!text-theme-error' : ''}`}
                        onClick={readonly ? undefined : onLike}
                        disabled={readonly}
                    >
                        {isLiked ? <LikeIcon width={16} height={16} className="block" /> : <NoLikeIcon width={16} height={16} className="block" />}
                        {likesCount}
                    </button>

                    {showPicker && !readonly && (
                        <div className="absolute top-[50%] left-[calc(100%+10px)] -translate-y-1/2 w-[146px] h-[190px] bg-btn-secondary-bg border border-btn-secondary-border shadow-[0_4px_16px_rgba(0,0,0,0.3)] z-[9999] overflow-hidden animate-[tetronePopoverFadeInRight_0.15s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                            <div className="[&_.w-\[280px\]]:!w-full [&_.w-\[280px\]]:!h-full [&_.w-\[280px\]]:!border-none [&_.w-\[280px\]]:!shadow-none [&_.w-\[280px\]]:!bg-transparent">
                                <StickerPicker
                                    packs={[]} // Тут мають бути пропси з хука!
                                    favorites={[]}
                                    isLoading={false}
                                    searchQuery=""
                                    onSearchChange={() => {}}
                                    onSelect={(sticker) => {
                                        setShowPicker(false);
                                        onToggleReaction(sticker);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Коментарі */}
                {readonly ? (
                    <div className={actionBtnClass}>
                        {commentsCount > 0 ? <CommentIcon width={16} height={16} className="block" /> : <NoCommentIcon width={16} height={16} className="block" />}
                        {commentsCount}
                    </div>
                ) : (
                    <Link to={`/post/${postId}`} className={actionBtnClass}>
                        {commentsCount > 0 ? <CommentIcon width={16} height={16} className="block" /> : <NoCommentIcon width={16} height={16} className="block" />}
                        {commentsCount}
                    </Link>
                )}

                {/* Репости */}
                {(onRepost || readonly) && (
                    <button
                        type="button"
                        className={actionBtnClass}
                        onClick={readonly ? undefined : onRepost}
                        disabled={isReposting || readonly}
                    >
                        {repostsCount > 0 ? <RepostIcon width={16} height={16} className="block" /> : <NoRepostIcon width={16} height={16} className="block" />}
                        {repostsCount}
                        {isReposting && '...'}
                    </button>
                )}

                {/* Реакції-бейджики (Тепер зліва, одразу біля кнопок!) */}
                {reactions && reactions.length > 0 && (
                    <div id={`post-reactions-${postId}`} className="flex flex-wrap items-center gap-[4px] m-0 p-0 before:content-[''] before:block before:w-[1px] before:h-[14px] before:bg-border before:mx-[4px]">
                        {reactions.map((r) => (
                            <button
                                key={r.id}
                                data-sticker-id={r.id}
                                className={`inline-flex items-center gap-[4px] px-[8px] bg-btn-secondary-bg text-btn-secondary-text border border-btn-secondary-border h-[23px] transition-colors ${r.me ? '!bg-btn-primary-bg !border-btn-primary-border !text-btn-primary-text' : ''} ${readonly ? 'cursor-default' : 'cursor-pointer hover:bg-btn-secondary-hover-bg'}`}
                                onClick={(e) => !readonly && onToggleReaction(r.id, e)}
                                disabled={readonly}
                            >
                                <img src={r.url} alt="reaction" className="w-[14px] h-[14px] object-contain" />
                                <span className="text-[11px] font-bold">{r.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}