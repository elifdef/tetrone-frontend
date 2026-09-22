import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PostService from '../../../services/post.service';
import { notifyError, notifySuccess } from '../../common/Notify';
import { useModal } from '../../../context/ModalContext';
import PollVotersModal from '../../modals/PollVotersModal';
import Button from '../../ui/Button';

const CHART_COLORS = ['#5B9BD5', '#00cc66', '#ff9900', '#ff3347', '#9c27b0', '#00bcd4', '#ffeb3b'];

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

    const [showStats, setShowStats] = useState(false);
    const [chartData, setChartData] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

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

    const submitVote = (idsToSubmit) => {
        if (idsToSubmit.length === 0 || isClosed) return;
        setIsLoading(true);

        PostService.votePoll(postId, idsToSubmit)
        .onSuccess((res) => {
            setResults(res.poll.results);
            setVotedOptionIds(res.poll.voted_option_ids);
            setDraftOptionIds(res.poll.voted_option_ids);
            if (res.poll.quiz_data) setQuizData(res.poll.quiz_data);

            notifySuccess(t(`api.success.${res.code || 'VOTE_REGISTERED'}`));
            setIsLoading(false);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setDraftOptionIds(votedOptionIds);
            setIsLoading(false);
        });
    };

    const openVotersModal = (optionId, e) => {
        if (e) e.stopPropagation();
        if (poll.is_anonymous) return;

        setScrollToOptionId(optionId);
        setIsVotersModalOpen(true);
        if (votersData) return;

        setIsLoadingVoters(true);

        PostService.getPollVoters(postId)
        .onSuccess((res) => {
            setVotersData(res.voters);
            setIsLoadingVoters(false);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setIsVotersModalOpen(false);
            setIsLoadingVoters(false);
        });
    };

    const handleTotalVotesClick = (e) => {
        if (!poll.is_anonymous && totalVotes > 0) openVotersModal(optionsToRender[0]?.id, e);
    };

    const handleClosePollClick = async () => {
        const isConfirmed = await openConfirm(t('poll.close_confirm_text'), t('poll.close_poll_title'));
        if (!isConfirmed) return;

        setIsLoading(true);

        PostService.closePoll(postId)
        .onSuccess((res) => {
            setIsClosed(true);
            notifySuccess(t(`api.success.${res.code || 'POLL_CLOSED'}`));
            setIsLoading(false);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setIsLoading(false);
        });
    };

    const toggleStats = () => {
        if (showStats) {
            setShowStats(false);
            return;
        }

        setShowStats(true);
        if (!chartData) {
            setIsLoadingStats(true);

            PostService.getPollStats(postId)
            .onSuccess((res) => {
                if (res?.chart) setChartData(res.chart);
                setIsLoadingStats(false);
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                setShowStats(false);
                setIsLoadingStats(false);
            });
        }
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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bg-box border border-border p-[8px] text-[11px] shadow-sm">
                    <p className="font-bold text-text-main mb-[4px] border-b border-border pb-[2px]">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="m-0 flex items-center gap-[6px]">
                            <span className="w-[8px] h-[8px] rounded-full inline-block" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-text-muted">{entry.name}:</span>
                            <span className="font-bold text-theme-link">{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mt-[15px] border border-border p-[15px] bg-bg-page text-[12px] w-full box-border">
            <div className="font-bold text-[14px] text-text-main mb-[12px] break-words">
                {poll.question}
            </div>

            <div className="flex flex-col gap-[6px]">
                {optionsToRender.map((option) => {
                    const isVoted = votedOptionIds.includes(option.id);
                    const isSelected = draftOptionIds.includes(option.id);
                    const percent = getPercentage(option.id);
                    const canVoteNow = (votedOptionIds.length === 0 || poll.can_change_vote) && !isClosed;

                    let quizClassBg = 'bg-[rgba(128,128,128,0.1)]';
                    let icon = null;

                    if (showResults && isQuiz && quizData) {
                        if (option.is_correct) {
                            quizClassBg = 'bg-[rgba(75,179,75,0.4)]';
                            icon = '✅';
                        } else if (isVoted) {
                            quizClassBg = 'bg-[rgba(230,70,70,0.4)]';
                            icon = '❌';
                        }
                    } else if (showResults && isSelected) {
                        quizClassBg = 'bg-[rgba(91,155,213,0.3)]';
                    }

                    return (
                        <div key={option.id} className="relative w-full">
                            <div
                                onClick={() => handleOptionClick(option.id)}
                                className={`relative border flex justify-between items-center py-[6px] px-[10px] min-h-[32px] overflow-hidden select-none transition-colors 
                                    ${canVoteNow ? 'cursor-pointer hover:border-theme-link' : 'cursor-default'} 
                                    ${isSelected ? 'border-theme-link font-bold' : 'border-border'}`}
                            >
                                {showResults && (
                                    <div className={`absolute left-0 top-0 h-full ${quizClassBg} transition-all duration-300 z-0`} style={{ width: `${percent}%` }}></div>
                                )}

                                <div className="relative z-10 flex items-center gap-[8px] text-text-main">
                                    {poll.is_multiple_choice && (
                                        <input type="checkbox" checked={isSelected} readOnly className="m-0 pointer-events-none w-[14px] h-[14px] accent-theme-link" />
                                    )}
                                    <span className="break-words max-w-full leading-[1.3]">{option.text}</span>
                                    {icon && <span className="text-[12px]">{icon}</span>}
                                </div>

                                {showResults && (
                                    <div
                                        className={`relative z-10 font-bold ml-[10px] pl-[10px] min-w-[35px] text-right ${!poll.is_anonymous ? 'text-theme-link cursor-pointer hover:underline' : 'text-text-muted cursor-default'}`}
                                        onClick={(e) => openVotersModal(option.id, e)}
                                    >
                                        {percent}%
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isQuiz && showResults && quizData?.explanation && (
                <div className="mt-[15px] p-[10px] bg-[rgba(128,128,128,0.05)] border-l-[3px] border-[#b5802a] text-[11px] text-text-main italic">
                    <span className="block font-bold text-text-muted mb-[4px] not-italic uppercase text-[10px] tracking-wide">{t('poll.explanation_title')}</span>
                    {quizData.explanation}
                </div>
            )}

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

            {showStats && (
                <div className="mt-[15px] pt-[15px] border-t border-border">
                    <div className="text-[12px] font-bold text-text-main mb-[15px] flex items-center justify-between">
                        <span>{t('poll.stats')}</span>
                        <button className="bg-transparent border-none text-text-muted cursor-pointer hover:underline text-[10px] m-0 p-0 outline-none" onClick={toggleStats}>{t('poll.hide_stats')}</button>
                    </div>
                    {isLoadingStats ? (
                        <div className="text-[11px] text-text-muted italic text-center py-[20px]">{t('common.loading')}</div>
                    ) : chartData && chartData.length > 0 ? (
                        <div className="h-[220px] w-full text-[10px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)' }} tickFormatter={(val) => val.slice(5)} tickMargin={8} />
                                    <YAxis tick={{ fill: 'var(--color-text-muted)' }} allowDecimals={false} tickMargin={8} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-hover)' }} />

                                    {optionsToRender.map((opt, i) => (
                                        <Bar
                                            key={opt.id}
                                            dataKey={`option_${opt.id}`}
                                            name={opt.text}
                                            stackId="a"
                                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                                            radius={[0, 0, 0, 0]}
                                            maxBarSize={50}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-[11px] text-text-muted italic text-center py-[20px]">{t('poll.stats_empty')}</div>
                    )}
                </div>
            )}

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

                <div className="flex items-center gap-[10px]">
                    {showResults && !showStats && (
                        <button className="bg-transparent border-none text-theme-link cursor-pointer hover:underline" onClick={toggleStats}>
                            {t('poll.view_stats')}
                        </button>
                    )}
                    {isOwner && !isClosed && (
                        <button className="bg-transparent border-none text-theme-error cursor-pointer font-bold hover:underline" onClick={handleClosePollClick}>
                            {t('action.close')}
                        </button>
                    )}
                </div>
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
            />
        </div>
    );
}