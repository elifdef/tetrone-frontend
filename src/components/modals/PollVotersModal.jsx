import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Button from "../ui/Button";
import Avatar from '../ui/Avatar';
import InfiniteScrollList from '../common/InfiniteScrollList'; // Перевір шлях до твого компонента

export default function PollVotersModal({
    isOpen,
    onClose,
    pollData,
    optionsToRender,
    results,
    pollQuestion,
    totalVoters,
    scrollToOptionId, // Замість activeTab: ID варіанту, до якого треба проскролити
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    onLoadMore,
    error,
    onRetry
}) {
    const { t } = useTranslation();
    const modalBodyRef = useRef(null);

    // Автоматичний скрол до потрібного якоря (варіанту відповіді)
    useEffect(() => {
        if (isOpen && scrollToOptionId && !isLoadingInitial) {
            // Використовуємо таймаут, щоб дати DOM час на рендер списку
            const timer = setTimeout(() => {
                const element = document.getElementById(`poll-option-group-${scrollToOptionId}`);
                if (element && modalBodyRef.current) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, scrollToOptionId, isLoadingInitial, pollData]);

    if (!isOpen) return null;

    // Рахуємо скільки юзерів вже завантажено для InfiniteScrollList
    const loadedVotersCount = optionsToRender.reduce((sum, opt) => {
        return sum + (pollData?.[opt.id]?.length || 0);
    }, 0);

    return (
        <div className="tetrone-modal-overlay" onClick={onClose}>
            <div className="tetrone-modal-dialog tetrone-poll-modal-large" onClick={e => e.stopPropagation()}>

                <div className="tetrone-modal-header tetrone-poll-modal-header">
                    <div className="tetrone-poll-modal-title-box">
                        <h3 title={pollQuestion}>{pollQuestion} ({totalVoters})</h3>
                    </div>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body" ref={modalBodyRef}>
                    <InfiniteScrollList
                        itemsCount={loadedVotersCount}
                        isLoadingInitial={isLoadingInitial}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        onLoadMore={onLoadMore}
                        error={error}
                        onRetry={onRetry}
                        className="tetrone-poll-voters-scroll-container"
                    >
                        {optionsToRender.map(opt => {
                            const voters = pollData?.[opt.id] || [];
                            const totalCountForOption = results[opt.id] || 0;

                            return (
                                <div
                                    key={opt.id}
                                    id={`poll-option-group-${opt.id}`}
                                    className="tetrone-poll-option-section"
                                >
                                    {/* Заголовок групи (Я, Не я і тд) */}
                                    <div className="tetrone-poll-option-sticky-header">
                                        <h4 className="tetrone-poll-option-name">{opt.text}</h4>
                                        <span className="tetrone-poll-option-badge">{totalCountForOption}</span>
                                    </div>

                                    {/* Список тих, хто проголосував за цей варіант */}
                                    <div className="tetrone-poll-voters-list">
                                        {voters.length > 0 ? (
                                            voters.map(voter => (
                                                <Link to={`/${voter.username}`} key={voter.id} className="tetrone-poll-voter-row">
                                                    <Avatar user={voter} className="tetrone-poll-voter-img" />
                                                    <div className="tetrone-poll-voter-info">
                                                        <span className="tetrone-poll-voter-name">
                                                            {voter.first_name || voter.username} {voter.last_name || ''}
                                                        </span>
                                                        {voter.username && (
                                                            <span className="tetrone-poll-voter-username">@{voter.username}</span>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="tetrone-poll-voters-empty">
                                                {t('poll.no_voters_yet')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </InfiniteScrollList>
                </div>

                <div className="tetrone-modal-footer">
                    <Button onClick={onClose}>{t('action.close')}</Button>
                </div>
            </div>
        </div>
    );
}