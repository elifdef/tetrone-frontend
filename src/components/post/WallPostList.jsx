import PostItem from '../post/PostItem';
import EditPostModal from '../modals/EditPostModal';

export default function WallPostList({
    posts, authUser, profileUser,
    editingPostId,
    saveEdit, cancelEditing,
    startEditing, handleDelete, handleRepostSuccess
}) {
    const isWallOwner = authUser && profileUser && authUser.id === profileUser.id;
    const editingPost = posts.find(post => post.id === editingPostId);

    return (
        <div className="tetrone-post-list">
            {posts.map(post => {
                const isAuthor = authUser && post.user && authUser.id === post.user.id;

                return (
                    <PostItem
                        key={post.id}
                        post={post}
                        isOwner={isAuthor || isWallOwner}
                        onEdit={isAuthor ? startEditing : null}
                        currentUserId={authUser?.id}
                        onDelete={handleDelete}
                        onRepostSuccess={handleRepostSuccess}
                    />
                );
            })}

            {editingPost && (
                <EditPostModal
                    isOpen={!!editingPostId}
                    post={editingPost}
                    onClose={cancelEditing}
                    onSaveSuccess={saveEdit}
                />
            )}
        </div>
    );
}