import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import ActivityPage from '@/pages/ActivityPage';
import ActivityService from '@/services/activity.service';
import CommentService from '@/services/comment.service';
import PostService from '@/services/post.service';
import { ModalContext, type ModalContextValue } from '@/app/providers/modal-context';
import type { ApiErrorResponse, ApiRequestHandle, ApiResponse } from '@/types/api';

const mockT = (key: string) => key;
const mockI18n = { language: 'uk' };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

vi.mock('@/hooks/usePageTitle', () => ({
    usePageTitle: vi.fn(),
}));

vi.mock('@/hooks/useDateFormatter', () => ({
    useDateFormatter: () => (date: string) => date,
}));

vi.mock('@/hooks/useIntersectionObserver', () => ({
    useIntersectionObserver: () => ({ current: null }),
}));

vi.mock('@/components/common/Notify', () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
}));

vi.mock('@/components/post/PostItem', () => ({
    default: ({
        post,
        onLikeToggle,
        onDelete,
    }: {
        post: { id: string | number; title?: string };
        onLikeToggle?: (postId: string | number, isLiked?: boolean) => void;
        onDelete?: (postId: string | number) => void;
    }) => (
        <div data-testid={`post-item-${post.id}`}>
            <span>{post.title || `Post #${post.id}`}</span>
            {onLikeToggle && (
                <button type="button" onClick={() => onLikeToggle(post.id, false)}>
                    unlike-{post.id}
                </button>
            )}
            {onDelete && (
                <button type="button" onClick={() => onDelete(post.id)}>
                    delete-post-{post.id}
                </button>
            )}
        </div>
    ),
}));

function mockHandle<T extends object>(data: T, isError = false): ApiRequestHandle<T> {
    const response = {
        ...data,
        status: isError ? 400 : 200,
        ok: !isError,
    } as ApiResponse<T>;

    const handle: ApiRequestHandle<T> = {
        onSuccess(cb) {
            if (!isError) cb(response);
            return handle;
        },
        onError(cb) {
            if (isError) cb(response as unknown as ApiErrorResponse);
            return handle;
        },
        onFinally(cb) {
            cb();
            return handle;
        },
        then(onfulfilled, onrejected) {
            return Promise.resolve(response).then(onfulfilled, onrejected);
        },
        catch(onrejected) {
            return Promise.resolve(response).catch(onrejected);
        },
    };

    return handle;
}

const defaultModalValue: ModalContextValue = {
    openConfirm: vi.fn().mockResolvedValue(true),
    openPrompt: vi.fn().mockResolvedValue(null),
    openPassword: vi.fn().mockResolvedValue(null),
    openCustom: vi.fn().mockResolvedValue(undefined),
    closeModal: vi.fn(),
};

function renderActivityPage(initialEntry = '/activity', modalOverride?: Partial<ModalContextValue>) {
    return render(
        <ModalContext.Provider value={{ ...defaultModalValue, ...modalOverride }}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/activity" element={<ActivityPage />} />
                </Routes>
            </MemoryRouter>
        </ModalContext.Provider>
    );
}

describe('Activity Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(ActivityService, 'getCounts').mockReturnValue(
            mockHandle({
                code: 'ACTIVITY_COUNTS_RETRIEVED',
                counts: {
                    likes: 2,
                    comments: 1,
                    reposts: 1,
                    voted_polls: 1,
                },
            })
        );

        vi.spyOn(ActivityService, 'getLikedPosts').mockReturnValue(
            mockHandle({
                code: 'LIKED_POSTS_RETRIEVED',
                posts: [
                    { id: 'post-1', title: 'First Liked Post' },
                    { id: 'post-2', title: 'Second Liked Post' },
                ],
                meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 },
            })
        );

        vi.spyOn(ActivityService, 'getMyComments').mockReturnValue(
            mockHandle({
                code: 'COMMENTS_RETRIEVED',
                comments: [
                    {
                        id: 'comment-uuid-1',
                        post_id: 'post-99',
                        parent_id: null,
                        content: 'My test comment text',
                        created_at: '2026-11-24T12:00:00Z',
                        likes_count: 0,
                        is_liked: false,
                        post: {
                            id: 'post-99',
                            author: {
                                username: 'space_dev',
                                name: 'Dev Space',
                                avatar: null,
                            },
                        },
                    },
                ],
                meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
            })
        );

        vi.spyOn(ActivityService, 'getMyReposts').mockReturnValue(
            mockHandle({
                code: 'REPOSTS_RETRIEVED',
                posts: [{ id: 'repost-1', title: 'My Reposted Post' }],
                meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
            })
        );

        vi.spyOn(ActivityService, 'getVotedPolls').mockReturnValue(
            mockHandle({
                code: 'VOTED_POLLS_RETRIEVED',
                posts: [{ id: 'poll-post-1', title: 'Poll Question Post' }],
                meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
            })
        );

        vi.spyOn(ActivityService, 'getScreenTime').mockReturnValue(
            mockHandle({
                code: 'SCREEN_TIME_RETRIEVED',
                time: {
                    total_active_seconds: 3725,
                    history: [{ date: '2026-11-24', seconds: 3725 }],
                },
            })
        );
    });

    it('renders liked posts by default and decrements counter on unlike', async () => {
        renderActivityPage();

        expect(await screen.findByText('First Liked Post')).toBeInTheDocument();
        expect(screen.getByText('Second Liked Post')).toBeInTheDocument();
        expect(screen.getByText('(2)')).toBeInTheDocument();

        fireEvent.click(screen.getByText('unlike-post-1'));

        await waitFor(() => {
            expect(screen.queryByText('First Liked Post')).not.toBeInTheDocument();
        });
        expect(screen.getAllByText('(1)').length).toBeGreaterThan(0);
    });

    it('deletes a comment using comment.id on the comments tab', async () => {
        const deleteSpy = vi
            .spyOn(CommentService, 'delete')
            .mockReturnValue(mockHandle({ code: 'COMMENT_DELETED' }));

        renderActivityPage('/activity?tab=comments');

        expect(await screen.findByText('My test comment text')).toBeInTheDocument();
        expect(screen.getByText('Dev Space')).toBeInTheDocument();

        fireEvent.click(screen.getByTitle('action.delete'));

        await waitFor(() => {
            expect(deleteSpy).toHaveBeenCalledWith('comment-uuid-1');
            expect(screen.queryByText('My test comment text')).not.toBeInTheDocument();
        });
    });

    it('deletes a repost via PostService.delete on the reposts tab', async () => {
        const deletePostSpy = vi
            .spyOn(PostService, 'delete')
            .mockReturnValue(mockHandle({ code: 'POST_DELETED' }));

        renderActivityPage('/activity?tab=reposts');

        expect(await screen.findByText('My Reposted Post')).toBeInTheDocument();

        fireEvent.click(screen.getByText('delete-post-repost-1'));

        await waitFor(() => {
            expect(deletePostSpy).toHaveBeenCalledWith('repost-1');
            expect(screen.queryByText('My Reposted Post')).not.toBeInTheDocument();
        });
    });

    it('switches to screen-time tab and renders formatted duration & history', async () => {
        renderActivityPage();

        await screen.findByText('First Liked Post');
        fireEvent.click(screen.getByText('activity.stats.title'));

        expect(
            await screen.findAllByText(
                '1 common.hours_short 2 common.minutes_short 5 common.seconds_short'
            )
        ).toHaveLength(2);
        expect(screen.getByText('2026-11-24')).toBeInTheDocument();
    });
});