import { Link, useSearchParams } from "react-router";
import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { useTranslation } from 'react-i18next';

import FeedService from "../services/feed.service";
import PostService from "../services/post.service";
import { notifyError } from "../components/common/Notify";

import { usePageTitle } from "../hooks/usePageTitle";
import PostItem from "../components/post/PostItem";
import InfiniteScrollList from "../components/common/InfiniteScrollList";
import { AuthContext } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { SettingsIcon, EditIcon } from "../components/ui/Icons.jsx";
import FeedSettingsModal from "../components/modals/FeedSettingsModal.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import CreatePostForm from "../components/post/CreatePostForm";

export default function FeedPage() {
    const { t } = useTranslation();
    usePageTitle(t('common.posts'));

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'feed';
    const hashtag = searchParams.get('hashtag') || null;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { user: authUser } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const handleTabChange = (tab) => {
        if (activeTab === tab && !hashtag) return;
        setSearchParams({ tab });
    };

    const clearHashtag = () => {
        setSearchParams({ tab: activeTab });
    };

    const feedTabs = [
        { id: 'feed', label: t('feed.my_feed') },
        { id: 'global', label: t('feed.global_feed') }
    ];

    const settingsButton = (
        <button
            type="button"
            className="bg-transparent border-none cursor-pointer text-text-muted hover:text-theme-link p-[4px] outline-none flex items-center justify-center"
            onClick={() => setIsSettingsOpen(true)}
            title={t('settings.feed.title')}
        >
            <SettingsIcon width={16} height={16} />
        </button>
    );

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['feed', activeTab, hashtag],
        queryFn: ({ pageParam = 1, signal }) => FeedService.getFeed(activeTab, pageParam, signal, hashtag),
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta;
            return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        }
    });

    const posts = data?.pages.flatMap(page => page.posts || []) || [];

    const createPostMutation = useMutation({
        mutationFn: (data) => PostService.create(data),
        onSuccess: (res) => {
            if (res && res.post) {
                handlePostCreated(res.post);
            } else {
                notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
            }
        },
        onError: () => notifyError(t('api.error.ERR_NETWORK'))
    });

    const handlePostCreated = (newPost) => {
        if (!newPost || !newPost.id) return;
        queryClient.setQueryData(['feed', activeTab, hashtag], (oldData) => {
            if (!oldData) return oldData;
            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
                newPages[0] = { ...newPages[0], posts: [newPost, ...newPages[0].posts] };
            }
            return { ...oldData, pages: newPages };
        });
    };

    const handleRepostSuccess = (newPost) => {
        if (!newPost || !newPost.id) return;
        queryClient.setQueryData(['feed', activeTab, hashtag], (oldData) => {
            if (!oldData) return oldData;
            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
                newPages[0] = { ...newPages[0], posts: [newPost, ...newPages[0].posts] };
            }
            return { ...oldData, pages: newPages };
        });
    };

    const EmptyState = () => (
        <div className="bg-bg-box border border-border p-[40px_20px] text-center text-[11px] text-text-main mt-[15px]">
            <h3 className="m-0 mb-[10px] text-[13px] font-bold text-theme-link">{t('common.welcome')}</h3>
            {activeTab === 'feed' ? (
                <>
                    <p className="m-0 mb-[20px] text-text-muted">{t('empty.feed')}</p>
                    <div className="flex items-center justify-center gap-[10px]">
                        <Button>
                            <Link to="/friends?tab=all" className="text-inherit no-underline hover:underline">
                                {t('feed.find_friends')}
                            </Link>
                        </Button>
                        <Button variant="secondary" onClick={() => handleTabChange('global')}>
                            {t('feed.view_global_feed')}
                        </Button>
                    </div>
                </>
            ) : (
                <p className="m-0 text-text-muted">{t('empty.feed')}</p>
            )}
        </div>
    );

    return (
        <div className="flex flex-col font-tahoma">
            <Tabs
                tabs={feedTabs}
                activeTab={activeTab}
                onChange={handleTabChange}
                rightElement={settingsButton}
            />

            {hashtag && (
                <div className="bg-[rgba(91,155,213,0.05)] border border-theme-link p-[10px_15px] flex items-center justify-between text-[11px] text-text-main mb-[15px] mt-[10px]">
                    <span>{t('feed.results_for_hashtag')} <strong className="text-theme-link">#{hashtag}</strong></span>
                    <button type="button" className="bg-transparent border-none text-theme-link font-bold cursor-pointer hover:underline p-0 outline-none" onClick={clearHashtag}>
                        {t('action.clear')}
                    </button>
                </div>
            )}

            {authUser && !hashtag && activeTab === 'feed' && (
                <div className="mt-[15px] mb-[5px] bg-bg-box border border-border p-[15px]">
                    <div className="flex items-center gap-[8px] text-[11px] text-text-muted font-bold uppercase tracking-wider mb-[12px] pb-[8px] border-b border-border">
                        <EditIcon width={14} height={14} /> {t('feed.create_post_title')}
                    </div>

                    <CreatePostForm
                        currentUser={authUser}
                        onSubmitSuccess={(data) => createPostMutation.mutateAsync(data)}
                        placeholder={t('feed.whats_new')}
                    />
                </div>
            )}

            <InfiniteScrollList
                itemsCount={posts.length}
                isLoadingInitial={isLoading}
                isLoadingMore={isFetchingNextPage}
                hasMore={!!hasNextPage}
                onLoadMore={fetchNextPage}
                error={isError}
                onRetry={refetch}
                emptyState={<EmptyState />}
                className={`flex flex-col w-full ${activeTab === 'global' ? 'mt-[15px]' : ''}`}
            >
                {posts.map(post => (
                    <PostItem
                        key={post.id}
                        post={post}
                        currentUserId={authUser?.id}
                        currentUsername={authUser?.username}
                        isOwner={authUser?.id === post.user?.id}
                        onRepostSuccess={handleRepostSuccess}
                        isFeed={true} // ДОДАНО: Кажемо компоненту, що він у стрічці
                    />
                ))}
            </InfiniteScrollList>

            <FeedSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}