import { useEffect } from 'react';
import fetchClient from '../api/client';

export const useScreenTime = (currentUser) => {
    useEffect(() => {
        if (!currentUser) return;

        // 1. Локальний трекер
        const tickInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                let current = parseInt(localStorage.getItem('tetrone_pending_time') || '0', 10);

                // Захист: якщо там NaN або мінус
                if (isNaN(current) || current < 0) current = 0;

                // Захист від накрутки: навіть якщо хакер накрутив, ми локально не даємо накопичити більше 120с
                if (current > 120) current = 120;

                localStorage.setItem('tetrone_pending_time', current + 1);
            }
        }, 1000);

        // 2. Синхронізація (раз на 60 секунд)
        const syncInterval = setInterval(() => {
            let pending = parseInt(localStorage.getItem('tetrone_pending_time') || '0', 10);

            if (isNaN(pending) || pending <= 0) {
                localStorage.setItem('tetrone_pending_time', '0');
                return;
            }

            // Жорсткий ліміт для відправки (максимум 120с за один раз)
            const secsToSend = Math.min(pending, 120);

            fetchClient('/activity/screen-time/sync', {
                method: 'POST',
                body: { seconds: secsToSend },
                silentAuth: true
            }).then(res => {
                if (res && !res.code?.startsWith('ERR_')) {
                    let currentNow = parseInt(localStorage.getItem('tetrone_pending_time') || '0', 10);
                    if (isNaN(currentNow)) currentNow = 0;

                    // Віднімаємо тільки те, що реально відправили
                    localStorage.setItem('tetrone_pending_time', Math.max(0, currentNow - secsToSend));
                }
            });
        }, 60000);

        return () => {
            clearInterval(tickInterval);
            clearInterval(syncInterval);
        };
    }, [currentUser]);
};