import { useEffect } from 'react';
import fetchClient from '../api/client';
import type { UserData } from '@/types/user';

export const useScreenTime = (currentUser: UserData | null | undefined): void => {
    useEffect(() => {
        if (!currentUser) return;

        const tickInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                let current = parseInt(localStorage.getItem('tetrone_pending_time') || '0', 10);

                if (Number.isNaN(current) || current < 0) current = 0;
                if (current > 120) current = 120;

                localStorage.setItem('tetrone_pending_time', String(current + 1));
            }
        }, 1000);

        const syncInterval = setInterval(() => {
            const pending = parseInt(localStorage.getItem('tetrone_pending_time') || '0', 10);

            if (Number.isNaN(pending) || pending <= 0) {
                localStorage.setItem('tetrone_pending_time', '0');
                return;
            }

            const secsToSend = Math.min(pending, 120);

            fetchClient('/activity/screen-time/sync', {
                method: 'POST',
                body: { seconds: secsToSend },
                silentAuth: true,
            }).then((res) => {
                if (res && !res.code?.startsWith('ERR_')) {
                    let currentNow = parseInt(localStorage.getItem('tetrone_pending_time') || '0', 10);
                    if (Number.isNaN(currentNow)) currentNow = 0;

                    localStorage.setItem('tetrone_pending_time', String(Math.max(0, currentNow - secsToSend)));
                }
            });
        }, 60000);

        return () => {
            clearInterval(tickInterval);
            clearInterval(syncInterval);
        };
    }, [currentUser]);
};