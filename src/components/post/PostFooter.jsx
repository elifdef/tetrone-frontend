import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import CommentIcon from "../../assets/comment.svg?react";
import NoCommentIcon from "../../assets/nocomment.svg?react";
import LikeIcon from "../../assets/like.svg?react";
import NoLikeIcon from "../../assets/nolike.svg?react";
import NoRepostIcon from "../../assets/norepost.svg?react";
import RepostIcon from "../../assets/repost.svg?react";
import Button from "../ui/Button";
import StickerPicker from "../editor/StickerPicker";

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
    isReposting,
    className,
    readonly = false
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
        hideTimeout.current = setTimeout(() => {
            setShowPicker(false);
        }, 300);
    };

    const Comment = () => {
        const IconComponent = commentsCount > 0 ? CommentIcon : NoCommentIcon;
        if (readonly) {
            return (
                <div className="tetrone-comment-btn readonly">
                    <IconComponent width={16} height={16} />
                    {commentsCount}
                </div>
            );
        }
        return (
            <Link to={`/post/${postId}`} className="tetrone-comment-btn">
                <IconComponent width={16} height={16} />
                {commentsCount}
            </Link>
        );
    }

    const Repost = () => {
        const IconComponent = repostsCount > 0 ? RepostIcon : NoRepostIcon;
        if (readonly)
            return (
                <div className="tetrone-repost-btn readonly">
                    <IconComponent width={16} height={16} />
                    {repostsCount}
                </div>
            );
        return (
            <Button className="tetrone-repost-btn" onClick={onRepost} disabled={isReposting}>
                <IconComponent width={16} height={16} />
                {repostsCount}
                {isReposting && '...'}
            </Button>
        );
    }

    return (
        <div className={`tetrone-post-footer ${className || ''}`}>
            <div className="tetrone-post-footer-actions">
                <div
                    className="tetrone-like-hover-wrapper"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {readonly ? (
                        <div className={`tetrone-like-btn readonly ${isLiked ? 'liked' : ''}`}>
                            {isLiked ? <LikeIcon width={16} height={16} /> : <NoLikeIcon width={16} height={16} />}
                            {likesCount}
                        </div>
                    ) : (
                        <Button className={`tetrone-like-btn ${isLiked ? 'liked' : ''}`} onClick={onLike}>
                            {isLiked ? <LikeIcon width={16} height={16} /> : <NoLikeIcon width={16} height={16} />}
                            {likesCount}
                        </Button>
                    )}

                    {showPicker && (
                        <div className="tetrone-reaction-popover-mini">
                            <StickerPicker
                                onSelect={(sticker) => {
                                    setShowPicker(false);
                                    onToggleReaction(sticker);
                                }}
                            />
                        </div>
                    )}
                </div>

                <Comment />
                {(onRepost || readonly) && <Repost />}

                {reactions && reactions.length > 0 && (
                    <div
                        id={`post-reactions-${postId}`}
                        className="tetrone-post-reactions-badges"
                    >
                        {reactions.map((r) => (
                            <button
                                key={r.id}
                                data-sticker-id={r.id}
                                className={`tetrone-reaction-badge ${r.me ? 'active' : ''}`}
                                onClick={(e) => !readonly && onToggleReaction(r.id, e)}
                                disabled={readonly}
                            >
                                <img src={r.url} alt="reaction" />
                                <span className="reaction-count">{r.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}