import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import { notifyError } from '../../common/Notify';

export default function PollCreator({ initialData, onSave, onCancel }) {
    const { t } = useTranslation();

    const [question, setQuestion] = useState(initialData?.question || '');
    const [options, setOptions] = useState(initialData?.options || [
        { id: 1, text: '', is_correct: false },
        { id: 2, text: '', is_correct: false }
    ]);

    const [isAnonymous, setIsAnonymous] = useState(initialData?.is_anonymous || false);
    const [isMultipleChoice, setIsMultipleChoice] = useState(initialData?.is_multiple_choice || false);
    const [canChangeVote, setCanChangeVote] = useState(initialData?.can_change_vote || false);
    const [isQuiz, setIsQuiz] = useState(initialData?.type === 'quiz' || false);
    const [explanation, setExplanation] = useState(initialData?.explanation || '');

    const handleAddOption = () => {
        if (options.length >= 16) {
            notifyError(t('poll.max_options_reached'));
            return;
        }
        setOptions([...options, { id: Date.now(), text: '', is_correct: false }]);
    };

    const handleRemoveOption = (id) => {
        if (options.length <= 2) {
            notifyError(t('poll.min_options_reached'));
            return;
        }
        setOptions(options.filter(opt => opt.id !== id));
    };

    const handleOptionChange = (id, text) => {
        setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
    };

    const handleSetCorrect = (id) => {
        if (isMultipleChoice) {
            setOptions(options.map(opt => opt.id === id ? { ...opt, is_correct: !opt.is_correct } : opt));
        } else {
            setOptions(options.map(opt => ({ ...opt, is_correct: opt.id === id })));
        }
    };

    const handleSave = () => {
        if (!question.trim()) return notifyError(t('poll.empty_question'));
        if (options.some(opt => !opt.text.trim())) return notifyError(t('poll.empty_option'));
        if (isQuiz && !options.some(opt => opt.is_correct)) return notifyError(t('poll.no_correct_option'));
        if (isQuiz && explanation.length > 255) return notifyError(t('poll.explanation_too_long'));

        const pollData = {
            question: question.trim(),
            type: isQuiz ? 'quiz' : 'regular',
            is_anonymous: isAnonymous,
            is_multiple_choice: isMultipleChoice,
            can_change_vote: canChangeVote,
            explanation: isQuiz && explanation.trim() ? explanation.trim() : null,
            options: options.map((opt, index) => ({
                id: index + 1,
                text: opt.text.trim(),
                ...(isQuiz && { is_correct: opt.is_correct })
            }))
        };

        onSave(pollData);
    };

    return (
        <div className="flex flex-col gap-[15px]">
            <Input
                placeholder={t('poll.question_placeholder')}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={255}
            />

            <div className="flex flex-col gap-[10px]">
                {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-[10px]">
                        {isQuiz && (
                            <input
                                type={isMultipleChoice ? "checkbox" : "radio"}
                                checked={option.is_correct}
                                onChange={() => handleSetCorrect(option.id)}
                                title={t('poll.mark_correct')}
                                className="cursor-pointer w-[16px] h-[16px] m-0 accent-theme-link shrink-0"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <Input
                                placeholder={`${t('poll.option')} ${index + 1}`}
                                value={option.text}
                                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                maxLength={100}
                            />
                        </div>
                        <button
                            onClick={() => handleRemoveOption(option.id)}
                            className="bg-transparent border-none text-text-muted cursor-pointer hover:text-theme-error text-[14px] flex shrink-0 p-[4px] transition-colors"
                            title={t('action.delete')}
                        >
                            ✖
                        </button>
                    </div>
                ))}
            </div>

            {options.length < 16 && (
                <Button type="button" variant="secondary" onClick={handleAddOption} className="w-fit mt-[5px]">
                    + {t('poll.add_option')}
                </Button>
            )}

            <div className="flex flex-col gap-[8px] p-[12px] border border-border bg-[rgba(128,128,128,0.05)] mt-[5px]">
                <label className="flex items-center gap-[8px] text-[11px] text-text-main cursor-pointer select-none">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="cursor-pointer w-[16px] h-[16px] m-0 accent-theme-link" />
                    {t('poll.setting_anonymous')}
                </label>

                <label className="flex items-center gap-[8px] text-[11px] text-text-main cursor-pointer select-none">
                    <input type="checkbox" checked={isMultipleChoice} onChange={(e) => {
                        setIsMultipleChoice(e.target.checked);
                        if (!e.target.checked && isQuiz) {
                            setOptions(options.map(opt => ({ ...opt, is_correct: false })));
                        }
                    }} className="cursor-pointer w-[16px] h-[16px] m-0 accent-theme-link" />
                    {t('poll.setting_multiple')}
                </label>

                <label className="flex items-center gap-[8px] text-[11px] text-text-main cursor-pointer select-none">
                    <input type="checkbox" checked={canChangeVote} onChange={(e) => setCanChangeVote(e.target.checked)} className="cursor-pointer w-[16px] h-[16px] m-0 accent-theme-link" />
                    {t('poll.setting_revote')}
                </label>

                <label className="flex items-center gap-[8px] text-[11px] cursor-pointer select-none text-theme-link font-bold">
                    <input type="checkbox" checked={isQuiz} onChange={(e) => setIsQuiz(e.target.checked)} className="cursor-pointer w-[16px] h-[16px] m-0 accent-theme-link" />
                    <span>{t('poll.setting_quiz')}</span>
                </label>
            </div>

            {isQuiz && (
                <div className="mt-[5px]">
                    <Textarea
                        placeholder={t('poll.explanation_placeholder')}
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        maxLength={255}
                        className="!min-h-[60px]"
                    />
                </div>
            )}

            <div className="flex justify-end gap-[10px] mt-[15px] pt-[15px] border-t border-border">
                <Button variant="secondary" onClick={onCancel}>{t('action.cancel')}</Button>
                <Button onClick={handleSave}>{t('action.save')}</Button>
            </div>
        </div>
    );
}