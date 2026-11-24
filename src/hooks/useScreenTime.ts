import { useEffect } from 'react';
import ActivityService from '@/services/activity.service';
import type { UserData } from '@/types/user';

const STORAGE_KEY = 'tetrone_pending_time';
const MAX_PENDING_SECONDS = 120;

export const useScreenTime = (currentUser: UserData | null | undefined): void => {
    useEffect(() => {
        if (!currentUser) return;

        const tickInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                let current = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

                if (Number.isNaN(current) || current < 0) current = 0;
                if (current > MAX_PENDING_SECONDS) current = MAX_PENDING_SECONDS;

                localStorage.setItem(STORAGE_KEY, String(current + 1));
            }
        }, 1000);

        const syncInterval = setInterval(() => {
            const pending = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

            if (Number.isNaN(pending) || pending <= 0) {
                localStorage.setItem(STORAGE_KEY, '0');
                return;
            }

            const secsToSend = Math.min(pending, MAX_PENDING_SECONDS);

            void ActivityService.syncScreenTime(secsToSend).then((res) => {
                if (res && !res.code?.startsWith('ERR_')) {
                    let currentNow = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
                    if (Number.isNaN(currentNow)) currentNow = 0;

                    localStorage.setItem(
                        STORAGE_KEY,
                        String(Math.max(0, currentNow - secsToSend))
                    );
                }
            });
        }, 60000);

        return () => {
            clearInterval(tickInterval);
            clearInterval(syncInterval);
        };
    }, [currentUser]);
};