import PostItem from './PostItem';

export default function WallPostList({ 
    posts, authUser, profileUser, editingPostId, saveEdit, 
    cancelEditing, startEditing, handleDelete, handleRepostSuccess, 
    handlePublishNow, handlePinToggle 
}) {
    if (!posts || posts.length === 0) return null;

    return (
        <div className="flex flex-col gap-[15px]">
            {posts.map(post => (
                <PostItem
                    key={post.id}
                    post={post}
                    currentUsername={authUser?.username}
                    isOwner={authUser?.id === profileUser?.id}
                    onEdit={startEditing}
                    onDelete={handleDelete}
                    onRepostSuccess={handleRepostSuccess}
                    onPublishNow={handlePublishNow} // Кнопка "Опублікувати зараз"
                    onPinToggle={handlePinToggle}   // Кнопка "Прикріпити"
                />
            ))}
        </div>
    );
}