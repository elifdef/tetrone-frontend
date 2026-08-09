import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '../ui/Avatar';
import GlobalModal from './GlobalModal'; // Вкажи правильний шлях до твого файлу

export default function OnlineUsersModal({ isOpen, onClose, users }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <GlobalModal
            isOpen={isOpen}
            onClose={onClose}
            onResolve={onClose} // Для закриття через Escape
            type="custom"
        >
            {/* Відмальовуємо стандартну структуру модалки всередині custom */}
            <div className="tetrone-modal-dialog modal-md">
                <div className="tetrone-modal-header">
                    <h3>{t('admin.dashboard.users_online')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {users.length === 0 ? (
                        <div className="tetrone-empty-state">
                            {t('admin.dashboard.no_one_online')}
                        </div>
                    ) : (
                        <div className="admin-online-list full-list">
                            {users.map(user => {
                                const nameColor = user.personalization?.username_color;

                                return (
                                    <Link
                                        key={user.id}
                                        to={`/${user.username}`}
                                        className="admin-online-user"
                                        onClick={onClose}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px 0',
                                            gap: '15px',
                                            borderBottom: '1px solid var(--theme-border)',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <Avatar user={user} className="admin-online-avatar" />

                                        <div className="admin-online-details" style={{ flex: 1 }}>
                                            <span
                                                className="admin-online-name"
                                                style={nameColor ? { color: nameColor, fontWeight: 'bold' } : { fontWeight: 'bold', color: 'var(--theme-text)' }}
                                            >
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <span
                                                className="admin-online-nick"
                                                style={{ display: 'block', fontSize: '13px', color: 'var(--theme-text-muted)' }}
                                            >
                                                @{user.username}
                                            </span>
                                        </div>

                                        <div
                                            className="admin-online-indicator"
                                            style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--theme-success)'
                                            }}
                                        ></div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </GlobalModal>
    );
}