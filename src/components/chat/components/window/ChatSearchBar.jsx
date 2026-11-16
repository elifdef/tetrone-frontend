import { useTranslation } from 'react-i18next';
import Button from '../../../ui/Button';
import { CloseSvg } from '../../../ui/Icons.jsx';

export default function ChatSearchBar({
    isOpen,
    query,
    onChange,
    onClose
}) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="flex items-center gap-[6px] px-[12px] py-[6px] bg-header-bg border-b border-border">
            <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('chat.actions.search_placeholder')}
                className="flex-1 px-[8px] py-[4px] text-[11px] bg-bg-box text-text-main border border-border outline-none focus:border-theme-link"
            />
            <Button variant="secondary" onClick={onClose}>
                <CloseSvg size={11} />
            </Button>
        </div>
    );
}