import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import fetchClient from '../../api/client';
import { useTetroneDebug } from '../../utils/debug';
import { notifySuccess } from '../common/Notify';

function canViewRequestProfiler(user) {
    const role = user?.role;
    if (!role) return false;
    const roleStr = String(role).toLowerCase();
    return ['creator', 'owner', 'superadmin', 'super_admin', 'developer', 'admin', 'administrator', 'moderator', '2', '3', '4'].includes(roleStr);
}

export default function RequestProfilerDrawer() {
    const { t } = useTranslation();
    const isDebug = useTetroneDebug();
    const auth = useContext(AuthContext);
    const currentUser = auth?.user || null;
    const socketContext = useSocket();
    const socket = socketContext?.socket;

    const [isOpen, setIsOpen] = useState(false);
    const [traces, setTraces] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedTrace, setSelectedTrace] = useState(null);
    const [showJson, setShowJson] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const allowed = isDebug && canViewRequestProfiler(currentUser);

    const loadTraceDetail = useCallback(async (traceId) => {
        if (!traceId) return;
        setLoadingDetail(true);
        try {
            const res = await fetchClient(`/debug/traces/${traceId}`, { silentAuth: true });
            if (res?.ok && res.trace) {
                setSelectedTrace(res.trace);
            }
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    const loadTracesList = useCallback(async (autoSelectLatest = false) => {
        const res = await fetchClient('/debug/traces', { silentAuth: true });
        if (res?.ok && Array.isArray(res.traces)) {
            setTraces(res.traces);
            if (autoSelectLatest && res.traces.length > 0) {
                const firstId = res.traces[0].trace_id;
                setSelectedId(firstId);
                loadTraceDetail(firstId);
            }
        }
    }, [loadTraceDetail]);

    useEffect(() => {
        if (!allowed) return undefined;

        const handleCaptured = (event) => {
            const item = event.detail;
            if (!item?.trace_id) return;

            setTraces((prev) => {
                const filtered = prev.filter((tItem) => tItem.trace_id !== item.trace_id);
                return [
                    {
                        trace_id: item.trace_id,
                        method: item.method,
                        path: item.path,
                        http: {
                            status: item.status,
                            duration_ms: item.duration_ms,
                        },
                    },
                    ...filtered,
                ].slice(0, 60);
            });

            if (isOpen) {
                loadTracesList(false);
                if (selectedId === item.trace_id) {
                    loadTraceDetail(item.trace_id);
                }
            }
        };

        window.addEventListener('tetrone:trace-captured', handleCaptured);
        return () => window.removeEventListener('tetrone:trace-captured', handleCaptured);
    }, [allowed, isOpen, selectedId, loadTracesList, loadTraceDetail]);

    useEffect(() => {
        if (!allowed || !isOpen || !socket) return undefined;

        const handleWorkerUpdate = () => {
            loadTracesList(false);
            if (selectedId) {
                loadTraceDetail(selectedId);
            }
        };

        socket.on('attachment.ready', handleWorkerUpdate);
        return () => socket.off('attachment.ready', handleWorkerUpdate);
    }, [allowed, isOpen, socket, selectedId, loadTracesList, loadTraceDetail]);

    const handleOpen = () => {
        setIsOpen(true);
        loadTracesList(!selectedId);
        if (selectedId) {
            loadTraceDetail(selectedId);
        }
    };

    const handleSelectTrace = (traceId) => {
        setSelectedId(traceId);
        setShowJson(false);
        loadTraceDetail(traceId);
    };

    const handleClear = async () => {
        await fetchClient('/debug/traces', { method: 'DELETE', silentAuth: true });
        setTraces([]);
        setSelectedId(null);
        setSelectedTrace(null);
    };

    if (!allowed) return null;

    const latest = traces[0] || null;

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="fixed bottom-[12px] right-[12px] z-[900] flex items-center gap-[6px] px-[10px] py-[5px] bg-bg-box border border-theme-brand text-[11px] font-mono text-text-main shadow-md cursor-pointer hover:bg-bg-page"
            >
                <span className="w-[7px] h-[7px] bg-green-500 inline-block" />
                <span className="font-bold">{t('debug.profiler_button', { count: traces.length })}</span>
                {latest && (
                    <span className="text-text-muted max-md:hidden">
                        • {latest.method} {latest.path} ({latest.http?.status ?? '—'})
                        {latest.http?.duration_ms !== null && latest.http?.duration_ms !== undefined
                            ? ` ${latest.http.duration_ms}ms`
                            : ''}
                    </span>
                )}
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={t('debug.profiler_title')}
                sizeClass="modal-full"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-[6px]">
                            <button
                                type="button"
                                onClick={() => loadTracesList(false)}
                                className="px-[8px] py-[4px] bg-bg-input border border-border text-text-main hover:border-theme-brand cursor-pointer text-[11px]"
                            >
                                {t('debug.profiler_refresh')}
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-[8px] py-[4px] bg-bg-input border border-border text-theme-error hover:border-theme-error cursor-pointer text-[11px]"
                            >
                                {t('debug.profiler_clear')}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-[12px] py-[4px] bg-theme-brand text-white border border-theme-brand cursor-pointer font-bold text-[11px]"
                        >
                            {t('action.close')}
                        </button>
                    </div>
                }
            >
                <div className="grid grid-cols-[340px_1fr] max-md:grid-cols-1 gap-[10px] text-[11px] font-tahoma">
                    {/* Ліва колонка: список маршрутів */}
                    <div className="border border-border bg-bg-page p-[6px] flex flex-col gap-[4px] max-h-[74vh] overflow-y-auto">                    <div className="font-bold border-b border-border pb-[4px] mb-[2px] text-text-main">
                            {t('debug.profiler_requests_list')} ({traces.length})
                        </div>
                        {traces.length === 0 ? (
                            <div className="text-text-muted italic py-[16px] text-center">
                                {t('debug.profiler_empty')}
                            </div>
                        ) : (
                            traces.map((tr) => {
                                const status = tr.http?.status ?? 0;
                                const isError = status >= 400;
                                const isSelected = tr.trace_id === selectedId;

                                return (
                                    <button
                                        key={tr.trace_id}
                                        type="button"
                                        onClick={() => handleSelectTrace(tr.trace_id)}
                                        className={`text-left p-[6px] border font-mono text-[10px] cursor-pointer flex flex-col gap-[2px] ${
                                            isSelected
                                                ? 'bg-bg-box border-theme-brand'
                                                : 'bg-bg-page border-border hover:border-theme-brand'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-[4px]">
                                            <span className="font-bold text-text-main">{tr.method}</span>
                                            <span className={`font-bold ${isError ? 'text-theme-error' : 'text-green-500'}`}>
                                                {status || '—'}
                                            </span>
                                            <span className="text-text-muted">
                                                {tr.http?.duration_ms !== null && tr.http?.duration_ms !== undefined
                                                    ? `${tr.http.duration_ms} ms`
                                                    : ''}
                                            </span>
                                        </div>
                                        <div className="truncate text-text-main">{tr.path}</div>
                                        <div className="flex items-center justify-between text-[9px] text-text-muted">
                                            <span>{tr.http?.sql_count !== undefined ? `SQL: ${tr.http.sql_count}` : ''}</span>
                                            {tr.worker && (
                                                <span className="text-theme-link font-bold">
                                                    + {tr.worker.short_job} ({tr.worker.duration_ms}ms)
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Права колонка: деталі життєвого циклу та стектрейси */}
                    <div className="border border-border bg-bg-page p-[8px] flex flex-col gap-[8px] max-h-[74vh] overflow-y-auto">
                        {!selectedTrace ? (
                            <div className="text-text-muted italic py-[40px] text-center">
                                {loadingDetail ? '...' : t('debug.profiler_select_hint')}
                            </div>
                        ) : (
                            <>
                                <div className="bg-bg-box border border-border p-[8px] flex flex-col gap-[4px] font-mono text-[10px]">
                                    <div className="flex flex-wrap items-center justify-between gap-[6px]">
                                        <span className="font-bold text-text-main text-[11px]">
                                            {selectedTrace.method} {selectedTrace.path}
                                        </span>
                                        <span className={`font-bold ${selectedTrace.http?.status >= 400 ? 'text-theme-error' : 'text-green-500'}`}>
                                            HTTP {selectedTrace.http?.status}
                                        </span>
                                    </div>
                                    <div className="text-text-muted break-all">
                                        {selectedTrace.controller_action}
                                        {selectedTrace.route_name ? ` (${selectedTrace.route_name})` : ''}
                                    </div>
                                    <div className="flex flex-wrap gap-[10px] pt-[4px] border-t border-dashed border-border">
                                        <span>
                                            {t('debug.profiler_http_time')} <b>{selectedTrace.http?.duration_ms} ms</b>
                                        </span>
                                        <span>
                                            {t('debug.profiler_sql_time', { count: selectedTrace.http?.sql_count ?? 0 })}{' '}
                                            <b>{selectedTrace.http?.sql_ms ?? 0} ms</b>
                                        </span>
                                        <span>
                                            {t('debug.profiler_memory')} <b>{selectedTrace.http?.memory_mb ?? 0} MB</b>
                                        </span>
                                    </div>
                                    {selectedTrace.worker && (
                                        <div className="flex flex-wrap gap-[10px] pt-[4px] border-t border-dashed border-border text-theme-link">
                                            <span>
                                                {t('debug.profiler_queue_wait')} <b>{selectedTrace.worker.queue_wait_ms} ms</b>
                                            </span>
                                            <span>
                                                {t('debug.profiler_worker_time', { job: selectedTrace.worker.short_job })}{' '}
                                                <b>{selectedTrace.worker.duration_ms} ms</b>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-b border-border pb-[4px]">
                                    <span className="font-bold text-text-main">
                                        {t('debug.profiler_timeline')}
                                    </span>
                                    <div className="flex items-center gap-[4px]">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard?.writeText(JSON.stringify(selectedTrace, null, 2));
                                                notifySuccess(t('debug.copied'));
                                            }}
                                            className="px-[6px] py-[1px] border border-border bg-bg-input text-[10px] cursor-pointer hover:border-theme-brand"
                                        >
                                            {t('debug.copy_json')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowJson((v) => !v)}
                                            className="px-[6px] py-[1px] border border-border bg-bg-input text-[10px] cursor-pointer hover:border-theme-brand"
                                        >
                                            {showJson ? t('debug.hide_json') : t('debug.show_json')}
                                        </button>
                                    </div>
                                </div>

                                {showJson ? (
                                    <pre className="p-[8px] bg-bg-box border border-border font-mono text-[10px] leading-[1.45] text-text-main whitespace-pre overflow-x-auto select-all">
                                        {JSON.stringify(selectedTrace, null, 2)}
                                    </pre>
                                ) : !selectedTrace.events || selectedTrace.events.length === 0 ? (
                                    <div className="text-text-muted italic py-[12px]">
                                        {t('debug.profiler_no_events')}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-[6px] font-mono text-[10px]">
                                        {selectedTrace.events.map((ev, idx) => {
                                            const isWorker = ev.phase === 'worker';
                                            const chain = Array.isArray(ev.trace) ? ev.trace : [];

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-[6px] bg-bg-box border-l-2 border border-border flex flex-col gap-[3px] ${
                                                        ev.type === 'error' || ev.type === 'exception'
                                                            ? 'border-l-theme-error'
                                                            : isWorker
                                                                ? 'border-l-green-500'
                                                                : 'border-l-theme-link'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-[6px]">
                                                        <div className="flex items-center gap-[5px]">
                                                            <span className="px-[4px] border border-border bg-bg-page uppercase text-[9px] font-bold">
                                                                {ev.phase} • {ev.type}
                                                            </span>
                                                            <span className="text-text-muted text-[9px]">
                                                                +{ev.offset_ms} ms
                                                            </span>
                                                        </div>
                                                        {ev.duration_ms > 0 && (
                                                            <span className="font-bold text-green-500">
                                                                {ev.duration_ms} ms
                                                            </span>
                                                        )}
                                                    </div>

                                                    {ev.type === 'sql' && (
                                                        <div className="text-text-main break-all leading-[1.35]">
                                                            {ev.sql}
                                                        </div>
                                                    )}

                                                    {ev.type === 'cache' && (
                                                        <div className="text-text-main break-all">
                                                            [{ev.operation}] {ev.key}
                                                        </div>
                                                    )}

                                                    {ev.type === 'job_queued' && (
                                                        <div className="text-theme-brand font-bold break-all">
                                                            Dispatch: {ev.job} (queue: {ev.queue})
                                                        </div>
                                                    )}

                                                    {(ev.type === 'notification' || ev.type === 'error' || ev.type === 'exception') && (
                                                        <div className="text-text-main break-all">
                                                            {ev.label}
                                                        </div>
                                                    )}

                                                    {chain.length > 0 && (
                                                        <div className="mt-[2px] pt-[3px] border-t border-dashed border-border/70 flex flex-col gap-[1px] text-[9px] text-text-muted">
                                                            {chain.map((frame, fIdx) => (
                                                                <div key={fIdx} style={{ paddingLeft: `${fIdx * 8}px` }} className="break-all">
                                                                    {fIdx > 0 ? '↳ ' : ''}
                                                                    <span className="text-text-main font-bold">{frame.short_call}</span>{' '}
                                                                    <span>({frame.file}{frame.line ? `:${frame.line}` : ''})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}