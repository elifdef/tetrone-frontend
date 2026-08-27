import { useMemo } from 'react';
import CommentItem from './CommentItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { buildCommentTree } from './hooks/commentTree';

export default function CommentList({
                                        comments, currentUser, onDelete, onEdit, onAddComment, noCommentsText,
                                        isLoadingInitial, isLoadingMore, hasMore, error, onLoadMore, onRetry
                                    }) {
    const tree = useMemo(() => buildCommentTree(comments), [comments]);

    return (
        <InfiniteScrollList
            itemsCount={comments.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            error={error}
            onRetry={onRetry}
            className="flex flex-col w-full"
            emptyState={
                <div className="text-[11px] text-text-muted italic text-center p-[10px]">
                    <p>{noCommentsText}</p>
                </div>
            }
        >
            {tree.map(commentNode => (
                <CommentItem
                    key={commentNode.id}
                    comment={commentNode}
                    currentUser={currentUser}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onAddComment={onAddComment}
                    depth={1}
                />
            ))}
        </InfiniteScrollList>
    );
}