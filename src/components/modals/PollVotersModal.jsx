import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Button from "../ui/Button";
import Avatar from '../ui/Avatar';
import InfiniteScrollList from '../common/InfiniteScrollList';
import Modal from './Modal';

export default function PollVotersModal({
                                            isOpen, onClose, pollData, optionsToRender, results, pollQuestion, totalVoters,
                                            scrollToOptionId, isLoadingInitial, isLoadingMore, hasMore, onLoadMore, error, onRetry
                                        }) {
    const { t } = useTranslation();
    const modalBodyRef = useRef(null);

    useEffect(() => {
        if (isOpen && scrollToOptionId && !isLoadingInitial) {
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

    const loadedVotersCount = optionsToRender.reduce((sum, opt) => {
        return sum + (pollData?.[opt.id]?.length || 0);
    }, 0);

    const footerBtn = (
        <Button onClick={onClose}>{t('action.close')}</Button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${pollQuestion} (${totalVoters})`}
            sizeClass="modal-md"
            footer={footerBtn}
            bodyClassName="!p-0 h-[400px] overflow-y-auto"
        >
            <div ref={modalBodyRef}>
                <InfiniteScrollList
                    itemsCount={loadedVotersCount}
                    isLoadingInitial={isLoadingInitial}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    onLoadMore={onLoadMore}
                    error={error}
                    onRetry={onRetry}
                    className="flex flex-col"
                >
                    {optionsToRender.map(opt => {
                        const voters = pollData?.[opt.id] || [];
                        const totalCountForOption = results[opt.id] || 0;

                        return (
                            <div key={opt.id} id={`poll-option-group-${opt.id}`} className="mb-[15px]">
                                {/* Заголовок групи (Липкий, як у ВК) */}
                                <div className="sticky top-0 bg-[#e0e5eb] border-b border-border py-[6px] px-[15px] flex items-center gap-[10px] z-[5]">
                                    <h4 className="m-0 text-[12px] font-bold text-[#2b2b2b]">{opt.text}</h4>
                                    <span className="bg-[#5d81ab] text-white text-[10px] px-[5px] py-[2px] font-bold">{totalCountForOption}</span>
                                </div>

                                {/* Список юзерів */}
                                <div className="flex flex-col">
                                    {voters.length > 0 ? (
                                        voters.map(voter => (
                                            <Link
                                                to={`/${voter.username}`}
                                                key={voter.id}
                                                className="flex items-center gap-[10px] py-[8px] px-[15px] border-b border-border transition-colors hover:bg-[rgba(128,128,128,0.05)] no-underline"
                                            >
                                                <Avatar user={voter} className="w-[32px] h-[32px] border border-border object-cover flex-shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[11px] text-theme-link hover:underline">
                                                        {voter.first_name || voter.username} {voter.last_name || ''}
                                                    </span>
                                                    {voter.username && (
                                                        <span className="text-[10px] text-text-muted">@{voter.username}</span>
                                                    )}
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="py-[15px] px-[15px] text-[11px] text-text-muted italic">
                                            {t('poll.no_voters_yet')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </InfiniteScrollList>
            </div>
        </Modal>
    );
}