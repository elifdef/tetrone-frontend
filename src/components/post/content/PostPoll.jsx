import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PostService from '../../../services/post.service';
import { notifyError } from '../../common/Notify';
import { useModal } from '../../../context/ModalContext';
import PollVotersModal from '../../modals/PollVotersModal';
import Button from '../../ui/Button';

export default function PostPoll({ poll, postId, isOwner }) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [results, setResults] = useState({});
    const [votedOptionIds, setVotedOptionIds] = useState([]);
    const [draftOptionIds, setDraftOptionIds] = useState([]);
    const [isClosed, setIsClosed] = useState(false);
    const [quizData, setQuizData] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [votersData, setVotersData] = useState(null);
    const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);
    const [scrollToOptionId, setScrollToOptionId] = useState(null);
    const [isLoadingVoters, setIsLoadingVoters] = useState(false);

    useEffect(() => {
        if (poll) {
            setResults(poll.results || {});
            setVotedOptionIds(poll.voted_option_ids || []);
            setDraftOptionIds(poll.voted_option_ids || []);
            setIsClosed(poll.is_closed || false);

            if (poll.type === 'quiz' && poll.voted_option_ids?.length > 0) {
                setQuizData({ options: poll.options, explanation: poll.explanation });
            }
        }
    }, [poll]);

    if (!poll) return null;

    const totalVotes = poll.total_voters_count;

    const getPercentage = (optionId) => {
        if (totalVotes === 0) return 0;
        const count = Number(results[optionId]) || 0;
        return Math.round((count / totalVotes) * 100);
    };

    const hasDraftChanges = JSON.stringify([...draftOptionIds].sort()) !== JSON.stringify([...votedOptionIds].sort());

    const submitVote = async (idsToSubmit) => {
        if (idsToSubmit.length === 0 || isClosed) return;
        setIsLoading(true);
        const res = await PostService.votePoll(postId, idsToSubmit);

        if (res) {
            setResults(res.poll.results);
            setVotedOptionIds(res.poll.voted_option_ids);
            setDraftOptionIds(res.poll.voted_option_ids);
            if (res.poll.quiz_data) setQuizData(res.poll.quiz_data);
        } else {
            notifyError(t('api.error.ERR_NETWORK'));
            setDraftOptionIds(votedOptionIds);
        }
        setIsLoading(false);
    };

    const openVotersModal = async (optionId, e) => {
        if (e) e.stopPropagation();
        if (poll.is_anonymous) return;

        setScrollToOptionId(optionId);
        setIsVotersModalOpen(true);
        if (votersData) return;

        setIsLoadingVoters(true);
        const res = await PostService.getPollVoters(postId);

        if (res) setVotersData(res.voters);
        else { notifyError(res.message || t('poll.error_voters')); setIsVotersModalOpen(false); }
        setIsLoadingVoters(false);
    };

    const handleTotalVotesClick = (e) => {
        if (!poll.is_anonymous && totalVotes > 0) openVotersModal(optionsToRender[0]?.id, e);
    };

    const handleClosePollClick = async () => {
        const isConfirmed = await openConfirm(t('poll.close_confirm_text'), t('poll.close_poll_title'));
        if (!isConfirmed) return;

        setIsLoading(true);
        const res = await PostService.closePoll(postId);
        if (res) setIsClosed(true);
        else notifyError(t('api.error.ERR_NETWORK'));
        setIsLoading(false);
    };

    const handleOptionClick = (optionId) => {
        if (isLoading || isClosed) return;
        if (votedOptionIds.length > 0 && !poll.can_change_vote) return;

        if (poll.is_multiple_choice) {
            let newDraft = [...draftOptionIds];
            if (newDraft.includes(optionId)) newDraft = newDraft.filter(id => id !== optionId);
            else newDraft.push(optionId);
            setDraftOptionIds(newDraft);
        } else {
            if (draftOptionIds.includes(optionId)) return;
            setDraftOptionIds([optionId]);
            submitVote([optionId]);
        }
    };

    const cancelDraft = () => setDraftOptionIds(votedOptionIds);

    const showResults = votedOptionIds.length > 0 || isClosed;
    const isQuiz = poll.type === 'quiz';
    const optionsToRender = quizData ? quizData.options : poll.options;

    return (
        <div className="mt-[15px] border border-border p-[15px] bg-bg-page text-[12px] w-full box-border">
            {/* Запитання */}
            <div className="font-bold text-[14px] text-text-main mb-[12px] break-words">
                {poll.question}
            </div>

            {/* Опції */}
            <div className="flex flex-col gap-[6px]">
                {optionsToRender.map((option) => {
                    const isVoted = votedOptionIds.includes(option.id);
                    const isSelected = draftOptionIds.includes(option.id);
                    const percent = getPercentage(option.id);
                    const canVoteNow = (votedOptionIds.length === 0 || poll.can_change_vote) && !isClosed;

                    let quizClassBg = 'bg-[rgba(128,128,128,0.1)]'; // Дефолтний фон прогресу
                    let icon = null;

                    if (showResults && isQuiz && quizData) {
                        if (option.is_correct) {
                            quizClassBg = 'bg-[rgba(75,179,75,0.4)]'; // Зелений
                            icon = '✅';
                        } else if (isVoted) {
                            quizClassBg = 'bg-[rgba(230,70,70,0.4)]'; // Червоний
                            icon = '❌';
                        }
                    } else if (showResults && isSelected) {
                        quizClassBg = 'bg-[rgba(91,155,213,0.3)]'; // Синій (твій вибір)
                    }

                    return (
                        <div key={option.id} className="relative w-full">
                            <div
                                onClick={() => handleOptionClick(option.id)}
                                className={`relative border flex justify-between items-center py-[6px] px-[10px] min-h-[32px] overflow-hidden select-none transition-colors 
                                    ${canVoteNow ? 'cursor-pointer hover:border-theme-link' : 'cursor-default'} 
                                    ${isSelected ? 'border-theme-link font-bold' : 'border-border'}`}
                            >
                                {/* Прогрес бар */}
                                {showResults && (
                                    <div
                                        className={`absolute left-0 top-0 h-full ${quizClassBg} transition-all duration-300 z-0`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                )}

                                {/* Текст опції */}
                                <div className="relative z-10 flex items-center gap-[8px] text-text-main">
                                    {poll.is_multiple_choice && (
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="m-0 pointer-events-none w-[14px] h-[14px] accent-theme-link"
                                        />
                                    )}
                                    <span className="break-words max-w-full leading-[1.3]">{option.text}</span>
                                    {icon && <span className="text-[12px]">{icon}</span>}
                                </div>

                                {/* Відсотки */}
                                {showResults && (
                                    <div
                                        className={`relative z-10 font-bold ml-[10px] pl-[10px] min-w-[35px] text-right ${!poll.is_anonymous ? 'text-theme-link cursor-pointer hover:underline' : 'text-text-muted cursor-default'}`}
                                        onClick={(e) => openVotersModal(option.id, e)}
                                        title={!poll.is_anonymous ? t('poll.view_voters') : ''}
                                    >
                                        {percent}%
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Пояснення Вікторини */}
            {isQuiz && showResults && quizData?.explanation && (
                <div className="mt-[15px] p-[10px] bg-[rgba(128,128,128,0.05)] border-l-[3px] border-[#b5802a] text-[11px] text-text-main italic">
                    <span className="block font-bold text-text-muted mb-[4px] not-italic uppercase text-[10px] tracking-wide">{t('poll.explanation_title')}</span>
                    {quizData.explanation}
                </div>
            )}

            {/* Кнопки мульти-голосування */}
            {poll.is_multiple_choice && hasDraftChanges && !isClosed && (
                <div className="flex gap-[10px] mt-[12px] pt-[12px] border-t border-border">
                    <Button onClick={() => submitVote(draftOptionIds)} disabled={isLoading || draftOptionIds.length === 0}>
                        {t('action.vote')}
                    </Button>
                    {votedOptionIds.length > 0 && (
                        <button className="bg-transparent border-none text-text-muted cursor-pointer hover:underline" onClick={cancelDraft} disabled={isLoading}>
                            {t('action.cancel')}
                        </button>
                    )}
                </div>
            )}

            {/* Мета-дані опитування */}
            <div className="flex justify-between items-center mt-[12px] pt-[12px] border-t border-border text-[11px] text-text-muted">
                <div className="flex items-center gap-[6px]">
                    <span
                        className={`transition-colors ${!poll.is_anonymous && totalVotes > 0 ? "cursor-pointer text-theme-link hover:underline font-bold" : ""}`}
                        onClick={handleTotalVotesClick}
                    >
                        {t('entities.vote', { count: totalVotes })}
                    </span>
                    {poll.is_anonymous && (
                        <>
                            <span className="opacity-50">•</span>
                            <span>{t('post.anonymous_poll')}</span>
                        </>
                    )}
                    {isClosed && (
                        <>
                            <span className="opacity-50">•</span>
                            <span className="font-bold text-theme-error uppercase tracking-wide text-[10px]">{t('poll.closed_badge')}</span>
                        </>
                    )}
                </div>

                {isOwner && !isClosed && (
                    <button className="bg-transparent border-none text-theme-error cursor-pointer font-bold hover:underline" onClick={handleClosePollClick}>
                        {t('action.close')}
                    </button>
                )}
            </div>

            <PollVotersModal
                isOpen={isVotersModalOpen}
                onClose={() => setIsVotersModalOpen(false)}
                pollData={votersData}
                optionsToRender={optionsToRender}
                results={results}
                pollQuestion={poll.question}
                totalVoters={totalVotes}
                scrollToOptionId={scrollToOptionId}
                isLoadingInitial={isLoadingVoters}
                isLoadingMore={false}
                hasMore={false}
                onLoadMore={() => {}}
                error={false}
                onRetry={null}
            />
        </div>
    );
}