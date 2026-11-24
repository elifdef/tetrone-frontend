declare module '@/components/post/CreatePostForm' {
    import type { ComponentType } from 'react';
    import type { SpaceData } from '@/types/space';
    import type { UserData } from '@/types/user';

    export interface CreatePostFormProps {
        onSubmitSuccess: (finalData: Record<string, unknown>) => Promise<boolean> | boolean;
        space?: SpaceData | null;
        isSpaceAdmin?: boolean;
        targetUsername?: string | null;
        currentUser?: UserData | null;
        onToggleScheduled?: (() => void) | null;
        showScheduled?: boolean;
        placeholder?: string;
    }

    const CreatePostForm: ComponentType<CreatePostFormProps>;
    export default CreatePostForm;
}

declare module '@/components/post/PostItem' {
    import type { ComponentType } from 'react';
    import type { SpacePost } from '@/types/space';

    export interface PostItemProps {
        post: SpacePost;
        onEdit?: (post: SpacePost) => void;
        onDelete?: (postId: number | string) => void;
        isOwner?: boolean;
        currentUsername?: string | null;
        onLikeToggle?: (postId: number | string) => void;
        onRepostSuccess?: () => void;
        isInner?: boolean;
        readonly?: boolean;
        depth?: number;
        isAdmin?: boolean;
        onPublishNow?: (postId: number | string) => void;
        onPinToggle?: (postId: number | string) => void;
        isFeed?: boolean;
    }

    const PostItem: ComponentType<PostItemProps>;
    export default PostItem;
}