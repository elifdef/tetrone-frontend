import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SpaceRightSidebar from '../components/spaces/SpaceRightSidebar';
import SpaceHeaderInfo from '../components/spaces/SpaceHeaderInfo';
import SpaceMembersMini from '../components/spaces/SpaceMembersMini';
import SpaceWall from '../components/spaces/SpaceWall';

const SpacePage = ({ initialSpaceData }) => {
    const { t } = useTranslation();

    // Робимо дані про групу реактивними
    const [spaceData, setSpaceData] = useState(initialSpaceData);

    // Визначаємо, чи має поточний юзер права адміна
    const isAdmin = ['owner', 'admin', 'moderator'].includes(spaceData.member_role);

    // Обробник: коли юзер тисне "Вступити" або "Вийти" у правому меню
    const handleMembershipChange = (isMemberStatus) => {
        setSpaceData(prev => ({
            ...prev,
            is_member: isMemberStatus,
            // Візуально збільшуємо/зменшуємо лічильник учасників
            members_count: isMemberStatus ? prev.members_count + 1 : prev.members_count - 1
        }));
    };

    return (
        <div className="space-page-container">
            {/* ЛІВА КОЛОНКА (Основна) */}
            <main className="space-main">

                {/* 1. Жовтий статус-блок */}
                <div className="space-status-board">
                    {spaceData.name}
                </div>

                {/* 2. Інформація */}
                <SpaceHeaderInfo space={spaceData} />

                {/* 3. Учасники (Сітка) */}
                <SpaceMembersMini space={spaceData} />

                {/* 4. Стіна (Форма створення + Вічний скрол) */}
                <div className="space-block">
                    <div className="space-block-header">
                        <span>{t('spaces.blocks_wall')}</span>
                    </div>
                    <SpaceWall space={spaceData} />
                </div>

            </main>

            {/* ПРАВА КОЛОНКА (Сайдбар) */}
            <aside className="space-sidebar">
                <SpaceRightSidebar
                    space={spaceData}
                    isAdmin={isAdmin}
                    onMembershipChange={handleMembershipChange}
                />
            </aside>
        </div>
    );
};

export default SpacePage;