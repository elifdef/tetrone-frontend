import {useState, useEffect} from "react";
import {useTranslation} from "react-i18next";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import SettingsService from "../../services/settings.service";
import Modal from "./Modal.jsx";
import Button from "../ui/Button";
import {CloseIcon, InfoIcon} from "../ui/Icons";

export default function FeedSettingsModal({isOpen, onClose})
{
    const {t} = useTranslation();
    const queryClient = useQueryClient();

    const [feedMode, setFeedMode] = useState('chrono');
    const [engagementWeight, setEngagementWeight] = useState(0.5);
    const [rules, setRules] = useState([]);
    const [newRuleText, setNewRuleText] = useState('');
    const [newRuleType, setNewRuleType] = useState('word');
    const [newRuleWeight, setNewRuleWeight] = useState(0);

    const {data: preferences, isLoading} = useQuery({
        queryKey: ['settings', 'feed'],
        queryFn:  SettingsService.getFeedPreferences,
        enabled:  isOpen,
    });

    useEffect(() =>
    {
        if (preferences && Object.keys(preferences).length > 0)
        {
            setFeedMode(preferences.feed_mode || 'chrono');
            setEngagementWeight(preferences.engagement_weight ?? 0.5);

            const loadedRules = [];
            let idCounter = 1;

            const processRules = (rulesData, type) =>
            {
                if (rulesData && typeof rulesData === 'object' && !Array.isArray(rulesData))
                {
                    Object.entries(rulesData).forEach(([text, weight]) =>
                    {
                        loadedRules.push({id: idCounter++, type, text, weight: Number(weight)});
                    });
                }
            };

            processRules(preferences.tags_rules, 'tag');
            processRules(preferences.words_rules, 'word');
            setRules(loadedRules);
        }
    }, [preferences]);

    const mutation = useMutation({
        mutationFn: SettingsService.updateFeedPreferences,
        onSuccess:  () =>
                    {
                        queryClient.invalidateQueries({queryKey: ['settings', 'feed']});
                        queryClient.invalidateQueries({queryKey: ['feed']});
                        onClose();
                    }
    });

    const handleAddRule = () =>
    {
        if (!newRuleText.trim()) return;
        const cleanText = newRuleText.trim().replace(/^#/, '');

        setRules([
            ...rules, {
                id: Date.now(), type: newRuleType, text: cleanText, weight: Number(newRuleWeight)
            }
        ]);
        setNewRuleText('');
    };

    const handleRemoveRule = (idToRemove) => setRules(rules.filter(r => r.id !== idToRemove));

    const handleSubmit = () =>
    {
        const tags_rules = {};
        const words_rules = {};

        rules.forEach(rule =>
        {
            if (rule.type === 'tag') tags_rules[rule.text] = rule.weight;
            if (rule.type === 'word') words_rules[rule.text] = rule.weight;
        });

        mutation.mutate({
            feed_mode:         feedMode,
            engagement_weight: parseFloat(engagementWeight),
            tags_rules, words_rules,
        });
    };

    const getModeDescription = () =>
    {
        switch (feedMode)
        {
            case 'strict_chrono':
                return t('settings.feed.desc_strict_chrono');
            case 'friends_first':
                return t('settings.feed.desc_friends_first');
            case 'chrono':
            default:
                return t('settings.feed.desc_chrono');
        }
    };

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>{t('action.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending || isLoading}>
                {mutation.isPending ? t('action.saving') : t('action.save')}
            </Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('settings.feed.title')} sizeClass="modal-md" footer={footerButtons}>
            {isLoading ? (
                <div className="flex justify-center p-[20px]"><span className="tetrone-loader"></span></div>
            ) : (
                <div className="flex flex-col gap-[15px]">

                    {/* Info Box */}
                    <div className="bg-[rgba(128,128,128,0.05)] border border-border p-[10px] flex gap-[12px] items-start">
                        <div className="text-theme-link mt-[2px] shrink-0"><InfoIcon width={20} height={20}/></div>
                        <div>
                            <strong className="text-[11px] text-theme-link block mb-[4px]">{t('settings.feed.philosophy_title')}</strong>
                            <p className="m-0 text-[11px] leading-[1.4] text-text-main">{t('settings.feed.philosophy_text')}</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex flex-col mb-[10px]">
                            <label className="font-bold text-[11px] mb-[4px]">{t('settings.feed.mode')}:</label>
                            <select value={feedMode} onChange={(e) => setFeedMode(e.target.value)} className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] outline-none">
                                <option value="strict_chrono">{t('settings.feed.mode_strict_chrono')}</option>
                                <option value="chrono">{t('settings.feed.mode_chrono')}</option>
                                <option value="friends_first">{t('settings.feed.mode_friends')}</option>
                            </select>
                        </div>

                        {/* Yellow warning box */}
                        <div className="bg-[rgba(255,204,0,0.1)] border border-[#e5a43b] p-[8px] text-[11px] text-text-main mb-[15px]">
                            {getModeDescription()}
                        </div>

                        <div className="flex flex-col">
                            <label className="font-bold text-[11px] mb-[4px]">{t('settings.feed.engagement_weight')}: <span className="text-text-muted font-normal">({engagementWeight})</span></label>
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={engagementWeight}
                                onChange={(e) => setEngagementWeight(e.target.value)}
                                className="w-full accent-theme-link"
                                disabled={feedMode === 'strict_chrono'}
                            />
                        </div>
                    </div>

                    <div className="border-b border-border my-[5px]"></div>

                    <div>
                        <label className="block font-bold text-theme-link border-b border-border pb-[5px] mb-[10px] text-[12px]">
                            {t('settings.feed.rules_title')}
                        </label>

                        <div className="flex gap-[6px] mb-[10px] items-center">
                            <select value={newRuleType} onChange={(e) => setNewRuleType(e.target.value)} className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] outline-none">
                                <option value="word">{t('settings.feed.rule_type_word')}</option>
                                <option value="tag">{t('settings.feed.rule_type_tag')}</option>
                            </select>
                            <input
                                type="text"
                                value={newRuleText}
                                onChange={(e) => setNewRuleText(e.target.value)}
                                placeholder={t('settings.feed.rule_text_placeholder')}
                                className="flex-1 bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                            />
                            <select value={newRuleWeight} onChange={(e) => setNewRuleWeight(e.target.value)} className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] outline-none">
                                <option value={0}>{t('settings.feed.weight_hide')}</option>
                                <option value={0.5}>{t('settings.feed.weight_reduce')}</option>
                                <option value={2}>{t('settings.feed.weight_boost')}</option>
                            </select>
                            <Button type="button" onClick={handleAddRule} disabled={!newRuleText.trim()}>{t('action.add')}</Button>
                        </div>

                        <div className="bg-input-bg border border-input-border h-[160px] overflow-y-auto">
                            {rules.map(rule => (
                                <div key={rule.id} className="flex justify-between items-center py-[6px] px-[10px] border-b border-border last:border-b-0 hover:bg-[rgba(128,128,128,0.1)]">
                                    <div className="text-[11px]">
                                        <span className="font-bold text-theme-link mr-[5px]">
                                            {rule.type === 'tag' ? '#' : ''}{rule.text}
                                        </span>
                                        <span className="text-text-muted">
                                            — {rule.weight === 0 && t('settings.feed.weight_hide')}
                                            {rule.weight === 0.5 && t('settings.feed.weight_reduce')}
                                            {rule.weight === 2 && t('settings.feed.weight_boost')}
                                        </span>
                                    </div>
                                    <button type="button" className="bg-transparent border-none text-text-muted cursor-pointer p-[2px] flex items-center justify-center hover:text-theme-error" onClick={() => handleRemoveRule(rule.id)}>
                                        <CloseIcon width={12} height={12}/>
                                    </button>
                                </div>
                            ))}
                            {rules.length === 0 && (
                                <div className="p-[20px] text-center text-text-muted italic text-[11px]">{t('settings.feed.no_rules')}</div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </Modal>
    );
}