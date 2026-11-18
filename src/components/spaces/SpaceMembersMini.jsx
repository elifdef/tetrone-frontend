// src/components/spaces/SpaceMembersMini.jsx
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { Link } from 'react-router';
import { SpaceContext } from '../../context/SpaceContext';

const SpaceMembersMini = () => {
    const { t } = useTranslation();
    const { space } = useContext(SpaceContext);

    if (!space) return null;

    const previewMembers = space.preview_members || [space.owner].filter(Boolean);
    const totalCount = space.members_count ?? previewMembers.length;

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[4px_8px] text-[11px] font-bold flex justify-between items-center border-b border-border border-t-[2px] border-t-theme-link">
                <span>{t('spaces.blocks_members')}</span>
                <Link to={`/${space.username}?tab=members`} className="font-normal text-theme-link hover:underline">
                    {t('spaces.members_all')}
                </Link>
            </div>

            <div className="bg-bg-page border-b border-border px-[8px] py-[3px] text-[10px] text-text-muted">
                {t('entities.member', { count: totalCount })}
            </div>

            <div className="p-[8px]">
                <div className="grid grid-cols-6 gap-[8px] max-md:grid-cols-3">
                    {previewMembers.map((member) => (
                        <Link
                            key={member.username}
                            to={`/${member.username}`}
                            className="flex flex-col items-center text-center group no-underline"
                        >
                            <img
                                src={member.avatar}
                                alt={member.username}
                                className="w-[50px] h-[50px] object-cover mb-[3px] border border-border"
                            />
                            <span className="text-[10px] text-theme-link truncate max-w-full group-hover:underline">
                                {member.first_name || member.username}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SpaceMembersMini;