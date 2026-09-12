import { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import { AuthContext } from '../../context/AuthContext';
// ІМПОРТИ ДЛЯ ТЕМИ
import { useTheme } from '../../context/ThemeContext';
import { APP_THEMES } from '../../config.js';
import Checkbox from '../ui/Checkbox';
import CustomSelect from '../ui/CustomSelect'; // Використовуємо твій кастомний селект

import PersonalizationService from '../../services/personalization.service';
import { notifySuccess, notifyError } from '../common/Notify';
import UserProfileCard from '../profile/UserProfileCard';
import ImageDropzone from './ImageDropzone';
import Button from '../ui/Button';

const hexToRgbString = (hex) => {
    if (!hex || !hex.startsWith('#')) return hex;
    const fullHex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    if (result) {
        return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
    }
    return hex;
};

const PopoverPicker = ({ color, onChange, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const safeHex = (color && color.startsWith('#')) ? color : '#ffffff';

    return (
        <div className="relative" ref={popoverRef}>
            <button
                type="button"
                className="w-[25px] h-[25px] border border-border cursor-pointer p-0 block"
                style={{ backgroundColor: color || '#ffffff' }}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('settings.choose_color')}
            />
            {isOpen && (
                <div className="absolute top-[30px] left-0 z-[1000] bg-bg-box border border-border p-[10px] shadow-[2px_2px_5px_rgba(0,0,0,0.3)]">
                    <HexColorPicker color={safeHex} onChange={onChange} />
                    <div className="mt-[8px]">
                        <input
                            type="text"
                            className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] w-full outline-none focus:border-theme-link"
                            value={color || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t('settings.color_format_hint')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default function PersonalizationSettings() {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);

    // БЕРЕМО ПОТОЧНИЙ СТАН ТЕМИ З КОНТЕКСТУ (миттєва реакція)
    const { theme, setThemeState, toggleDark, changeThemeName } = useTheme();

    const [isSaving, setIsSaving] = useState(false);
    const [showWipFeatures, setShowWipFeatures] = useState(false);

    // Локальний стейт для ТЕМИ ПРОФІЛЮ
    const [uiTheme, setUiTheme] = useState(localStorage.getItem('app_profile_theme') || 'modern');

    const initialPersonalization = user?.personalization || {};

    const [settings, setSettings] = useState({
        banner_color: initialPersonalization.banner_color,
        username_color: initialPersonalization.username_color,
        banner_image: initialPersonalization.banner_image,
    });

    const [bannerFile, setBannerFile] = useState(null);
    const [previewBannerImage, setPreviewBannerImage] = useState(initialPersonalization.banner_image || null);

    const safeGradient = settings.banner_color && settings.banner_color.includes('linear-gradient')
        ? settings.banner_color
        : 'linear-gradient(90deg, #000000, #ffffff)';
    const [deg, from, to] = safeGradient.replace(/linear-gradient\(|\)/g, '').split(',').map(s => s.trim());
    const [grad, setGrad] = useState({ deg: deg || '90', c1: from || '#000000', c2: to || '#ffffff' });

    useEffect(() => {
        if (localStorage.getItem('show_wip_features') === 'true') {
            setShowWipFeatures(true);
        }
    }, []);

    const handleProfileThemeChange = (newTheme) => {
        setUiTheme(newTheme);
        localStorage.setItem('app_profile_theme', newTheme);
        window.dispatchEvent(new Event('theme_changed'));
    };

    const updateGradient = (newDeg, color1, color2) => {
        setGrad({ deg: newDeg, c1: color1, c2: color2 });
        setSettings(prev => ({
            ...prev,
            banner_color: `linear-gradient(${newDeg}, ${color1}, ${color2})`
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBannerFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewBannerImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setBannerFile(null);
        setPreviewBannerImage(null);
        setSettings(prev => ({ ...prev, banner_image: null }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);

        const formData = new FormData();
        formData.append('username_color', hexToRgbString(settings.username_color) || '');
        formData.append('banner_color', settings.banner_color || '');

        if (bannerFile) formData.append('banner_image', bannerFile);
        else if (previewBannerImage === null) formData.append('remove_banner_image', 'true');

        PersonalizationService.updateSettings(formData)
        .onSuccess((res) => {
            if (setUser) setUser({ ...user, personalization: res.personalization });
            notifySuccess(t('common.success'));
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        })
        .onFinally(() => {
            setIsSaving(false);
        });
    };

    const previewUser = user ? {
        ...user,
        personalization: { ...user.personalization, ...settings, banner_image: previewBannerImage }
    } : null;

    const profileThemeSuffix = theme.isDark ? 'dark' : 'light';

    // Форматуємо масив для твого CustomSelect
    const themeSelectOptions = APP_THEMES.map(opt => ({
        value: opt.value,
        label: t(opt.labelKey)
    }));

    const activeGlobalThemeConfig = APP_THEMES.find(t => t.value === theme.name) || APP_THEMES[0];

    return (
        <div className="flex flex-col gap-[15px] w-full font-tahoma text-[11px] text-text-main">
            <div className="w-full">
                <UserProfileCard currentUser={previewUser} isPreview={true} forceTheme={uiTheme} />
            </div>

            <div className="w-full bg-bg-box border border-border">
                <form onSubmit={handleSave} className="flex flex-col w-full">

                    <div className="p-[12px_15px] border-b border-border w-full">

                        {/* 🌟 ГЛОБАЛЬНА ТЕМА САЙТУ (МИТТЄВЕ ЗАСТОСУВАННЯ) */}
                        <div className="mb-[20px] pb-[15px] border-b border-dashed border-border relative w-full">
                            <h3 className="text-[12px] font-bold text-theme-link m-0 mb-[10px] pb-[5px] border-b border-border">
                                {t('settings.app_appearance')}
                            </h3>

                            <div className="flex justify-between items-center mb-[10px]">
                                <span className="text-text-main text-[11px]">{t('settings.app_theme_label')}</span>
                                <CustomSelect
                                    options={themeSelectOptions}
                                    value={theme.name}
                                    onChange={(val) => changeThemeName(val)}
                                    className="w-[150px]"
                                />
                            </div>

                            <div className="border border-border bg-bg-page mb-[12px] p-[5px]">
                                <img
                                    src={`/images/theme-${theme.name}-${profileThemeSuffix}.png`}
                                    alt="preview"
                                    className="w-full object-cover border border-border block"
                                />
                                <div className="p-[6px] text-center w-full">
                                    <div className="text-[11px] font-bold text-theme-link mb-[2px]">
                                        {t(activeGlobalThemeConfig.labelKey)}
                                    </div>
                                    <div className="text-[10px] text-text-muted">
                                        {t(activeGlobalThemeConfig.descKey)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="dark-mode-toggle"
                                    checked={theme.isDark}
                                    onChange={toggleDark}
                                    label={t('settings.dark_mode_label')}
                                />
                            </div>
                        </div>

                        {/* ТЕМА ПРОФІЛЮ */}
                        <div className="mb-[12px] relative w-full">
                            <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{t('settings.profile_theme')}</label>
                            <div className="grid grid-cols-2 gap-[10px] w-full">
                                <div className={`border cursor-pointer bg-bg-box w-full ${uiTheme === 'modern' ? 'border-[2px] border-theme-link' : 'border-border'}`} onClick={() => handleProfileThemeChange('modern')}>
                                    <img src={`/images/profile-modern-${profileThemeSuffix}.png`} alt="modern" className="w-full h-[100px] object-cover border-b border-border block" />
                                    <div className="p-[6px] text-center w-full">
                                        <div className="text-[11px] font-bold text-theme-link mb-[2px]">{t('settings.theme_modern')}</div>
                                        <div className="text-[10px] text-text-muted">{t('settings.theme_modern_desc')}</div>
                                    </div>
                                </div>
                                <div className={`border cursor-pointer bg-bg-box w-full ${uiTheme === 'classic' ? 'border-[2px] border-theme-link' : 'border-border'}`} onClick={() => handleProfileThemeChange('classic')}>
                                    <img src={`/images/profile-classic-${profileThemeSuffix}.png`} alt="classic" className="w-full h-[100px] object-cover border-b border-border block" />
                                    <div className="p-[6px] text-center w-full">
                                        <div className="text-[11px] font-bold text-theme-link mb-[2px]">{t('settings.theme_classic')}</div>
                                        <div className="text-[10px] text-text-muted">{t('settings.theme_classic_desc')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Налаштування кольорів ... (без змін) */}
                        <div className="mb-[12px] relative w-full">
                            <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{t('settings.username_color')}</label>
                            <div className="flex gap-[10px] items-center w-full">
                                <PopoverPicker color={settings.username_color} onChange={(color) => setSettings({ ...settings, username_color: color })} t={t} />
                                <Button type="button" variant="secondary" onClick={() => setSettings({ ...settings, username_color: '' })}>
                                    {t('action.reset')}
                                </Button>
                            </div>
                        </div>

                        {uiTheme === 'modern' && (
                            <div className="mb-[12px] relative w-full">
                                <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{t('settings.banner_background')}</label>

                                <div className={`grid gap-[15px] items-start w-full max-md:grid-cols-1 ${previewBannerImage ? 'grid-cols-1' : 'grid-cols-[1fr_2fr]'}`}>
                                    <div className="text-center w-full">
                                        <ImageDropzone onFileSelect={handleImageChange} previewImage={previewBannerImage} onRemove={handleRemoveImage} />
                                        {previewBannerImage && (
                                            <div className="mt-[8px] text-center">
                                                <Button type="button" variant="danger" onClick={handleRemoveImage}>{t('action.delete')}</Button>
                                            </div>
                                        )}
                                    </div>

                                    {!previewBannerImage && (
                                        <div className="bg-bg-page border border-border p-[10px] w-full">
                                            <div className="h-[40px] mb-[10px] border border-border w-full" style={{ background: settings.banner_color || `linear-gradient(${grad.deg}, ${grad.c1}, ${grad.c2})` }} />

                                            <div className="flex flex-col gap-[10px] w-full">
                                                <div className="flex items-center gap-[10px] w-full">
                                                    <PopoverPicker color={grad.c1} onChange={(c) => updateGradient(grad.deg, c, grad.c2)} t={t} />
                                                    <span className="text-text-muted text-[14px]">→</span>
                                                    <PopoverPicker color={grad.c2} onChange={(c) => updateGradient(grad.deg, grad.c1, c)} t={t} />
                                                </div>

                                                <div className="w-full mt-[5px]">
                                                    <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{t('settings.angle')} ({grad.deg}°)</label>
                                                    <input
                                                        type="range"
                                                        min="0" max="360"
                                                        value={grad.deg}
                                                        onChange={(e) => updateGradient(e.target.value, grad.c1, grad.c2)}
                                                        className="w-full accent-theme-link"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-[10px_15px] bg-bg-page flex justify-end border-t border-border w-full">
                        <Button type="submit" variant="save" disabled={isSaving}>
                            {isSaving ? t('common.loading') : t('action.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}