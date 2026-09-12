import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { DeleteIcon } from "../ui/Icons";
import RichText from '../common/RichText';
import Avatar from "../ui/Avatar";

export default function ActivityCommentItem({ comment, onDelete }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const postAuthor = comment.post?.author || comment.post?.user;
    const me = comment.user;
    const opColor = postAuthor?.personalization?.username_color;

    const renderContent = () => {
        if (!comment.content) return null;
        if (typeof comment.content === 'object') {
            return <RichText text={comment.content} className="m-0 text-[11px] leading-[1.4]" />;
        }
        return comment.content;
    };

    return (
        <div className="relative bg-bg-box border border-border p-[10px] text-[11px] font-tahoma mb-[10px]">
            {onDelete && (
                <div className="absolute top-[10px] right-[10px]">
                    <button
                        className="bg-transparent border-none p-0 cursor-pointer text-text-muted hover:text-theme-error outline-none transition-colors"
                        onClick={onDelete}
                        title={t('action.delete')}
                    >
                        <DeleteIcon width={14} height={14} />
                    </button>
                </div>
            )}

            {postAuthor && (
                <div className="flex items-center gap-[6px] mb-[10px] text-text-muted pr-[20px]">
                    <Link to={`/${postAuthor.username}`} className="shrink-0">
                        <Avatar
                            user={postAuthor}
                            className="w-[20px] h-[20px] object-cover border border-border rounded-[2px]"
                        />
                    </Link>
                    <span className="truncate">
                        {t('activity.comments.you_commented_on')}{' '}
                        <Link to={`/post/${comment.post_id}`} className="text-theme-link no-underline hover:underline font-bold">
                            {t('common.post')}
                        </Link>{' '}
                        {t('activity.comments.of_user')}{' '}
                        <Link to={`/${postAuthor.username}`} className="text-theme-link no-underline hover:underline font-bold" style={opColor ? { color: opColor } : undefined}>
                            {postAuthor.first_name} {postAuthor.last_name}
                        </Link>
                    </span>
                </div>
            )}

            <div className="flex gap-[10px] bg-bg-page border border-border p-[10px] rounded-[2px]">
                {me && (
                    <Avatar
                        user={me}
                        className="w-[32px] h-[32px] object-cover border border-border rounded-[2px] shrink-0"
                    />
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="text-text-main break-words">
                        {renderContent()}
                    </div>

                    <div className="mt-[6px]">
                        <span className="text-text-muted text-[10px]">
                            {formatDate(comment.created_at)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}