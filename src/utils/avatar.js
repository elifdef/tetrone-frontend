export const avatar = (user) => {

    if (!user) return './default.jpg';
    
    // акаунт видалено
    if (user.is_deleted) return './deleted.jpg';

    // акаунт заблоковано
    if (user.is_banned) return './blocked.jpg';

    // URL від бекенда
    if (user.avatar) return user.avatar;

    // дефолтна
    return '/default.jpg';

};