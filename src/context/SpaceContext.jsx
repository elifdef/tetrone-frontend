import { createContext, useState } from 'react';

export const SpaceContext = createContext();

export const SpaceProvider = ({ children, initialSpace }) => {
    const [space, setSpace] = useState(initialSpace);

    // Функція для точкового оновлення даних простору (наприклад, зміни статусу підписки)
    const updateSpace = (updates) => {
        setSpace(prev => ({ ...prev, ...updates }));
    };

    // Визначаємо, чи є поточний юзер адміном/модератором
    const isAdmin = space && ['owner', 'admin', 'moderator'].includes(space.member_role);
    const isOwner = space && space.member_role === 'owner';

    return (
        <SpaceContext.Provider value={{ space, updateSpace, isAdmin, isOwner }}>
            {children}
        </SpaceContext.Provider>
    );
};