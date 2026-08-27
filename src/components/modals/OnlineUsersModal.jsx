import {useTranslation} from 'react-i18next';
import {Link} from 'react-router';
import Avatar from '../ui/Avatar';
import Modal from './Modal.jsx';

export default function OnlineUsersModal({isOpen, onClose, users})
{
    const {t} = useTranslation();

    if (!isOpen)
    {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('admin.dashboard.users_online')}
            sizeClass="modal-md"
        >
            {users.length === 0 ? (
                <div className="tetrone-empty-state">
                    {t('admin.dashboard.no_one_online')}
                </div>
            ) : (
                <div className="tetrone-admin-online-modal-list">
                    {users.map(user =>
                    {
                        const nameColor = user.personalization?.username_color;

                        return (
                            <Link
                                key={user.id}
                                to={`/${user.username}`}
                                className="tetrone-admin-online-modal-item"
                                onClick={onClose}
                            >
                                <Avatar user={user} className="tetrone-admin-online-modal-avatar"/>

                                <div className="tetrone-admin-online-modal-details">
                                    <span
                                        className="tetrone-admin-online-modal-name"
                                        style={nameColor ? {color: nameColor} : undefined}
                                    >
                                        {user.first_name} {user.last_name}
                                    </span>
                                    <span className="tetrone-admin-online-modal-nick">
                                        @{user.username}
                                    </span>
                                </div>

                                <div className="tetrone-admin-online-modal-indicator"></div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}