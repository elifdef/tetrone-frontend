import { useState, useEffect, useContext, useRef, useMemo, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import { AuthContext } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { APP_THEMES } from '@/config';
import Checkbox from '@/components/ui/Checkbox';
import PersonalizationService from '@/services/personalization.service';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import UserProfileCard from '@/components/profile/UserProfileCard';
import ImageDropzone, { type ImageDropzoneSelectEvent } from '../../../components/ui/ImageDropzone';
import Button from '@/components/ui/Button';
import StickerPicker from '@/components/editor/StickerPicker';
import {
    formatGradientHsl,
    generateBannerGradientPresets,
    generateUsernameColorPresets,
    hexToHsl,
    hslToHex,
    normalizeHsl,
    parseGradientHsl,
} from '@/utils/color';
import type { PersonalizationFormState } from '../types/settings';

const USERNAME_PRESET_COUNT = 8;
const BANNER_PRESET_COUNT = 6;
const QUICK_ANGLES = [0, 45, 90, 135, 180];

interface PopoverPickerProps {
    color: string;
    onChange: (newColor: string) => void;
    chooseLabel: string;
    hintPlaceholder: string;
}

const PopoverPicker = ({
    color,
    onChange,
    chooseLabel,
    hintPlaceholder,
}: PopoverPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const pickerHex = hslToHex(color, '#45688e');

    return (
        <div className="relative inline-flex items-center" ref={popoverRef}>
            <button
                type="button"
                className="h-[26px] px-[8px] border border-border bg-bg-page hover:border-theme-link cursor-pointer flex items-center gap-[6px] transition-colors"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={chooseLabel}
            >
                <span
                    className="w-[14px] h-[14px] border border-black/25 shrink-0 block"
                    style={{ backgroundColor: color || 'var(--color-theme-link)' }}
                />
                <span className="font-mono text-[10px] text-text-main">
                    {color || 'auto'}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-[30px] left-0 z-[1000] bg-bg-box border border-border p-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.28)]">
                    <HexColorPicker
                        color={pickerHex}
                        onChange={(hex) => onChange(hexToHsl(hex))}
                    />
                    <div className="mt-[8px]">
                        <input
                            type="text"
                            className="bg-input-bg border border-input-border text-text-main p-[5px_6px] text-[11px] font-mono w-full outline-none focus:border-theme-link"
                            value={color || ''}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={(e) => {
                                if (e.target.value.trim()) {
                                    onChange(normalizeHsl(e.target.value));
                                }
                            }}
                            placeholder={hintPlaceholder}
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
    const { theme, toggleDark, changeSiteTheme, changeProfileTheme } = useTheme();

    const [isSaving, setIsSaving] = useState(false);
    const uiTheme = theme.profileTheme || 'classic';

    const usernameColorPresets = useMemo(
        () => generateUsernameColorPresets(USERNAME_PRESET_COUNT),
        []
    );
    const bannerGradientPresets = useMemo(
        () => generateBannerGradientPresets(BANNER_PRESET_COUNT),
        []
    );

    const buildInitialState = (): PersonalizationFormState => ({
        banner_color: user?.personalization?.banner_color || '',
        username_color: user?.personalization?.username_color || '',
        banner_image: user?.personalization?.banner_image || null,
        verification_badge_type:
            (user?.verification_badge?.type as 'classic' | 'sticker') || 'classic',
        verification_sticker_id: user?.verification_badge?.sticker_id ?? null,
    });

    const [initialState, setInitialState] = useState<PersonalizationFormState>(buildInitialState);
    const [settings, setSettings] = useState<PersonalizationFormState>(buildInitialState);

    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(
        user?.personalization?.banner_image || null
    );
    const [bannerMode, setBannerMode] = useState<'gradient' | 'image'>(
        user?.personalization?.banner_image ? 'image' : 'gradient'
    );

    const [selectedStickerUrl, setSelectedStickerUrl] = useState<string | null>(
        user?.verification_badge?.sticker_url || null
    );
    const [showStickerPicker, setShowStickerPicker] = useState(false);

    const [grad, setGrad] = useState(() =>
        parseGradientHsl(user?.personalization?.banner_color || '')
    );

    const isDirty = useMemo(() => {
        if (bannerFile !== null) return true;
        if (previewBannerImage !== initialState.banner_image) return true;
        if (settings.banner_color !== initialState.banner_color) return true;
        if (settings.username_color !== initialState.username_color) return true;
        if (settings.verification_badge_type !== initialState.verification_badge_type) return true;
        if (settings.verification_sticker_id !== initialState.verification_sticker_id) return true;
        return false;
    }, [bannerFile, previewBannerImage, settings, initialState]);

    const updateGradient = (newDeg: string, color1: string, color2: string) => {
        const formattedDeg = newDeg.endsWith('deg') ? newDeg : `${newDeg}deg`;
        const c1 = normalizeHsl(color1);
        const c2 = normalizeHsl(color2);
        const nextGrad = { deg: formattedDeg, c1, c2 };
        setGrad(nextGrad);
        setSettings((prev) => ({
            ...prev,
            banner_color: formatGradientHsl(nextGrad),
        }));
    };

    const handleImageChange = (e: ImageDropzoneSelectEvent) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBannerFile(file);
        setBannerMode('image');
        const reader = new FileReader();
        reader.onloadend = () => setPreviewBannerImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setBannerFile(null);
        setPreviewBannerImage(null);
        setSettings((prev) => ({ ...prev, banner_image: null }));
    };

    const handleResetUnsaved = () => {
        setSettings(initialState);
        setBannerFile(null);
        setPreviewBannerImage(initialState.banner_image);
        setBannerMode(initialState.banner_image ? 'image' : 'gradient');
        setGrad(parseGradientHsl(initialState.banner_color));
        setSelectedStickerUrl(user?.verification_badge?.sticker_url || null);
        setShowStickerPicker(false);
    };

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isDirty || isSaving) return;
        setIsSaving(true);

        const changed: Record<string, unknown> = {};

        if (settings.username_color !== initialState.username_color) {
            changed.username_color = settings.username_color
                ? normalizeHsl(settings.username_color)
                : null;
        }

        if (settings.banner_color !== initialState.banner_color) {
            changed.banner_color = settings.banner_color || null;
        }

        if (user?.is_verified) {
            if (settings.verification_badge_type !== initialState.verification_badge_type) {
                changed.verification_badge_type = settings.verification_badge_type;
            }
            if (settings.verification_sticker_id !== initialState.verification_sticker_id) {
                changed.verification_sticker_id = settings.verification_sticker_id;
            }
        }

        if (!bannerFile && previewBannerImage === null && initialState.banner_image !== null) {
            changed.remove_banner_image = true;
        }

        let payload: FormData | Record<string, unknown> = changed;
        if (bannerFile) {
            const formData = new FormData();
            Object.entries(changed).forEach(([k, v]) => {
                formData.append(k, v === null ? '' : String(v));
            });
            formData.append('banner_image', bannerFile);
            payload = formData;
        }

        PersonalizationService.updateSettings(payload)
            .onSuccess((res) => {
                if (setUser && user) {
                    setUser({
                        ...user,
                        personalization: res.personalization,
                        verification_badge: res.verification_badge,
                    });
                }

                const nextState: PersonalizationFormState = {
                    banner_color: res.personalization?.banner_color || '',
                    username_color: res.personalization?.username_color || '',
                    banner_image: res.personalization?.banner_image || null,
                    verification_badge_type:
                        (res.verification_badge?.type as 'classic' | 'sticker') || 'classic',
                    verification_sticker_id: res.verification_badge?.sticker_id ?? null,
                };

                setInitialState(nextState);
                setSettings(nextState);
                setBannerFile(null);
                setPreviewBannerImage(nextState.banner_image);

                if (res.verification_badge?.sticker_url) {
                    setSelectedStickerUrl(res.verification_badge.sticker_url);
                }

                notifySuccess(t('common.success'));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setIsSaving(false);
            });
    };

    const previewUser = user
        ? {
              ...user,
              personalization: {
                  ...user.personalization,
                  banner_color: settings.banner_color || null,
                  username_color: settings.username_color || null,
                  banner_image: previewBannerImage,
              },
              verification_badge: user.is_verified
                  ? {
                        type: settings.verification_badge_type,
                        sticker_id: settings.verification_sticker_id,
                        sticker_url: selectedStickerUrl,
                    }
                  : null,
          }
        : null;

    const profileThemeSuffix = theme.isDark ? 'dark' : 'light';
    const numericDeg = parseInt(grad.deg, 10) || 90;
    const displayFullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'User';

    return (
        <div className="flex flex-col gap-[12px] w-full font-tahoma text-[11px] text-text-main">
            {/* 1. Живий передперегляд картки профілю */}
            <div className="bg-bg-box border border-border overflow-hidden">
                <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link px-[12px] py-[6px] flex items-center justify-between gap-[8px] flex-wrap">
                    <div className="flex items-center gap-[8px]">
                        <span className="font-bold text-theme-link text-[11px]">
                            {t('settings.profile_theme')}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-[5px] py-[1px] bg-bg-box border border-border text-text-muted">
                            Preview
                        </span>
                    </div>

                    <div className="inline-flex border border-border bg-bg-box">
                        <button
                            type="button"
                            onClick={() => changeProfileTheme('modern')}
                            className={`px-[8px] py-[2px] text-[10px] cursor-pointer border-0 transition-colors ${
                                uiTheme === 'modern'
                                    ? 'bg-theme-link text-white font-bold'
                                    : 'bg-transparent text-text-muted hover:text-text-main'
                            }`}
                        >
                            {t('settings.theme_modern')}
                        </button>
                        <button
                            type="button"
                            onClick={() => changeProfileTheme('classic')}
                            className={`px-[8px] py-[2px] text-[10px] cursor-pointer border-0 border-l border-border transition-colors ${
                                uiTheme === 'classic'
                                    ? 'bg-theme-link text-white font-bold'
                                    : 'bg-transparent text-text-muted hover:text-text-main'
                            }`}
                        >
                            {t('settings.theme_classic')}
                        </button>
                    </div>
                </div>

                <div className="p-[10px] bg-bg-page">
                    <UserProfileCard
                        currentUser={previewUser}
                        isPreview={true}
                        forceTheme={uiTheme}
                    />
                </div>
            </div>

            {/* 2. Тема інтерфейсу сайту */}
            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link px-[12px] py-[6px] flex items-center justify-between gap-[8px] flex-wrap">
                    <h3 className="m-0 text-[11px] font-bold text-theme-link">
                        {t('settings.app_appearance')}
                    </h3>

                    <Checkbox
                        id="dark-mode-toggle"
                        checked={theme.isDark}
                        onChange={toggleDark}
                        label={t('settings.dark_mode_label')}
                    />
                </div>

                <div className="p-[12px] grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                    {APP_THEMES.map((opt) => {
                        const isSelected = theme.siteTheme === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => changeSiteTheme(opt.value)}
                                className={`text-left p-0 bg-bg-page border cursor-pointer transition-all overflow-hidden flex flex-col ${
                                    isSelected
                                        ? 'border-theme-link ring-1 ring-theme-link'
                                        : 'border-border hover:border-theme-link/60'
                                }`}
                            >
                                <div className="relative w-full h-[88px] bg-bg-box border-b border-border overflow-hidden">
                                    <img
                                        src={`/images/theme-${opt.value}-${profileThemeSuffix}.png`}
                                        alt={t(opt.labelKey)}
                                        className="w-full h-full object-cover block"
                                    />
                                    {isSelected && (
                                        <span className="absolute top-[6px] right-[6px] bg-theme-link text-white text-[9px] font-bold px-[5px] py-[1px]">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <div className="p-[8px_10px] flex flex-col gap-[2px]">
                                    <span className="text-[11px] font-bold text-theme-link">
                                        {t(opt.labelKey)}
                                    </span>
                                    <span className="text-[10px] text-text-muted leading-[1.35]">
                                        {t(opt.descKey)}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Серверні налаштування дизайну профілю */}
            <form onSubmit={handleSave} className="flex flex-col gap-[12px] w-full">
                <div className="bg-bg-box border border-border">
                    <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link px-[12px] py-[6px]">
                        <h3 className="m-0 text-[11px] font-bold text-theme-link">
                            {t('settings.profile_theme')}
                        </h3>
                    </div>

                    <div className="p-[12px] flex flex-col gap-[14px]">
                        {/* Картки формату профілю */}
                        <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                            {(
                                [
                                    {
                                        id: 'modern',
                                        titleKey: 'settings.theme_modern',
                                        descKey: 'settings.theme_modern_desc',
                                    },
                                    {
                                        id: 'classic',
                                        titleKey: 'settings.theme_classic',
                                        descKey: 'settings.theme_classic_desc',
                                    },
                                ] as const
                            ).map((layout) => {
                                const active = uiTheme === layout.id;
                                return (
                                    <button
                                        key={layout.id}
                                        type="button"
                                        onClick={() => changeProfileTheme(layout.id)}
                                        className={`text-left p-0 bg-bg-page border cursor-pointer transition-all overflow-hidden flex flex-col ${
                                            active
                                                ? 'border-theme-link ring-1 ring-theme-link'
                                                : 'border-border hover:border-theme-link/60'
                                        }`}
                                    >
                                        <div className="relative w-full h-[84px] bg-bg-box border-b border-border overflow-hidden">
                                            <img
                                                src={`/images/profile-${layout.id}-${profileThemeSuffix}.png`}
                                                alt={t(layout.titleKey)}
                                                className="w-full h-full object-cover block"
                                            />
                                            {active && (
                                                <span className="absolute top-[6px] right-[6px] bg-theme-link text-white text-[9px] font-bold px-[5px] py-[1px]">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-[8px_10px] flex flex-col gap-[2px]">
                                            <span className="text-[11px] font-bold text-theme-link">
                                                {t(layout.titleKey)}
                                            </span>
                                            <span className="text-[10px] text-text-muted leading-[1.35]">
                                                {t(layout.descKey)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Колір нікнейму */}
                        <div className="pt-[12px] border-t border-dashed border-border flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between gap-[10px] flex-wrap">
                                <span className="font-bold text-text-main text-[11px]">
                                    {t('settings.username_color')}
                                </span>

                                <div className="flex items-center gap-[6px]">
                                    <PopoverPicker
                                        color={settings.username_color}
                                        onChange={(color) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                username_color: color,
                                            }))
                                        }
                                        chooseLabel={t('settings.choose_color')}
                                        hintPlaceholder={t('settings.color_format_hint')}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                username_color: '',
                                            }))
                                        }
                                        disabled={!settings.username_color}
                                    >
                                        {t('action.reset')}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-bg-page border border-border p-[8px_10px] flex items-center justify-between gap-[10px] flex-wrap">
                                <div className="flex items-center gap-[8px]">
                                    <span
                                        className="font-bold text-[12px]"
                                        style={{
                                            color:
                                                settings.username_color ||
                                                'var(--color-theme-link)',
                                        }}
                                    >
                                        {displayFullName}
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                        @{user?.username}
                                    </span>
                                </div>

                                <div className="flex items-center gap-[5px] flex-wrap">
                                    {usernameColorPresets.map((preset) => {
                                        const isCurrent =
                                            normalizeHsl(settings.username_color, '') === preset;
                                        return (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() =>
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        username_color: preset,
                                                    }))
                                                }
                                                title={preset}
                                                className={`w-[18px] h-[18px] border cursor-pointer p-0 transition-transform hover:scale-110 ${
                                                    isCurrent
                                                        ? 'border-text-main ring-1 ring-text-main'
                                                        : 'border-black/25'
                                                }`}
                                                style={{ backgroundColor: preset }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Фон банера */}
                        {uiTheme === 'modern' && (
                            <div className="pt-[12px] border-t border-dashed border-border flex flex-col gap-[8px]">
                                <div className="flex items-center justify-between gap-[10px] flex-wrap">
                                    <span className="font-bold text-text-main text-[11px]">
                                        {t('settings.banner_background')}
                                    </span>

                                    <div className="inline-flex border border-border bg-bg-page">
                                        <button
                                            type="button"
                                            onClick={() => setBannerMode('gradient')}
                                            className={`px-[9px] py-[3px] text-[10px] cursor-pointer border-0 transition-colors ${
                                                bannerMode === 'gradient'
                                                    ? 'bg-theme-link text-white font-bold'
                                                    : 'bg-transparent text-text-muted hover:text-text-main'
                                            }`}
                                        >
                                            CSS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBannerMode('image')}
                                            className={`px-[9px] py-[3px] text-[10px] cursor-pointer border-0 border-l border-border transition-colors ${
                                                bannerMode === 'image'
                                                    ? 'bg-theme-link text-white font-bold'
                                                    : 'bg-transparent text-text-muted hover:text-text-main'
                                            }`}
                                        >
                                            IMG
                                        </button>
                                    </div>
                                </div>

                                {bannerMode === 'gradient' ? (
                                    <div className="bg-bg-page border border-border p-[10px] flex flex-col gap-[10px]">
                                        <div
                                            className="h-[46px] border border-border w-full relative overflow-hidden"
                                            style={{
                                                background:
                                                    settings.banner_color ||
                                                    formatGradientHsl(grad),
                                            }}
                                        >
                                            <span className="absolute bottom-[4px] right-[6px] bg-black/55 text-white font-mono text-[9px] px-[5px] py-[1px]">
                                                {numericDeg}°
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-[6px] flex-wrap">
                                            {bannerGradientPresets.map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() =>
                                                        updateGradient(
                                                            preset.deg,
                                                            preset.c1,
                                                            preset.c2
                                                        )
                                                    }
                                                    className="w-[34px] h-[20px] border border-border hover:border-theme-link cursor-pointer p-0 transition-transform hover:scale-105"
                                                    style={{
                                                        background: formatGradientHsl(preset),
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between gap-[12px] flex-wrap pt-[6px] border-t border-dashed border-border">
                                            <div className="flex items-center gap-[6px]">
                                                <PopoverPicker
                                                    color={grad.c1}
                                                    onChange={(c) =>
                                                        updateGradient(grad.deg, c, grad.c2)
                                                    }
                                                    chooseLabel={t('settings.choose_color')}
                                                    hintPlaceholder={t(
                                                        'settings.color_format_hint'
                                                    )}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateGradient(grad.deg, grad.c2, grad.c1)
                                                    }
                                                    className="h-[26px] px-[7px] bg-bg-box border border-border hover:border-theme-link text-text-main cursor-pointer text-[11px]"
                                                >
                                                    ⇄
                                                </button>
                                                <PopoverPicker
                                                    color={grad.c2}
                                                    onChange={(c) =>
                                                        updateGradient(grad.deg, grad.c1, c)
                                                    }
                                                    chooseLabel={t('settings.choose_color')}
                                                    hintPlaceholder={t(
                                                        'settings.color_format_hint'
                                                    )}
                                                />
                                            </div>

                                            <div className="flex items-center gap-[4px]">
                                                {QUICK_ANGLES.map((angle) => (
                                                    <button
                                                        key={angle}
                                                        type="button"
                                                        onClick={() =>
                                                            updateGradient(
                                                                String(angle),
                                                                grad.c1,
                                                                grad.c2
                                                            )
                                                        }
                                                        className={`px-[6px] py-[3px] text-[10px] font-mono border cursor-pointer ${
                                                            numericDeg === angle
                                                                ? 'bg-theme-link text-white border-theme-link font-bold'
                                                                : 'bg-bg-box text-text-muted border-border hover:text-text-main'
                                                        }`}
                                                    >
                                                        {angle}°
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-[10px]">
                                            <span className="text-[10px] text-text-muted shrink-0">
                                                {t('settings.angle')} ({numericDeg}°)
                                            </span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                value={numericDeg}
                                                onChange={(e) =>
                                                    updateGradient(
                                                        e.target.value,
                                                        grad.c1,
                                                        grad.c2
                                                    )
                                                }
                                                className="flex-1 accent-theme-link cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-bg-page border border-border p-[10px] flex flex-col gap-[8px]">
                                        <ImageDropzone
                                            onFileSelect={handleImageChange}
                                            previewImage={previewBannerImage}
                                            onRemove={handleRemoveImage}
                                        />
                                        {previewBannerImage && (
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    onClick={handleRemoveImage}
                                                >
                                                    {t('action.delete')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Бейдж підтвердження профілю */}
                {user?.is_verified && (
                    <div className="bg-bg-box border border-border">
                        <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link px-[12px] py-[6px]">
                            <h3 className="m-0 text-[11px] font-bold text-theme-link">
                                {t('settings.verification_badge')}
                            </h3>
                        </div>

                        <div className="p-[12px] flex flex-col gap-[10px]">
                            <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                                <label
                                    className={`flex items-center gap-[8px] p-[9px_10px] border cursor-pointer transition-colors ${
                                        settings.verification_badge_type === 'classic'
                                            ? 'bg-theme-link/5 border-theme-link font-bold'
                                            : 'bg-bg-page border-border hover:border-theme-link/60'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="badge_type"
                                        value="classic"
                                        checked={settings.verification_badge_type === 'classic'}
                                        onChange={() =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                verification_badge_type: 'classic',
                                            }))
                                        }
                                        className="accent-theme-link m-0"
                                    />
                                    <span>{t('settings.badge_classic')}</span>
                                </label>

                                <label
                                    className={`flex items-center gap-[8px] p-[9px_10px] border cursor-pointer transition-colors ${
                                        settings.verification_badge_type === 'sticker'
                                            ? 'bg-theme-link/5 border-theme-link font-bold'
                                            : 'bg-bg-page border-border hover:border-theme-link/60'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="badge_type"
                                        value="sticker"
                                        checked={settings.verification_badge_type === 'sticker'}
                                        onChange={() =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                verification_badge_type: 'sticker',
                                            }))
                                        }
                                        className="accent-theme-link m-0"
                                    />
                                    <span>{t('settings.badge_sticker')}</span>
                                </label>
                            </div>

                            {settings.verification_badge_type === 'sticker' && (
                                <div className="bg-bg-page border border-border p-[10px] flex flex-col gap-[8px]">
                                    <div className="flex items-center justify-between gap-[10px] flex-wrap">
                                        <div className="flex items-center gap-[10px]">
                                            {selectedStickerUrl ? (
                                                <img
                                                    src={selectedStickerUrl}
                                                    alt="Selected sticker"
                                                    className="w-[34px] h-[34px] object-contain border border-border p-[3px] bg-bg-box"
                                                />
                                            ) : (
                                                <span className="text-text-muted text-[11px] italic">
                                                    {t('settings.no_sticker_selected')}
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setShowStickerPicker((prev) => !prev)}
                                        >
                                            {showStickerPicker
                                                ? t('action.cancel')
                                                : t('settings.select_saved_sticker')}
                                        </Button>
                                    </div>

                                    {showStickerPicker && (
                                        <div className="pt-[6px] border-t border-dashed border-border">
                                            <StickerPicker
                                                compact={true}
                                                onSelect={(sticker) => {
                                                    const imgUrl =
                                                        sticker.url ||
                                                        sticker.src ||
                                                        (sticker.file_path
                                                            ? `/storage/${sticker.file_path}`
                                                            : null);
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        verification_sticker_id: sticker.id,
                                                    }));
                                                    setSelectedStickerUrl(imgUrl);
                                                    setShowStickerPicker(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 5. Нижня панель збереження */}
                <div className="bg-bg-box border border-border p-[10px_12px] flex items-center justify-between gap-[10px]">
                    <div>
                        {isDirty && <span className="text-theme-link font-bold">●</span>}
                    </div>

                    <div className="flex items-center gap-[8px]">
                        {isDirty && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleResetUnsaved}
                                disabled={isSaving}
                            >
                                {t('action.reset')}
                            </Button>
                        )}
                        <Button type="submit" variant="save" disabled={!isDirty || isSaving}>
                            {isSaving ? t('common.loading') : t('action.save')}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}