import { useState, useEffect } from 'react';
import ActivityService from '../../services/activity.service';
import { useTranslation } from 'react-i18next';

export default function ScreenTimeTab() {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ total_active_seconds: 0, history: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        ActivityService.getScreenTime()
        .onSuccess((res) => {
            setStats(res.time || {});
        })
        .onFinally(() => {
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                setStats(prev => {
                    const todayDate = new Date().toISOString().split('T')[0];
                    let isTodayFound = false;

                    const newHistory = prev.history.map(day => {
                        if (day.date === todayDate) {
                            isTodayFound = true;
                            return { ...day, seconds: day.seconds + 1 };
                        }
                        return day;
                    });

                    if (!isTodayFound) {
                        newHistory.unshift({ date: todayDate, seconds: 1 });
                    }

                    return {
                        ...prev,
                        total_active_seconds: prev.total_active_seconds + 1,
                        history: newHistory
                    };
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLoading]);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let result = '';
        if (hours > 0) result += `${hours} ${t('common.hours_short')} `;
        if (minutes > 0 || hours > 0) result += `${minutes} ${t('common.minutes_short')} `;
        result += `${seconds} ${t('common.seconds_short')}`;

        return result.trim();
    };

    if (isLoading) {
        return <div className="p-[20px] text-center text-text-muted text-[11px] italic">{t('common.loading')}</div>;
    }

    return (
        <div className="bg-bg-box border border-border font-tahoma text-[11px] text-text-main rounded-[2px]">
            <div className="bg-input-bg border-b border-border p-[15px] text-center">
                <div className="text-[11px] text-text-muted font-bold uppercase mb-[5px] tracking-wide">
                    {t('activity.stats.total_time')}
                </div>
                <div className="text-[28px] font-bold text-theme-link leading-none mb-[8px]">
                    {formatTime(stats.total_active_seconds)}
                </div>
                <p className="m-0 text-text-muted max-w-[80%] mx-auto leading-[1.4]">
                    {t('activity.stats.description')}
                </p>
            </div>

            <div className="p-[15px]">
                <h4 className="text-[12px] font-bold border-b border-border pb-[5px] m-0 mb-[10px] text-theme-link">
                    {t('activity.stats.history')}
                </h4>

                {stats.history.length === 0 ? (
                    <div className="text-center text-text-muted italic py-[10px]">{t('activity.stats.empty')}</div>
                ) : (
                    <div className="flex flex-col">
                        {stats.history.map((day, index) => (
                            <div key={index} className="flex justify-between items-center py-[8px] border-b border-dashed border-border last:border-none hover:bg-bg-page transition-colors px-[5px]">
                                <span className="font-bold text-text-muted">{day.date}</span>
                                <span className="text-text-main">{formatTime(day.seconds)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}