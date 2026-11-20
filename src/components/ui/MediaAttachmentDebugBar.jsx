import { useTranslation } from 'react-i18next';
import { useTetroneDebug, openMediaDebugModal } from '../../utils/debug';
import { notifySuccess } from '../common/Notify';

export default function MediaAttachmentDebugBar({ attachment }) {
    const { t } = useTranslation();
    const isDebug = useTetroneDebug();

    if (!isDebug || !attachment) return null;

    const meta = attachment.meta || null;
    const source = meta?.source || null;
    const conversion = meta?.conversion || null;
    const status = attachment.status || 'ready';

    const handleCopy = (e) => {
        e.stopPropagation();
        const report = JSON.stringify(
            {
                id: attachment.id,
                type: attachment.type,
                status,
                url: attachment.url || attachment.file_url,
                file_size: attachment.file_size,
                meta,
            },
            null,
            2
        );
        navigator.clipboard?.writeText(report);
        notifySuccess(t('debug.copied'));
    };

    const handleOpenModal = (e) => {
        e.stopPropagation();
        openMediaDebugModal(attachment);
    };

    const srcVideoStr = source?.video
        ? `${source.video.codec}${source.video.resolution ? ` ${source.video.resolution}` : ''}${source.video.fps ? ` @ ${source.video.fps}fps` : ''}`
        : null;

    const outVideoStr = conversion?.output_video
        ? `${conversion.output_video.codec}${conversion.output_video.resolution ? ` ${conversion.output_video.resolution}` : ''}${conversion.output_video.fps ? ` @ ${conversion.output_video.fps}fps` : ''}`
        : conversion?.output_res || null;

    const srcAudioStr = source?.audio
        ? `${source.audio.codec}${source.audio.sample_rate ? ` ${source.audio.sample_rate}Hz` : ''}${source.audio.channels ? ` ${source.audio.channels}ch` : ''}`
        : null;

    const outAudioStr = conversion?.output_audio
        ? `${conversion.output_audio.codec}${conversion.output_audio.sample_rate ? ` ${conversion.output_audio.sample_rate}Hz` : ''}${conversion.output_audio.channels ? ` ${conversion.output_audio.channels}ch` : ''}`
        : null;

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="w-full border border-t-0 border-border bg-bg-box/90 px-[8px] py-[5px] text-[10px] font-mono text-text-main flex flex-col gap-[3px] select-text"
        >
            <div className="flex flex-wrap items-center justify-between gap-[6px]">
                <div className="flex items-center gap-[6px]">
                    <span className="px-[4px] py-[0px] bg-theme-brand text-white font-bold uppercase text-[9px]">
                        DEBUG{attachment.id ? ` #${attachment.id}` : ''}
                    </span>
                    <span className={`font-bold uppercase text-[9px] ${
                        status === 'ready'
                            ? 'text-green-500'
                            : status === 'failed'
                                ? 'text-theme-error'
                                : 'text-theme-brand'
                    }`}>
                        {status}
                    </span>
                    {conversion?.elapsed_seconds !== undefined && (
                        <span className="text-text-muted">
                            ({conversion.elapsed_seconds} {t('debug.seconds_unit')})
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-[6px]">
                    {meta && (
                        <button
                            type="button"
                            onClick={handleOpenModal}
                            className="text-theme-link hover:underline cursor-pointer bg-transparent border-0 p-0 text-[10px]"
                        >
                            {t('debug.open_details')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="text-text-muted hover:text-text-main cursor-pointer bg-transparent border-0 p-0 text-[10px]"
                    >
                        JSON
                    </button>
                </div>
            </div>

            {meta ? (
                <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[2px] text-text-muted leading-tight">
                    {source?.format && (
                        <span>
                            {source.format}
                            {conversion?.output_format ? ` -> ${conversion.output_format}` : ''}
                        </span>
                    )}

                    {source?.size_human && (
                        <span>
                            {source.size_human}
                            {conversion?.output_human ? ` -> ${conversion.output_human}` : ''}
                            {conversion?.saved_percent !== undefined && (
                                <b className={`ml-[4px] ${conversion.saved_percent >= 0 ? 'text-green-500' : 'text-theme-brand'}`}>
                                    ({conversion.saved_percent >= 0 ? `-${conversion.saved_percent}%` : `+${Math.abs(conversion.saved_percent)}%`})
                                </b>
                            )}
                        </span>
                    )}

                    {srcVideoStr && (
                        <span>
                            V: {srcVideoStr}
                            {outVideoStr ? ` -> ${outVideoStr}` : ''}
                        </span>
                    )}

                    {srcAudioStr && (
                        <span>
                            A: {srcAudioStr}
                            {outAudioStr ? ` -> ${outAudioStr}` : ''}
                        </span>
                    )}

                    {conversion?.segments_count !== undefined && (
                        <span>HLS: {conversion.segments_count} .ts</span>
                    )}

                    {conversion?.target_key && (
                        <span className="text-text-main">
                            {t(conversion.target_key, conversion.target_params || {})}
                        </span>
                    )}
                </div>
            ) : (
                <div className="text-text-muted italic">
                    {t('debug.no_conversion_data')}
                </div>
            )}
        </div>
    );
}