import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '../ui/Avatar';
import Modal from './Modal.jsx';

export default function OnlineUsersModal({ isOpen, onClose, users }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('admin.dashboard.users_online')}
            sizeClass="modal-md"
        >
            {users.length === 0 ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">
                    {t('admin.dashboard.no_one_online')}
                </div>
            ) : (
                <div className="flex flex-col">
                    {users.map(user => {
                        const nameColor = user.personalization?.username_color;

                        return (
                            <Link
                                key={user.id}
                                to={`/${user.username}`}
                                className="flex items-center py-[10px] gap-[15px] border-b border-border last:border-b-0 no-underline transition-colors hover:bg-bg-page"
                                onClick={onClose}
                            >
                                <Avatar
                                    user={user}
                                    className="w-[40px] h-[40px] object-cover border border-border"
                                />

                                <div className="flex-1 flex flex-col">
                                    <span
                                        className="text-[12px] font-bold text-text-main"
                                        style={nameColor ? { color: nameColor } : undefined}
                                    >
                                        {user.first_name} {user.last_name}
                                    </span>
                                    <span className="text-[11px] text-text-muted mt-[2px]">
                                        @{user.username}
                                    </span>
                                </div>

                                <div className="w-[10px] h-[10px] bg-theme-success shadow-[0_0_4px_var(--theme-success)]"></div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}