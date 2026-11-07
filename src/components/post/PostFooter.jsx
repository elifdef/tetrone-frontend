import { Link } from "react-router";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import StickerPicker from "../editor/StickerPicker";
import { LikeIcon, CommentIcon, RepostIcon } from "../ui/Icons";

export default function PostFooter({
    postId,
    isLiked,
    likesCount,
    commentsCount,
    repostsCount = 0,
    onToggleReaction,
    reactions = [],
    onLike,
    onRepost,
    onShareToChat,
    isReposting,
    className,
    readonly = false
}) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const [showRepostMenu, setShowRepostMenu] = useState(false);
    const hideTimeout = useRef(null);
    const repostMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (repostMenuRef.current && !repostMenuRef.current.contains(e.target)) {
                setShowRepostMenu(false);
            }
        };
        if (showRepostMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showRepostMenu]);

    const handleMouseEnter = () => {
        if (readonly) return;
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        setShowPicker(true);
    };

    const handleMouseLeave = () => {
        if (readonly) return;
        hideTimeout.current = setTimeout(() => setShowPicker(false), 300);
    };

    const actionBtnClass = `flex items-center gap-[6px] bg-transparent border-none p-0 text-[11px] font-bold no-underline transition-opacity outline-none ${readonly ? 'opacity-70 cursor-default text-theme-link' : 'text-theme-link cursor-pointer hover:underline hover:opacity-85'}`;
    const dropItemClass = "bg-transparent border-none py-[6px] px-[12px] flex items-center gap-[6px] text-left cursor-pointer transition-colors whitespace-nowrap text-[11px] w-full outline-none text-text-main hover:bg-bg-page hover:text-theme-link";

    return (
        <div className={`flex flex-col pb-[10px] px-[15px] pl-[60px] mt-0 max-md:px-[10px] ${className || ''}`}>
            {reactions && reactions.length > 0 && (
                <div id={`post-reactions-${postId}`} className="flex flex-wrap items-center gap-[4px] pt-[10px] m-0 p-0">
                    {reactions.map((r) => (
                        <button
                            key={r.id}
                            data-sticker-id={r.id}
                            className={`inline-flex items-center gap-[4px] px-[8px] h-[23px] rounded-[4px] border text-[11px] font-bold transition-colors outline-none select-none ${r.me
                                    ? 'bg-[var(--theme-btn-primary-bg)] border-[var(--theme-btn-primary-border)] text-[var(--theme-btn-primary-text)] hover:bg-[var(--theme-btn-primary-hover-bg)]'
                                    : 'bg-[var(--theme-btn-secondary-bg)] border-[var(--theme-btn-secondary-border)] text-[var(--theme-btn-secondary-text)] hover:bg-[var(--theme-btn-secondary-hover-bg)]'
                                } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
                            onClick={(e) => !readonly && onToggleReaction(r.id, e)}
                            disabled={readonly}
                        >
                            <img src={r.url} alt="" className="w-[14px] h-[14px] object-contain" />
                            <span>{r.count}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex gap-[15px] items-center pt-[10px] flex-wrap relative w-full">

                <div className="relative flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <button
                        type="button"
                        className={`${actionBtnClass} ${isLiked ? '!text-theme-error' : ''}`}
                        onClick={readonly ? undefined : onLike}
                        disabled={readonly}
                    >
                        <LikeIcon width={16} height={16} className={`block ${isLiked ? 'fill-current' : ''}`} />
                        {likesCount}
                    </button>

                    {showPicker && !readonly && (
                        <div className="absolute top-[50%] left-[calc(100%+10px)] -translate-y-1/2 z-[9999]">
                            <StickerPicker
                                compact={true}
                                onSelect={(sticker) => {
                                    setShowPicker(false);
                                    onToggleReaction(sticker);
                                }}
                            />
                        </div>
                    )}
                </div>

                {readonly ? (
                    <button type="button" className={actionBtnClass} disabled>
                        <CommentIcon width={16} height={16} className="block" />
                        {commentsCount}
                    </button>
                ) : (
                    <Link to={`/post/${postId}`} className={actionBtnClass}>
                        <CommentIcon width={16} height={16} className="block" />
                        {commentsCount}
                    </Link>
                )}

                {(onRepost || onShareToChat || readonly) && (
                    <div className="relative flex items-center" ref={repostMenuRef}>
                        <button
                            type="button"
                            className={actionBtnClass}
                            onClick={() => {
                                if (readonly) return;
                                if (onShareToChat) {
                                    setShowRepostMenu((prev) => !prev);
                                } else if (onRepost) {
                                    onRepost();
                                }
                            }}
                            disabled={isReposting || readonly}
                        >
                            <RepostIcon width={16} height={16} className="block" />
                            {repostsCount}
                        </button>

                        {showRepostMenu && !readonly && (
                            <div className="absolute bottom-full left-0 mb-[6px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex flex-col min-w-[160px] py-[4px] z-[100]">
                                {onRepost && (
                                    <button
                                        type="button"
                                        className={dropItemClass}
                                        onClick={() => {
                                            setShowRepostMenu(false);
                                            onRepost();
                                        }}
                                    >
                                        {t('post.repost_to_wall')}
                                    </button>
                                )}
                                {onShareToChat && (
                                    <button
                                        type="button"
                                        className={dropItemClass}
                                        onClick={() => {
                                            setShowRepostMenu(false);
                                            onShareToChat();
                                        }}
                                    >
                                        {t('chat.share.to_message')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}