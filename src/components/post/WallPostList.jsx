import PostItem from '../post/PostItem';
import EditPostModal from '../modals/EditPostModal';

export default function WallPostList({
                                         posts, authUser, profileUser,
                                         editingPostId,
                                         saveEdit, cancelEditing,
                                         startEditing, handleDelete, handleRepostSuccess
                                     }) {
    // Порівнюємо строго по username, оскільки ID більше не віддається
    const isWallOwner = authUser && profileUser && authUser.username === profileUser.username;
    const editingPost = posts.find(post => post.id === editingPostId);

    return (
        <div className="mt-[10px]">
            {posts.map(post => {
                // ФІКС: беремо username з post.author, а не з post.user
                const isAuthor = authUser && post.author && authUser.username === post.author.username;

                return (
                    <PostItem
                        key={post.id}
                        post={post}
                        isOwner={isAuthor || isWallOwner}
                        onEdit={isAuthor ? startEditing : null}
                        currentUsername={authUser?.username}
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