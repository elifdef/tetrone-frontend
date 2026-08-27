import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import pkg from '../../package.json';
import publicService from "../services/public.service.js";
import { APP_NAME } from "../config.js";
import InfoBox from '../components/ui/InfoBox';

const groupDependencies = (deps, isBackend = false, t) => {
    const groups = {};
    Object.entries(deps || {}).forEach(([name, ver]) => {
        const cleanVer = String(ver).replace(/[\^~]/g, '');
        let category = t('about.cat_other');

        if (!isBackend) {
            if (name.includes('react') && !name.includes('query') && !name.includes('hook-form') && !name.includes('colorful') && !name.includes('toast') && !name.includes('datepicker') && !name.includes('skeleton')) category = t('about.cat_react');
            else if (name.includes('tiptap') || name.includes('prosemirror') || name.includes('highlight') || name.includes('lowlight')) category = t('about.cat_editor');
            else if (name.includes('tailwind') || name.includes('postcss') || name.includes('toast') || name.includes('colorful') || name.includes('tippy') || name.includes('skeleton') || name.includes('flag-icons')) category = t('about.cat_ui');
            else if (name.includes('query') || name.includes('socket') || name.includes('axios')) category = t('about.cat_network');
            else if (name.includes('hook-form') || name.includes('resolvers') || name === 'zod') category = t('about.cat_forms');
            else if (name.includes('date-fns') || name.includes('recharts')) category = t('about.cat_data');
            else if (name.includes('plyr') || name.includes('hls.js') || name.includes('truncate')) category = t('about.cat_media');
            else if (name.includes('i18n') || name.includes('countries-list')) category = t('about.cat_localization');
        } else {
            if (name.startsWith('laravel/')) category = t('about.cat_laravel');
            else if (name.startsWith('spatie/')) category = t('about.cat_spatie');
            else if (name.includes('doctrine')) category = t('about.cat_db');
            else if (name.includes('elastic-scout')) category = t('about.cat_search');
            else if (name.includes('intervention') || name.includes('getid3')) category = t('about.cat_files');
            else if (name.includes('purifier') || name.includes('agent') || name.includes('location')) category = t('about.cat_security');
        }

        if (!groups[category]) groups[category] = [];
        groups[category].push(`${name} (${cleanVer})`);
    });
    return groups;
};

const formatVersionType = (version, t) => {
    if (!version || version === 'N/A') return 'N/A';
    const lower = version.toLowerCase();
    let type = t('about.ver_stable');

    if (lower.includes('-alpha') || lower.includes('alpha')) type = t('about.ver_alpha');
    else if (lower.includes('-beta') || lower.includes('beta')) type = t('about.ver_beta');
    else if (lower.includes('-rc') || lower.includes('rc')) type = t('about.ver_rc');
    else if (lower.includes('-preview') || lower.includes('preview')) type = t('about.ver_preview');

    return `v${version} (${type})`;
};

const InfoRow = ({ label, children }) => (
    <tr className="hover:bg-bg-hover transition-colors">
        <th className="border border-border p-[6px_10px] bg-[rgba(128,128,128,0.05)] text-left font-bold text-text-muted w-[35%] max-md:w-[45%]">
            {label}
        </th>
        <td className="border border-border p-[6px_10px] text-text-main font-mono text-[10px] overflow-visible relative">
            {children}
        </td>
    </tr>
);

const StatusRow = ({ label, service }) => {
    const { value, enabled } = service || {};
    return (
        <InfoRow label={label}>
            {enabled !== undefined ? (
                <div className="flex items-center gap-[6px]">
                    <div
                        className={`w-[8px] h-[8px] flex-shrink-0 ${enabled ? 'bg-[#4bb34b]' : 'bg-[#ff3347]'}`}
                        style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.4)' }}
                    ></div>
                    {value}
                </div>
            ) : (
                value
            )}
        </InfoRow>
    );
};

export default function AboutPage() {
    const { t } = useTranslation();
    usePageTitle(t('about.title'));

    const [backendInfo, setBackendInfo] = useState({
        name: t('common.loading'),
        version: t('common.loading'),
        codename: t('common.loading'),
        laravel: t('common.loading'),
        php: t('common.loading'),
        services: {},
        packages: {}
    });

    useEffect(() => {
        const fetchBackendInfo = async () => {
            try {
                const res = await publicService.getSystemInfo();
                const info = res.about;
                setBackendInfo({
                    name: info.name || t('common.na'),
                    version: info.app_version || t('common.na'),
                    codename: info.codename || t('common.na'),
                    laravel: info.laravel_version,
                    php: info.php_version,
                    services: info.services || {},
                    packages: info.packages || {}
                });
            } catch (error) {
                // Fail silently
            }
        };
        fetchBackendInfo();
    }, []);

    const groupedFrontend = groupDependencies(pkg.dependencies, false, t);
    const groupedBackend = groupDependencies(backendInfo.packages, true, t);

    // Беремо value та enabled з об'єкта сервісу
    const dbSvc = backendInfo.services.database || { value: t('common.loading') };
    const redisSvc = backendInfo.services.redis || { value: t('common.loading') };
    const elasticSvc = backendInfo.services.elasticsearch || { value: t('common.loading') };
    const microSvc = backendInfo.services.microservice || { value: t('common.loading') };

    const renderPackageGroup = (groupedData) => (
        <div className="flex flex-col mt-[15px]">
            {Object.keys(groupedData).length > 0 ? (
                Object.entries(groupedData).sort().map(([groupName, items]) => (
                    <div key={groupName} className="mb-[10px] last:mb-0">
                        <div className="text-[10px] font-bold text-text-muted mb-[4px]">{groupName}</div>
                        <div className="flex flex-wrap gap-[6px]">
                            {items.sort().map((lib, idx) => (
                                <span
                                    key={idx}
                                    className="bg-bg-box border border-border px-[6px] py-[3px] text-[10px] text-theme-link font-mono select-all hover:bg-[rgba(91,155,213,0.05)] transition-colors"
                                >
                                    {lib}
                                </span>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-[10px] text-text-muted italic">{t('common.loading')}</div>
            )}
        </div>
    );

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border font-tahoma text-[11px] text-text-main max-md:p-[10px]">
            <h1 className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                {t('about.title')}
            </h1>

            <div className="mb-[25px] bg-[rgba(128,128,128,0.05)] border-l-[3px] border-theme-link p-[12px] text-text-main">
                <p className="m-0 mb-[10px] leading-[1.5]">
                    {t('about.description_p1', { name: APP_NAME })}
                </p>
                <p className="m-0 mb-[10px] leading-[1.5]">
                    {t('about.description_p2')}
                </p>
                <p className="m-0 mb-[10px] leading-[1.5]">
                    {t('about.description_p3')}
                </p>
                <p className="m-0 leading-[1.5] font-bold text-text-muted">
                    {t('about.description_p4')}
                </p>
            </div>

            {/* --- ФРОНТЕНД БЛОК --- */}
            <div className="mb-[30px]">
                <h2 className="m-0 mb-[10px] text-[13px] font-bold text-theme-link border-b border-border pb-[4px]">
                    {t('about.section_frontend')}
                </h2>

                <table className="w-full border-collapse border border-border text-[11px] mb-[15px]">
                    <tbody>
                    <InfoRow label={t('about.name')}>{pkg.name}</InfoRow>

                    <InfoRow label={t('about.codename')}>
                        <div className="group relative inline-block cursor-help border-b border-dashed border-text-muted">
                            {pkg.codename}

                            <div className="absolute left-0 bottom-full mb-[5px] hidden group-hover:block w-[280px] z-[50]">
                                <InfoBox
                                    title={t('easter_eggs.frontend_title')}
                                    text={t('easter_eggs.frontend_info')}
                                />
                            </div>
                        </div>
                    </InfoRow>

                    <InfoRow label={t('about.version')}>{formatVersionType(pkg.version, t)}</InfoRow>
                    </tbody>
                </table>
                {renderPackageGroup(groupedFrontend)}
            </div>

            {/* --- БЕКЕНД БЛОК --- */}
            <div>
                <h2 className="m-0 mb-[10px] text-[13px] font-bold text-theme-link border-b border-border pb-[4px]">
                    {t('about.section_backend')}
                </h2>

                <table className="w-full border-collapse border border-border text-[11px] mb-[15px]">
                    <tbody>
                    <InfoRow label={t('about.name')}>{backendInfo.name}</InfoRow>

                    <InfoRow label={t('about.codename')}>
                        <div className="group relative inline-block cursor-help border-b border-dashed border-text-muted">
                            {backendInfo.codename}

                            <div className="absolute left-0 bottom-full mb-[5px] hidden group-hover:block w-[280px] z-[50]">
                                <InfoBox
                                    title={t('easter_eggs.backend_title')}
                                    text={t('easter_eggs.backend_info')}
                                />
                            </div>
                        </div>
                    </InfoRow>

                    <InfoRow label={t('about.version')}>{formatVersionType(backendInfo.version, t)}</InfoRow>
                    <InfoRow label={t('about.framework')}>Laravel {backendInfo.laravel}</InfoRow>
                    <InfoRow label={t('about.php_version')}>{backendInfo.php}</InfoRow>

                    <StatusRow label={t('about.system_db')} service={dbSvc} />
                    <StatusRow label={t('about.system_redis')} service={redisSvc} />
                    <StatusRow label={t('about.system_feed_filter')} service={elasticSvc} />

                    <InfoRow label={t('about.system_microservice')}>
                        {microSvc.enabled !== undefined ? (
                            <div className="flex items-center gap-[6px]">
                                <div
                                    className={`w-[8px] h-[8px] flex-shrink-0 ${microSvc.enabled ? 'bg-[#4bb34b]' : 'bg-[#ff3347]'}`}
                                    style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.4)' }}
                                ></div>

                                <div className="group relative inline-block cursor-help border-b border-dashed border-text-muted">
                                    {microSvc.value}

                                    <div className="absolute left-0 bottom-full mb-[5px] hidden group-hover:block w-[280px] z-[50]">
                                        <InfoBox
                                            title={t('easter_eggs.dottore_title')}
                                            text={t('easter_eggs.info_dottore')}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            microSvc.value
                        )}
                    </InfoRow>
                    </tbody>
                </table>
                {renderPackageGroup(groupedBackend)}
            </div>
        </div>
    );
}