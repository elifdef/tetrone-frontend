import { useTranslation } from 'react-i18next';
import {
    BugIcon, UserIcon, LockIcon, DocumentIcon,
    UsersIcon, ShieldAlertIcon, QuestionIcon
} from '../../ui/Icons';
import Button from '../../ui/Button';
import { APP_NAME } from '../../../config.js';

export default function SupportHome({ navigateTo }) {
    const { t } = useTranslation();

    const categories = [
        { id: 'bug_report', icon: <BugIcon width={26} height={26} />, titleKey: 'support.cat_bug_report', descKey: 'support.cat_desc_bug' },
        { id: 'account_issue', icon: <UserIcon width={26} height={26} />, titleKey: 'support.cat_account_issue', descKey: 'support.cat_desc_account' },
        { id: 'privacy_safety', icon: <LockIcon width={26} height={26} />, titleKey: 'support.cat_privacy_safety', descKey: 'support.cat_desc_privacy' },
        { id: 'content_issue', icon: <DocumentIcon width={26} height={26} />, titleKey: 'support.cat_content_issue', descKey: 'support.cat_desc_content' },
        { id: 'spaces', icon: <UsersIcon width={26} height={26} />, titleKey: 'support.cat_spaces', descKey: 'support.cat_desc_spaces' },
        { id: 'appeal', icon: <ShieldAlertIcon width={26} height={26} />, titleKey: 'support.cat_appeal', descKey: 'support.cat_desc_appeal' },
        { id: 'general', icon: <QuestionIcon width={26} height={26} />, titleKey: 'support.cat_general', descKey: 'support.cat_desc_general' }
    ];

    return (
        <div>
            {/* Дружній вітальний блок */}
            <div className="bg-[rgba(91,155,213,0.05)] border-l-[3px] border-theme-link p-[20px] mb-[25px] flex flex-col gap-[15px]">
                <div>
                    <h1 className="m-0 text-[16px] font-bold text-theme-link mb-[8px]">
                        {t('support.welcome_title', { name: APP_NAME })}
                    </h1>
                    <p className="m-0 leading-[1.5] text-text-main text-[11px]">
                        {t('support.welcome_desc')}
                    </p>
                </div>

                <div className="flex gap-[10px] mt-[5px]">
                    <Button variant="primary" onClick={() => navigateTo('form')}>
                        {t('support.create_ticket')}
                    </Button>
                    <Button variant="secondary" onClick={() => navigateTo('tickets')}>
                        {t('support.tab_my_tickets')}
                    </Button>
                </div>
            </div>

            {/* Сітка категорій з описами */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        className="group bg-[rgba(128,128,128,0.02)] border border-border p-[15px] flex flex-col items-center justify-start gap-[8px] cursor-pointer hover:bg-[rgba(91,155,213,0.02)] hover:border-theme-link transition-all text-center h-full"
                        onClick={() => navigateTo('category', { cat: cat.id })}
                    >
                        <div className="text-text-muted group-hover:text-theme-link transition-colors mb-[5px]">
                            {cat.icon}
                        </div>
                        <div className="text-[11px] font-bold text-theme-link leading-[1.2]">
                            {t(cat.titleKey)}
                        </div>
                        <div className="text-[10px] text-text-muted leading-[1.3] mt-[auto]">
                            {t(cat.descKey)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}