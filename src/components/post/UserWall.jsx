import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { useUserWall } from './hooks/useUserWall';
import WallHeader from './WallHeader';
import CreatePostForm from './CreatePostForm';
import WallPostList from './WallPostList';
import InfiniteScrollList from '../common/InfiniteScrollList';

export default function UserWall({ profileUser, isOwnProfile }) {
    const { user: authUser } = useContext(AuthContext);
    const { t } = useTranslation();

    if (profileUser.is_private && !isOwnProfile) {
        return null;
    }

    const wallData = useUserWall(profileUser);
    const canWriteOnWall = Boolean(profileUser.permissions?.can_post_on_wall);

    return (
        <div className="bg-bg-box border border-border p-[15px] mt-[15px] max-md:mx-[-10px] max-md:border-x-0">
            <WallHeader postsCount={wallData.countPosts} />

            {canWriteOnWall ? (
                <CreatePostForm onSubmitSuccess={wallData.createPost} />
            ) : (
                authUser && !isOwnProfile && (
                    <div className="text-center text-text-muted p-[30px_20px] text-[13px] w-full box-border bg-bg-box my-[20px] mx-auto max-w-[500px]">
                        <span className="text-text-muted">{t('privacy.wall_posting_disabled')}</span>
                    </div>
                )
            )}

            <InfiniteScrollList
                itemsCount={wallData.posts.length}
                isLoadingInitial={wallData.isPageLoading}
                isLoadingMore={wallData.isLoadingMore}
                hasMore={wallData.hasMore}
                onLoadMore={wallData.loadMore}
                emptyState={
                    <div className="text-center text-text-muted p-[30px_20px] text-[13px] w-full box-border bg-bg-box my-[20px] mx-auto max-w-[500px]">
                        {t('empty.wall')}
                    </div>
                }
            >
                <WallPostList
                    posts={wallData.posts}
                    authUser={authUser}
                    profileUser={profileUser}
                    editingPostId={wallData.editingPostId}
                    saveEdit={wallData.saveEdit}
                    cancelEditing={wallData.cancelEditing}
                    startEditing={wallData.startEditing}
                    handleDelete={wallData.handleDelete}
                    handleRepostSuccess={wallData.handleRepostSuccess}
                />
            </InfiniteScrollList>
        </div>
    );
}