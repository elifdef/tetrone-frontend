import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import RichText from '../common/RichText.jsx';
import PostItem from '../post/PostItem.jsx';
import { parseRichText } from './utils/messageParser.js';

export default function MessageShareableCard({ shareable, currentUsername }) {
    const { t } = useTranslation();

    if (!shareable) return null;

if (shareable.is_deleted) {
        const deletedKey = shareable.type === 'comment'
            ? 'chat.share.deleted_comment'
            : shareable.type === 'user'
                ? 'chat.deleted_user'
                : 'post.original_deleted';

        return (
            <div className="mt-[6px] p-[10px] bg-bg-page border border-dashed border-border max-w-[420px] text-[11px] text-text-muted italic">
                {t(deletedKey)}
            </div>
        );
    }

    if (shareable.type === 'post' && shareable.post) {
        return (
            <div className="mt-[6px] p-[8px] bg-bg-page border border-border max-w-[540px]">
                <div className="flex items-center justify-between text-[10px] font-bold text-theme-link uppercase tracking-wider mb-[4px]">
                    <span>{t('chat.badges.forwarded_post')}</span>
                    <Link
                        to={`/post/${shareable.post.id}`}
                        className="text-[10px] font-normal text-theme-link hover:underline normal-case"
                    >
                        {t('chat.badges.open_post')}
                    </Link>
                </div>
                <PostItem
                    post={shareable.post}
                    isInner={true}
                    readonly={true}
                    currentUsername={currentUsername}
                />
            </div>
        );
    }

    if (shareable.type === 'comment' && shareable.comment) {
        return (
            <div className="mt-[6px] p-[8px] bg-bg-page border-l-[3px] border border-border border-l-theme-link max-w-[480px]">
                <div className="flex items-center justify-between gap-[8px] mb-[6px]">
                    <span className="text-[10px] font-bold text-theme-link uppercase tracking-wider">
                        {t('chat.badges.forwarded_comment')}
                    </span>
                    <Link
                        to={`/post/${shareable.comment.post_id}?comment=${shareable.comment.id}`}
                        className="text-[10px] text-theme-link hover:underline"
                    >
                        {t('chat.badges.go_to_comment')}
                    </Link>
                </div>

                {shareable.comment.user && (
                    <div className="flex items-center gap-[6px] mb-[4px]">
                        <Link to={`/${shareable.comment.user.username}`}>
                            <Avatar
                                user={shareable.comment.user}
                                className="w-[22px] h-[22px] object-cover border border-border block"
                            />
                        </Link>
                        <Link
                            to={`/${shareable.comment.user.username}`}
                            className="text-[11px] font-bold text-theme-link hover:underline"
                            style={
                                shareable.comment.user.personalization?.username_color
                                    ? { color: shareable.comment.user.personalization.username_color }
                                    : undefined
                            }
                        >
                            {shareable.comment.user.first_name} {shareable.comment.user.last_name}
                        </Link>
                    </div>
                )}

                <div className="text-[11px] text-text-main leading-[1.35]">
                    <RichText
                        text={parseRichText(shareable.comment.content)}
                        className="comment-text"
                    />
                </div>
            </div>
        );
    }

    if (shareable.type === 'user' && shareable.user) {
        const profileUser = shareable.user;
        const bannerImage = profileUser.personalization?.banner_image;
        const bannerColor = profileUser.personalization?.banner_color;
        const usernameColor = profileUser.personalization?.username_color;

        return (
            <div className="mt-[6px] border border-border bg-bg-page max-w-[340px] overflow-hidden">
                <div className="px-[8px] py-[4px] bg-bg-box border-b border-border flex items-center justify-between text-[10px] font-bold text-theme-link uppercase tracking-wider">
                    <span>{t('chat.badges.shared_profile')}</span>
                    <Link
                        to={`/${profileUser.username}`}
                        className="text-[10px] font-normal text-theme-link hover:underline normal-case"
                    >
                        {t('chat.badges.open_profile')}
                    </Link>
                </div>

                <div
                    className="h-[48px] w-full relative bg-cover bg-center"
                    style={{
                        background: bannerImage
                            ? `url(${bannerImage}) center/cover no-repeat`
                            : (bannerColor || 'var(--theme-header-bg)')
                    }}
                />

                <div className="px-[10px] pb-[10px] pt-[0px] relative flex items-end gap-[10px]">
                    <div className="-mt-[20px] shrink-0 relative z-10">
                        <Link to={`/${profileUser.username}`}>
                            <Avatar
                                user={profileUser}
                                className="w-[40px] h-[40px] object-cover border-2 border-bg-box block bg-bg-box"
                            />
                        </Link>
                    </div>

                    <div className="min-w-0 flex-1 pt-[4px]">
                        <Link
                            to={`/${profileUser.username}`}
                            className="text-[11px] font-bold hover:underline block truncate"
                            style={usernameColor ? { color: usernameColor } : { color: 'var(--theme-link)' }}
                        >
                            {`${profileUser.first_name || ''} ${profileUser.last_name || ''}`.trim() || profileUser.username}
                        </Link>
                        <div className="text-[10px] text-text-muted truncate">
                            @{profileUser.username}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}