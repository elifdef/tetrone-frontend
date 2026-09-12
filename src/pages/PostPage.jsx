import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PostItem from "../components/post/PostItem";
import EditPostModal from "../components/modals/EditPostModal";
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import CommentsSection from "../components/comments/CommentsSection";
import { useTranslation } from 'react-i18next';
import postService from "../services/post.service";
import ErrorState from "../components/ui/ErrorState";

export default function PostPage() {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    usePageTitle(t('common.post'));

    const loadPost = () => {
        setLoading(true);
        setError(null);

        postService.get(id)
        .then(res => {
            if (res.post) {
                setPost(res.post);
            }
        })
        .catch(() => {
            setError(t('error.load_failed'));
        })
        .finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        loadPost();
    }, [id, t]);

    const handleCommentCountChange = (amount) => {
        setPost(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                comments_count: prev.comments_count + amount
            };
        });
    };

    const handleSaveEdit = async (postId, editData) => {
        try {
            const res = await postService.update(postId, editData);
            if (res) {
                setPost(res.post);
            }
        } catch (err) {
            loadPost();
        }
    };

    if (loading) {
        return <div className="p-[20px] text-center text-text-muted italic text-[11px]">{t('common.loading')}</div>;
    }

    if (error || !post) {
        return (
            <div className="max-w-[800px] mx-auto my-[20px]">
                <ErrorState
                    title={error || t('post.not_found')}
                    description={t('error.load_failed')}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    // ФІКС: Змінено post.user на post.author
    const isOwner = user && post && user.username === post.author?.username;

    return (
        <div className="flex flex-col w-full max-w-[800px] mx-auto my-[15px] px-[10px] md:px-0 font-tahoma text-[11px] text-text-main gap-[10px]">

            {/* Класична кнопка Назад */}
            <button
                onClick={() => navigate(-1)}
                className="self-start flex items-center gap-[5px] bg-transparent border-none text-theme-link cursor-pointer hover:underline p-0 font-bold outline-none mb-[5px]"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                {t('action.go_back')}
            </button>

            {/* Блок самого поста */}
            <div className="bg-bg-box border border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-[15px] rounded-[2px]">
                <PostItem
                    post={post}
                    isOwner={isOwner}
                    currentUsername={user.username}
                    onEdit={() => setIsEditing(true)}
                    onDelete={() => navigate('/')}
                    isInner={false}
                    readonly={false}
                />
            </div>

            {/* Блок коментарів */}
            <div className="bg-bg-box border border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-[15px] rounded-[2px]">
                <CommentsSection
                    postId={post.id}
                    onCountChange={handleCommentCountChange}
                />
            </div>

            <EditPostModal
                isOpen={isEditing}
                post={post}
                onClose={() => setIsEditing(false)}
                onSaveSuccess={handleSaveEdit}
            />
        </div>
    );
}