import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { Link } from 'react-router';
import { SpaceContext } from '../../context/SpaceContext';

const SpaceMembersMini = () => {
    const { t } = useTranslation();
    const { space } = useContext(SpaceContext);

    if (!space) return null;

    const previewMembers = space.preview_members || [space.owner].filter(Boolean);
    const totalCount = space.members_count || 1;

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[6px_8px] text-[11px] font-bold flex justify-between items-center border-b border-border">
                <span>{t('spaces.blocks_members')}</span>
                <Link to={`/${space.username}?tab=members`} className="font-normal text-theme-link hover:underline">
                    {t('spaces.members_all')}
                </Link>
            </div>

            <div className="p-[10px]">
                <div className="text-text-muted mb-[8px] text-[11px]">
                    {totalCount} {t('spaces.members_count_label')}
                </div>

                <div className="grid grid-cols-6 gap-[5px] mt-[10px] max-md:grid-cols-4">
                    {previewMembers.map((member) => (
                        <Link
                            key={member.username}
                            to={`/${member.username}`}
                            className="flex flex-col items-center text-center cursor-pointer group no-underline"
                        >
                            <img
                                src={member.avatar}
                                alt={member.username}
                                className="w-full aspect-square object-cover mb-[4px] border border-border"
                            />
                            <span className="text-[10px] text-theme-link whitespace-nowrap overflow-hidden text-ellipsis max-w-full group-hover:underline">
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