import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useComments } from "./hooks/useComments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import { useTranslation } from 'react-i18next';

export default function CommentsSection({ postId, onCountChange })
{
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);

    const {
        comments, isLoadingInitial, isLoadingMore, hasMore, error, loadMore,
        fetchComments, addComment, removeComment, editComment
    } = useComments(postId);

    const handleAddComment = async (content, parentId = null) =>
    {
        const success = await addComment(content, parentId);
        if (success)
        {
            onCountChange(1);
        }
        return success;
    };

    const handleRemoveComment = async (commentId) =>
    {
        const success = await removeComment(commentId);
        if (success)
        {
            onCountChange(-1);
        }
    };

    return (
        <div className="tetrone-comments-container">
            <CommentForm
                user={ user }
                onSubmit={ (content) => handleAddComment(content, null) }
                placeholder={ t('action.comment') }
            />

            <CommentList
                comments={ comments }
                currentUser={ user }
                onDelete={ handleRemoveComment }
                noCommentsText={ t('empty.comments') }
                isLoadingInitial={ isLoadingInitial }
                isLoadingMore={ isLoadingMore }
                hasMore={ hasMore }
                error={ error }
                onLoadMore={ loadMore }
                onRetry={ fetchComments }
                onAddComment={ handleAddComment }
                onEdit={ editComment }
            />
        </div>
    );
}