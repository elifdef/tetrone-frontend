export const buildCommentTree = (flatComments) =>
{
    const commentMap = {};
    const rootComments = [];

    flatComments.forEach(comment =>
    {
        commentMap[comment.id] = { ...comment, children: [] };
    });

    flatComments.forEach(comment =>
    {
        if (comment.parent_id && commentMap[comment.parent_id])
        {
            commentMap[comment.parent_id].children.push(commentMap[comment.id]);
        }
        else
        {
            rootComments.push(commentMap[comment.id]);
        }
    });

    return rootComments;
};