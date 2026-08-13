import { Link, useSearchParams } from "react-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {useContext, useState} from "react";
import { useTranslation } from 'react-i18next';

import FeedService from "../services/feed.service";
import { usePageTitle } from "../hooks/usePageTitle";
import PostItem from "../components/post/PostItem";
import InfiniteScrollList from "../components/common/InfiniteScrollList";
import { AuthContext } from "../context/AuthContext";
import Button from "../components/ui/Button";
import {SettingsIcon} from "../components/ui/Icons.jsx";
import FeedSettingsModal from "../components/modals/FeedSettingsModal.jsx";

export default function FeedPage()
{
    const { t } = useTranslation();
    usePageTitle(t('common.posts'));

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'feed';
    const hashtag = searchParams.get('hashtag') || null; // Зчитуємо хештег з URL
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { user: authUser } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const handleTabChange = (tab) =>
    {
        if (activeTab === tab && !hashtag)
        {
            return;
        }
        setSearchParams({ tab });
    };

    const clearHashtag = () => {
        setSearchParams({ tab: activeTab });
    };

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
        getNextPageParam: (lastPage) =>
        {
            const meta = lastPage?.meta;
            return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        }
    });

    const posts = data?.pages.flatMap(page => page.posts || []) || [];

    const handleRepostSuccess = (newPost) =>
    {
        queryClient.setQueryData(['feed', activeTab, hashtag], (oldData) =>
        {
            if (!oldData)
            {
                return oldData;
            }
            const newPages = [...oldData.pages];
            if (newPages.length > 0)
            {
                newPages[0] = { ...newPages[0], posts: [newPost, ...newPages[0].posts] };
            }
            return { ...oldData, pages: newPages };
        });
    };

    const EmptyState = () => (
        <div className="tetrone-empty-state with-card">
            <h3>{ t('common.welcome') }!</h3>
            { activeTab === 'feed' ? (
                <>
                    <p>{ t('empty.feed') }</p>
                    <div className="tetrone-feed-actions">
                        <Button>
                            <Link to="/friends?tab=all" className="tetrone-link-white">
                                { t('feed.find_friends') }
                            </Link>
                        </Button>
                        <Button onClick={ () => handleTabChange('global') }>
                            { t('feed.view_global_feed') }
                        </Button>
                    </div>
                </>
            ) : (
                <p>{ t('empty.feed') }</p>
            ) }
        </div>
    );

    return (
        <div className="tetrone-feed-page">
            <div className="tetrone-tabs-container">
                <div className="tetrone-tabs">
                    <button className={ `tetrone-tab ${ activeTab === 'feed' ? 'active' : '' }` }
                            onClick={ () => handleTabChange('feed') }>
                        { t('feed.my_feed') }
                    </button>
                    <button className={ `tetrone-tab ${ activeTab === 'global' ? 'active' : '' }` }
                            onClick={ () => handleTabChange('global') }>
                        { t('feed.global_feed') }
                    </button>
                </div>

                <button
                    onClick={() => setIsSettingsOpen(true)}
                    title={t('settings.feed.title')}
                >
                    <SettingsIcon width={18} height={18} />
                </button>
            </div>

            {hashtag && (
                <div className="tetrone-card-wrapper tetrone-feed-hashtag-banner">
                    <span>{t('feed.results_for_hashtag')} <strong>#{hashtag}</strong></span>
                    <button className="tetrone-action-link" onClick={clearHashtag}>
                        {t('action.clear')}
                    </button>
                </div>
            )}

            <InfiniteScrollList
                itemsCount={ posts.length }
                isLoadingInitial={ isLoading }
                isLoadingMore={ isFetchingNextPage }
                hasMore={ !!hasNextPage }
                onLoadMore={ fetchNextPage }
                error={ isError }
                onRetry={ refetch }
                emptyState={ <EmptyState/> }
            >
                { posts.map(post => (
                    <PostItem
                        key={ post.id }
                        post={ post }
                        currentUserId={ authUser?.id }
                        isOwner={ authUser?.id === post.user?.id }
                        onRepostSuccess={ handleRepostSuccess }
                    />
                )) }
            </InfiniteScrollList>

            <FeedSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}