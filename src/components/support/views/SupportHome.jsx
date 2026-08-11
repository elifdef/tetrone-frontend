import { useTranslation } from 'react-i18next';
import { InfoIcon, UserIcon, DocumentIcon, SecurityIcon, PollIcon } from '../../ui/Icons';
import Button from '../../ui/Button';

export default function SupportHome({ navigateTo }) {
    const { t } = useTranslation();

    const categories = [
        { id: 'bug_report', icon: <InfoIcon width={24} height={24} />, titleKey: 'support.cat_bug_report' },
        { id: 'account_issue', icon: <UserIcon width={24} height={24} />, titleKey: 'support.cat_account_issue' },
        { id: 'appeal', icon: <SecurityIcon width={24} height={24} />, titleKey: 'support.cat_appeal' },
        { id: 'privacy_safety', icon: <SecurityIcon width={24} height={24} />, titleKey: 'support.cat_privacy_safety' },
        { id: 'content_issue', icon: <DocumentIcon width={24} height={24} />, titleKey: 'support.cat_content_issue' },
        { id: 'general', icon: <PollIcon width={24} height={24} />, titleKey: 'support.cat_general' }
    ];

    return (
        <>
            <div className="tetrone-support-welcome">
                <h1>{t('support.welcome_title', { name: 'Tetrone' })}</h1>
                <p>{t('support.welcome_desc')}</p>
                <div className="tetrone-support-welcome-actions">
                    <Button variant="primary" onClick={() => navigateTo('form')}>
                        {t('support.create_ticket')}
                    </Button>
                    <Button variant="secondary" onClick={() => navigateTo('tickets')}>
                        {t('support.tab_my_tickets')}
                    </Button>
                </div>
            </div>

            <div className="tetrone-support-grid">
                {categories.map(cat => (
                    <div key={cat.id} className="tetrone-support-cat-card" onClick={() => navigateTo('category', { cat: cat.id })}>
                        <div className="tetrone-support-icon">{cat.icon}</div>
                        <div className="tetrone-support-cat-title">{t(cat.titleKey)}</div>
                    </div>
                ))}
            </div>
        </>
    );
}