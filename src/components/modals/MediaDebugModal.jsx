import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { useSocket } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { notifySuccess } from '../common/Notify';
import { isTetroneDebugEnabled } from '../../utils/debug';

function resolveClientTier(user, metaTier) {
    if (metaTier === 'creator' || metaTier === 'admin' || metaTier === 'user') {
        return metaTier;
    }
    const role = user?.role;
    if (!role) return 'user';
    const roleStr = String(role).toLowerCase();
    if (['creator', 'owner', 'superadmin', 'super_admin', 'developer', '4'].includes(roleStr)) {
        return 'creator';
    }
    if (['admin', 'administrator', 'moderator', '2', '3'].includes(roleStr)) {
        return 'admin';
    }
    return 'user';
}

export default function MediaDebugModal() {
    const { t } = useTranslation();
    const socketContext = useSocket();
    const socket = socketContext?.socket;
    const auth = useContext(AuthContext);
    const currentUser = auth?.user || null;

    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [nowTs, setNowTs] = useState(() => Date.now());
    const trackedIdsRef = useRef(new Set());

    useEffect(() => {
        if (!isOpen) return undefined;
        const hasProcessing = items.some((item) => item.status === 'processing');
        if (!hasProcessing) return undefined;

        const timer = setInterval(() => setNowTs(Date.now()), 200);
        return () => clearInterval(timer);
    }, [isOpen, items]);

    useEffect(() => {
        const handleOpenSingle = (event) => {
            const att = event.detail;
            if (!att) return;
            if (att.id) {
                trackedIdsRef.current.add(att.id);
            }
            setItems([att]);
            setActiveIndex(0);
            setNowTs(Date.now());
            setIsOpen(true);
        };

        window.addEventListener('tetrone:media-debug-open', handleOpenSingle);
        return () => window.removeEventListener('tetrone:media-debug-open', handleOpenSingle);
    }, []);

    useEffect(() => {
        const handleBatch = (event) => {
            if (!isTetroneDebugEnabled()) return;
            const list = event.detail || [];
            if (list.length === 0) return;

            const startedAt = Date.now();
            const enriched = list.map((att) => {
                trackedIdsRef.current.add(att.id);
                return {
                    ...att,
                    _clientStartedAt: startedAt,
                };
            });

            setItems(enriched);
            setActiveIndex(0);
            setNowTs(startedAt);
            setIsOpen(true);
        };

        window.addEventListener('tetrone:media-debug-batch', handleBatch);
        return () => window.removeEventListener('tetrone:media-debug-batch', handleBatch);
    }, []);

    useEffect(() => {
        if (!socket) return undefined;

        const handleReady = (data) => {
            if (!isTetroneDebugEnabled() || !data?.id) return;

            const inferredType = data.type || (data.meta?.source?.video ? 'video' : 'audio');

            setItems((prev) => {
                const exists = prev.some((item) => item.id === data.id);
                if (exists) {
                    return prev.map((item) =>
                        item.id === data.id
                            ? {
                                  ...item,
                                  status: data.status || 'ready',
                                  file_path: data.file_path ?? item.file_path,
                                  url: data.file_url || item.url,
                                  file_size: data.file_size ?? item.file_size,
                                  meta: data.meta ?? item.meta,
                              }
                            : item
                    );
                }

                if (!data.meta) return prev;

                return [
                    ...prev,
                    {
                        id: data.id,
                        post_id: data.post_id,
                        type: inferredType,
                        status: data.status || 'ready',
                        file_path: data.file_path,
                        url: data.file_url,
                        file_name: data.file_name,
                        original_name: data.original_name,
                        file_size: data.file_size,
                        meta: data.meta,
                    },
                ];
            });

            if (data.meta || trackedIdsRef.current.has(data.id)) {
                trackedIdsRef.current.add(data.id);
                setIsOpen(true);
            }
        };

        socket.on('attachment.ready', handleReady);
        return () => socket.off('attachment.ready', handleReady);
    }, [socket]);

    if (!isOpen || items.length === 0) return null;

    const current = items[activeIndex] || items[0];
    const source = current.meta?.source || {};
    const conversion = current.meta?.conversion || null;
    const tier = resolveClientTier(currentUser, current.meta?.debug_tier);
    const isAdminOrCreator = tier === 'admin' || tier === 'creator';

    const liveElapsed = current.status === 'processing'
        ? ((nowTs - (current._clientStartedAt || nowTs)) / 1000).toFixed(1)
        : conversion?.elapsed_seconds ?? null;

    const handleCopyReport = () => {
        const report = JSON.stringify(
            {
                id: current.id,
                type: current.type,
                status: current.status,
                url: current.url,
                meta: current.meta,
            },
            null,
            2
        );
        navigator.clipboard?.writeText(report);
        notifySuccess(t('debug.copied'));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title={t('debug.modal_title', { id: current.id })}
            sizeClass="modal-lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] text-text-muted">
                        localStorage.tetrone_debug = &quot;{localStorage.getItem('tetrone_debug')}&quot;
                    </span>
                    <div className="flex items-center gap-[8px]">
                        <button
                            type="button"
                            onClick={handleCopyReport}
                            className="px-[10px] py-[4px] bg-bg-input border border-border text-text-main hover:border-theme-brand cursor-pointer"
                        >
                            {t('debug.copy_json')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-[12px] py-[4px] bg-theme-brand text-white border border-theme-brand cursor-pointer font-bold"
                        >
                            {t('action.close')}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-[10px] text-[11px] font-tahoma">
                {items.length > 1 && (
                    <div className="flex flex-wrap gap-[4px] border-b border-border pb-[8px]">
                        {items.map((item, idx) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveIndex(idx)}
                                className={`px-[8px] py-[4px] border cursor-pointer ${
                                    idx === activeIndex
                                        ? 'bg-theme-brand text-white border-theme-brand font-bold'
                                        : 'bg-bg-page text-text-main border-border hover:border-theme-brand'
                                }`}
                            >
                                #{idx + 1} [{item.type.toUpperCase()}] {item.original_name || item.file_name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between bg-bg-page border border-border p-[8px]">
                    <div className="flex items-center gap-[8px]">
                        <span className="font-bold uppercase px-[6px] py-[2px] border border-border bg-bg-box">
                            {current.type}
                        </span>
                        <span className="font-bold text-text-main break-all">
                            {source.original_name || current.original_name || current.file_name}
                        </span>
                    </div>
                    <div>
                        {current.status === 'processing' && (
                            <span className="text-theme-brand font-bold">
                                {isAdminOrCreator
                                    ? t('debug.status_processing', { seconds: liveElapsed })
                                    : 'Processing...'}
                            </span>
                        )}
                        {current.status === 'ready' && (
                            <span className="text-green-500 font-bold">
                                {isAdminOrCreator && liveElapsed !== null
                                    ? t('debug.status_ready_timed', { seconds: liveElapsed })
                                    : t('debug.status_ready')}
                            </span>
                        )}
                        {current.status === 'failed' && (
                            <span className="text-theme-error font-bold">{t('debug.status_failed')}</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-[10px]">
                    <div className="border border-border bg-bg-page p-[8px] flex flex-col gap-[4px]">
                        <div className="font-bold border-b border-border pb-[4px] mb-[2px] text-text-main">
                            {t('debug.section_source')}
                        </div>
                        <div><span className="text-text-muted">{t('debug.size')}</span> <b>{source.size_human || '—'}</b> ({source.size_bytes ?? 0} B)</div>
                        <div><span className="text-text-muted">{t('debug.format')}</span> <b>{source.format || '—'}</b></div>
                        <div><span className="text-text-muted">{t('debug.mime')}</span> {source.mime_type || '—'}</div>
                        {(source.resolution || source.video?.resolution) && (
                            <div><span className="text-text-muted">{t('debug.resolution')}</span> <b>{source.resolution || source.video?.resolution}</b></div>
                        )}
                        {source.duration_sec !== null && source.duration_sec !== undefined && (
                            <div><span className="text-text-muted">{t('debug.duration')}</span> {source.duration_sec} {t('debug.seconds_unit')}</div>
                        )}
                        {source.bitrate_kbps && (
                            <div><span className="text-text-muted">{t('debug.bitrate')}</span> {source.bitrate_kbps} kbps</div>
                        )}
                        {source.video && (
                            <div className="mt-[4px] pt-[4px] border-t border-dashed border-border">
                                <div className="text-text-muted">{t('debug.video_stream')}</div>
                                <div className="font-bold">
                                    {source.video.codec}
                                    {source.video.profile ? ` (${source.video.profile})` : ''}
                                    {source.video.fps ? ` • ${source.video.fps} fps` : ''}
                                    {source.video.pix_fmt ? ` • ${source.video.pix_fmt}` : ''}
                                </div>
                            </div>
                        )}
                        {source.audio && (
                            <div className="mt-[4px] pt-[4px] border-t border-dashed border-border">
                                <div className="text-text-muted">{t('debug.audio_stream')}</div>
                                <div className="font-bold">
                                    {source.audio.codec}
                                    {source.audio.sample_rate ? ` • ${source.audio.sample_rate} Hz` : ''}
                                    {source.audio.channels ? ` • ${source.audio.channels} ch` : ''}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border border-border bg-bg-page p-[8px] flex flex-col gap-[4px]">
                        <div className="font-bold border-b border-border pb-[4px] mb-[2px] text-text-main">
                            {t('debug.section_result')}
                        </div>
                        {conversion ? (
                            <>
                                <div>
                                    <span className="text-text-muted">{t('debug.profile')}</span>{' '}
                                    <b>{conversion.target_key ? t(conversion.target_key, conversion.target_params || {}) : '—'}</b>
                                </div>
                                <div><span className="text-text-muted">{t('debug.output_format')}</span> <b>{conversion.output_format}</b></div>
                                {conversion.output_res && (
                                    <div><span className="text-text-muted">{t('debug.resolution')}</span> {conversion.output_res}</div>
                                )}
                                <div>
                                    <span className="text-text-muted">{t('debug.new_size')}</span>{' '}
                                    <b>{conversion.output_human}</b> ({conversion.output_bytes} B)
                                </div>
                                <div>
                                    <span className="text-text-muted">{t('debug.size_diff')}</span>{' '}
                                    <b className={conversion.saved_percent >= 0 ? 'text-green-500' : 'text-theme-brand'}>
                                        {conversion.saved_percent >= 0
                                            ? `-${conversion.saved_percent}% (${t('debug.compressed_label')})`
                                            : `+${Math.abs(conversion.saved_percent)}%`}
                                    </b>
                                </div>
                                {conversion.segments_count !== undefined && (
                                    <div><span className="text-text-muted">{t('debug.hls_segments')}</span> <b>{conversion.segments_count}</b></div>
                                )}
                                {isAdminOrCreator && conversion.elapsed_seconds !== undefined && (
                                    <div>
                                        <span className="text-text-muted">{t('debug.conversion_time')}</span>{' '}
                                        <b>{conversion.elapsed_seconds} {t('debug.seconds_unit')}</b>
                                    </div>
                                )}
                                {conversion.output_video && (
                                    <div className="mt-[4px] pt-[4px] border-t border-dashed border-border">
                                        <div className="text-text-muted">{t('debug.video_stream')}</div>
                                        <div className="font-bold">
                                            {conversion.output_video.codec}
                                            {conversion.output_video.profile ? ` (${conversion.output_video.profile})` : ''}
                                            {conversion.output_video.fps ? ` • ${conversion.output_video.fps} fps` : ''}
                                            {conversion.output_video.pix_fmt ? ` • ${conversion.output_video.pix_fmt}` : ''}
                                        </div>
                                    </div>
                                )}
                                {conversion.output_audio && (
                                    <div className="mt-[4px] pt-[4px] border-t border-dashed border-border">
                                        <div className="text-text-muted">{t('debug.audio_stream')}</div>
                                        <div className="font-bold">
                                            {conversion.output_audio.codec}
                                            {conversion.output_audio.sample_rate ? ` • ${conversion.output_audio.sample_rate} Hz` : ''}
                                            {conversion.output_audio.channels ? ` • ${conversion.output_audio.channels} ch` : ''}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-text-muted italic py-[12px]">
                                {current.status === 'processing'
                                    ? t('debug.processing_hint', { seconds: liveElapsed })
                                    : t('debug.no_conversion_data')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}