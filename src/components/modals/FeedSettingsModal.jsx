import {useState, useEffect} from "react";
import {useTranslation} from "react-i18next";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

import SettingsService from "../../services/settings.service";
import GlobalModal from "./GlobalModal";
import Button from "../ui/Button";
import {CloseIcon, InfoIcon} from "../ui/icons";

export default function FeedSettingsModal({isOpen, onClose}) {
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
        queryFn: SettingsService.getFeedPreferences,
        enabled: isOpen,
    });

    useEffect(() => {
        if (preferences && Object.keys(preferences).length > 0) {
            setFeedMode(preferences.feed_mode || 'chrono');
            setEngagementWeight(preferences.engagement_weight ?? 0.5);

            const loadedRules = [];
            let idCounter = 1;

            const processRules = (rulesData, type) => {
                if (rulesData && typeof rulesData === 'object' && !Array.isArray(rulesData)) {
                    Object.entries(rulesData).forEach(([text, weight]) => {
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
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['settings', 'feed']});
            queryClient.invalidateQueries({queryKey: ['feed']});
            onClose();
        }
    });

    const handleAddRule = () => {
        if (!newRuleText.trim()) return;
        const cleanText = newRuleText.trim().replace(/^#/, '');

        setRules([...rules, {
            id: Date.now(),
            type: newRuleType,
            text: cleanText,
            weight: Number(newRuleWeight)
        }]);
        setNewRuleText('');
    };

    const handleRemoveRule = (idToRemove) => {
        setRules(rules.filter(r => r.id !== idToRemove));
    };

    const handleSubmit = () => {
        const tags_rules = {};
        const words_rules = {};

        rules.forEach(rule => {
            if (rule.type === 'tag') tags_rules[rule.text] = rule.weight;
            if (rule.type === 'word') words_rules[rule.text] = rule.weight;
        });

        mutation.mutate({
            feed_mode: feedMode,
            engagement_weight: parseFloat(engagementWeight),
            tags_rules,
            words_rules,
        });
    };

    const getModeDescription = () => {
        switch (feedMode) {
            case 'strict_chrono':
                return t('settings.feed.desc_strict_chrono');
            case 'friends_first':
                return t('settings.feed.desc_friends_first');
            case 'chrono':
            default:
                return t('settings.feed.desc_chrono');
        }
    };

    return (
        <GlobalModal isOpen={isOpen} onClose={onClose} onResolve={() => {
        }} type="custom">
            <div className="tetrone-modal-dialog tetrone-feed-settings-dialog">
                <div className="tetrone-modal-header">
                    <h3>{t('settings.feed.title')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body">
                    {isLoading ? (
                        <div className="tetrone-loader-wrapper"><span className="tetrone-loader"></span></div>
                    ) : (
                        <div className="tetrone-feed-settings-form">

                            <div className="tetrone-info-box">
                                <div className="tetrone-info-box-icon">
                                    <InfoIcon width={20} height={20}/>
                                </div>
                                <div className="tetrone-info-box-content">
                                    <strong>{t('settings.feed.philosophy_title')}</strong>
                                    <p>{t('settings.feed.philosophy_text')}</p>
                                </div>
                            </div>

                            <div className="tetrone-settings-section">
                                <div className="tetrone-form-group">
                                    <label>{t('settings.feed.mode')}:</label>
                                    <select value={feedMode} onChange={(e) => setFeedMode(e.target.value)}
                                            className="tetrone-classic-input">
                                        <option value="strict_chrono">{t('settings.feed.mode_strict_chrono')}</option>
                                        <option value="chrono">{t('settings.feed.mode_chrono')}</option>
                                        <option value="friends_first">{t('settings.feed.mode_friends')}</option>
                                    </select>
                                </div>

                                <div className="tetrone-mode-description">
                                    {getModeDescription()}
                                </div>

                                <div className="tetrone-form-group tetrone-mt-15">
                                    <label>{t('settings.feed.engagement_weight')}: <span
                                        className="tetrone-hint">({engagementWeight})</span></label>
                                    <input
                                        type="range" min="0" max="1" step="0.1"
                                        value={engagementWeight}
                                        onChange={(e) => setEngagementWeight(e.target.value)}
                                        className="tetrone-classic-range"
                                        disabled={feedMode === 'strict_chrono'}
                                        title={feedMode === 'strict_chrono' ? t('settings.feed.weight_disabled_hint') : ''}
                                    />
                                </div>
                            </div>

                            <div className="tetrone-classic-divider"></div>

                            <div className="tetrone-settings-section">
                                <label className="tetrone-section-title">{t('settings.feed.rules_title')}</label>

                                <div className="tetrone-rule-builder">
                                    <select value={newRuleType} onChange={(e) => setNewRuleType(e.target.value)}
                                            className="tetrone-classic-input">
                                        <option value="word">{t('settings.feed.rule_type_word')}</option>
                                        <option value="tag">{t('settings.feed.rule_type_tag')}</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={newRuleText}
                                        onChange={(e) => setNewRuleText(e.target.value)}
                                        placeholder={t('settings.feed.rule_text_placeholder')}
                                        className="tetrone-classic-input tetrone-rule-text-input"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                    />
                                    <select value={newRuleWeight} onChange={(e) => setNewRuleWeight(e.target.value)}
                                            className="tetrone-classic-input">
                                        <option value={0}>{t('settings.feed.weight_hide')}</option>
                                        <option value={0.5}>{t('settings.feed.weight_reduce')}</option>
                                        <option value={2}>{t('settings.feed.weight_boost')}</option>
                                    </select>
                                    <Button type="button" onClick={handleAddRule} disabled={!newRuleText.trim()}>
                                        {t('action.add')}
                                    </Button>
                                </div>

                                <div className="tetrone-rules-list">
                                    {rules.map(rule => (
                                        <div key={rule.id} className="tetrone-rule-item">
                                            <div className="tetrone-rule-info">
                                                <span className="tetrone-rule-badge">
                                                    {rule.type === 'tag' ? '#' : ''}{rule.text}
                                                </span>
                                                <span className="tetrone-rule-status">
                                                    — {rule.weight === 0 && t('settings.feed.weight_hide')}
                                                    {rule.weight === 0.5 && t('settings.feed.weight_reduce')}
                                                    {rule.weight === 2 && t('settings.feed.weight_boost')}
                                                </span>
                                            </div>
                                            <button type="button" className="tetrone-rule-delete-btn"
                                                    onClick={() => handleRemoveRule(rule.id)}>
                                                <CloseIcon width={12} height={12}/>
                                            </button>
                                        </div>
                                    ))}
                                    {rules.length === 0 && (
                                        <div className="tetrone-rules-empty">{t('settings.feed.no_rules')}</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                <div className="tetrone-modal-footer tetrone-classic-footer">
                    <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                        {t('action.cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending || isLoading}>
                        {mutation.isPending ? t('action.saving') : t('action.save')}
                    </Button>
                </div>
            </div>
        </GlobalModal>
    );
}