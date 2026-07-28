import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const SpaceListItem = ({ space, onLeave }) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);

    return (
        <div className="space-list-item">
            <Link to={`/${space.username}`}>
                <img
                    src={space.avatar_url}
                    alt={space.name}
                    className="space-list-avatar"
                />
            </Link>

            <div className="space-list-info">
                <div className="space-list-info-row">
                    <Link to={`/${space.username}`} className="space-header-link-right">
                        {space.name}
                    </Link>
                </div>
                <div className="space-list-info-row">
                    <span>{t(`spaces.privacy_${space.privacy_type}`)}</span>
                </div>
                <div className="space-list-info-row">
                    <Link to={`/${space.username}?tab=members`} className="space-header-link-right">{t('entities.member', { count: space.members_count })}</Link>
                </div>
            </div>

            <div className="space-list-actions">
                <Link className="space-action-item" to={`/${space.username}`}>
                    {t('spaces.visit')}
                </Link>
                {user.id === space.owner_id && (
                    <Link className="space-action-item" to={`/${space.username}?tab=settings`}>
                        {t('spaces.settings')}
                    </Link>
                )}
                {user.id !== space.owner_id && (
                    <button className="space-action-item" onClick={() => onLeave(space.id)}>
                        {t('spaces.leave')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SpaceListItem;