import { useTranslation } from 'react-i18next';

const SpaceMembersMini = ({ space }) => {
    const { t } = useTranslation();

    // ЗАГЛУШКА: Поки бекенд не віддає preview_members, використовуємо owner для тесту
    const previewMembers = space.preview_members || [space.owner].filter(Boolean);
    const totalCount = space.members_count || 1;

    return (
        <div className="space-block">
            <div className="space-block-header">
                <span>{t('spaces.blocks_members')}</span>
                <span className="space-header-link-right">{t('spaces.members_all')}</span>
            </div>
            <div className="space-block-content">
                <div className="space-members-count">
                    {totalCount} {t('spaces.members_count_label')}
                </div>
                <div className="space-members-grid">
                    {previewMembers.map((member) => (
                        <div key={member.id} className="space-member-mini">
                            <img src={member.avatar} alt={member.username} />
                            <span>{member.first_name || member.username}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SpaceMembersMini;