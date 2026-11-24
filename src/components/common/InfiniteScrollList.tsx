import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import Button from '../ui/Button';

export interface InfiniteScrollListProps {
    children: ReactNode;
    itemsCount: number;
    isLoadingInitial: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    error?: boolean;
    onRetry?: (() => void) | null;
    emptyState?: ReactNode;
    endMessage?: ReactNode;
    className?: string;
}

export default function InfiniteScrollList({
    children,
    itemsCount,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    onLoadMore,
    error = false,
    onRetry = null,
    emptyState = null,
    endMessage = null,
    className = 'tetrone-feed-list',
}: InfiniteScrollListProps) {
    const { t } = useTranslation();
    const loaderRef = useIntersectionObserver(onLoadMore, hasMore, isLoadingMore);

    if (isLoadingInitial) {
        return <div className="tetrone-empty-state">{t('common.loading')}</div>;
    }

    if (error && itemsCount === 0) {
        return (
            <div className="tetrone-empty-state with-card">
                <h3>{t('api.error.ERR_NETWORK')}</h3>
                {onRetry && <Button onClick={onRetry}>{t('action.refresh')}</Button>}
            </div>
        );
    }

    if (itemsCount === 0) {
        return emptyState || (
            <div className="tetrone-empty-state with-card">{t('empty.no_more_data')}</div>
        );
    }

    return (
        <div className={className}>
            {children}

            {hasMore && !error && (
                <div ref={loaderRef} className="tetrone-infinite-scroll-msg">
                    {isLoadingMore ? `${t('common.loading')}...` : ''}
                </div>
            )}

            {!hasMore && itemsCount > 0 && (
                <div className="tetrone-infinite-scroll-msg">{endMessage}</div>
            )}

            {error && itemsCount > 0 && (
                <div className="tetrone-infinite-error-box">
                    <span className="tetrone-error-text">{t('api.error.ERR_NETWORK')}</span>
                    <br />
                    {onRetry && <Button onClick={onRetry}>{t('action.refresh')}</Button>}
                </div>
            )}
        </div>
    );
}