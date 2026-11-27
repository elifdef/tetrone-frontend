import { useState, useMemo, useContext, useCallback, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import UserService from '@/services/user.service';
import {
    notifySuccess,
    notifyLoading,
    dismissToast,
    notifyInfo,
} from '@/components/common/Notify';
import { validateImageFile } from '@/utils/upload';
import type { TipTapDoc, UserData } from '@/types/user';
import type {
    ProfileFieldName,
    ProfileFormErrors,
    ProfileFormState,
    ProfileFormTouched,
} from '../types/settings';

const normalizeIsoDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    return dateStr.split('T')[0].split(' ')[0].trim();
};

const isBioEmpty = (bio: TipTapDoc | string | null | undefined): boolean => {
    if (!bio) return true;
    if (typeof bio === 'string') return bio.trim() === '';
    if (!Array.isArray(bio.content) || bio.content.length === 0) return true;
    return bio.content.every(
        (node) =>
            node.type === 'paragraph' &&
            (!node.content ||
                node.content.length === 0 ||
                node.content.every((child) => child.type === 'text' && !child.text?.trim()))
    );
};

const areBiosEqual = (
    a: TipTapDoc | string | null | undefined,
    b: TipTapDoc | string | null | undefined
): boolean => {
    if (isBioEmpty(a) && isBioEmpty(b)) return true;
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
};

const isBirthdayToday = (birthDateIso: string, now: Date = new Date()): boolean => {
    const clean = normalizeIsoDate(birthDateIso);
    const parts = clean.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return false;

    const [, month, day] = parts;
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    if (todayMonth === month && todayDay === day) return true;

    const year = now.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (month === 2 && day === 29 && !isLeap) {
        return todayMonth === 2 && todayDay === 28;
    }

    return false;
};

const isWithinCooldownYear = (changedAtIso: string | null | undefined, now: Date = new Date()): boolean => {
    if (!changedAtIso) return false;
    const changedDate = new Date(changedAtIso);
    if (Number.isNaN(changedDate.getTime())) return false;

    const nextAllowed = new Date(changedDate);
    nextAllowed.setFullYear(nextAllowed.getFullYear() + 1);
    return nextAllowed.getTime() > now.getTime();
};

export interface ProfileFieldChangeEvent {
    target: {
        name: ProfileFieldName;
        value: string | number | TipTapDoc | null;
    };
}

export const useProfileSettings = (isSetupMode = false) => {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);

    const initialBirthDate = normalizeIsoDate(user?.birth_date);

    const [previewUser, setPreviewUser] = useState<UserData | null>(user);
    const [formData, setFormData] = useState<ProfileFormState>({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        bio: user?.bio || null,
        birth_date: initialBirthDate,
        country: user?.country || '',
        gender: Number(user?.gender || 0),
        avatarFile: null,
        removeAvatar: false,
    });

    const [touched, setTouched] = useState<ProfileFormTouched>({});
    const [submitted, setSubmitted] = useState(false);

    const birthDateStatus = useMemo(() => {
        if (!initialBirthDate) {
            return { canEdit: true, reason: null as 'cooldown' | 'not_birthday' | null };
        }
        if (isWithinCooldownYear(user?.birth_date_changed_at)) {
            return { canEdit: false, reason: 'cooldown' as const };
        }
        if (!isBirthdayToday(initialBirthDate)) {
            return { canEdit: false, reason: 'not_birthday' as const };
        }
        return { canEdit: true, reason: null as 'cooldown' | 'not_birthday' | null };
    }, [initialBirthDate, user?.birth_date_changed_at]);

    const rawErrors = useMemo<ProfileFormErrors>(() => {
        const errors: ProfileFormErrors = {};
        const trimmedFirst = formData.first_name.trim();
        const trimmedLast = formData.last_name.trim();

        if (!trimmedFirst) {
            errors.first_name = t('errors.required');
        } else if (trimmedFirst.length < 3) {
            errors.first_name = t('errors.min_length', { count: 3 });
        } else if (trimmedFirst.length > 50) {
            errors.first_name = t('errors.max_length', { count: 50 });
        }

        if (trimmedLast.length > 0 && trimmedLast.length < 3) {
            errors.last_name = t('errors.min_length', { count: 3 });
        } else if (trimmedLast.length > 50) {
            errors.last_name = t('errors.max_length', { count: 50 });
        }

        if (isSetupMode && !formData.birth_date) {
            errors.birth_date = t('errors.required');
        } else if (formData.birth_date) {
            const todayIso = new Date().toISOString().split('T')[0];
            if (formData.birth_date > todayIso) {
                errors.birth_date = t('errors.date_in_future');
            }
        }

        if (isSetupMode && Number(formData.gender) === 0) {
            errors.gender = t('errors.required');
        }

        return errors;
    }, [formData.first_name, formData.last_name, formData.birth_date, formData.gender, isSetupMode, t]);

    // Показуємо помилку в UI лише після blur (touched) або спроби відправки форми
    const visibleErrors = useMemo<ProfileFormErrors>(() => {
        const result: ProfileFormErrors = {};
        (Object.keys(rawErrors) as ProfileFieldName[]).forEach((field) => {
            if (submitted || touched[field]) {
                result[field] = rawErrors[field];
            }
        });
        return result;
    }, [rawErrors, submitted, touched]);

    const hasValidationErrors = Object.keys(rawErrors).length > 0;

    const isChanged = useMemo(() => {
        if (formData.first_name.trim() !== (user?.first_name || '').trim()) return true;
        if (formData.last_name.trim() !== (user?.last_name || '').trim()) return true;
        if (!areBiosEqual(formData.bio, user?.bio)) return true;
        if (formData.birth_date !== initialBirthDate) return true;
        if ((formData.country || '') !== (user?.country || '')) return true;
        if (Number(formData.gender) !== Number(user?.gender || 0)) return true;
        if (formData.avatarFile !== null) return true;
        if (formData.removeAvatar && Boolean(user?.avatar)) return true;
        return false;
    }, [formData, user, initialBirthDate]);

    const canSubmit = useMemo(() => {
        if (hasValidationErrors) return false;
        if (isSetupMode) {
            return (
                formData.first_name.trim().length >= 3 &&
                formData.birth_date !== '' &&
                Number(formData.gender) > 0
            );
        }
        return isChanged;
    }, [hasValidationErrors, isSetupMode, isChanged, formData.first_name, formData.birth_date, formData.gender]);

    const handleChange = useCallback((e: ProfileFieldChangeEvent) => {
        const { name, value } = e.target;
        const finalValue = name === 'gender' ? Number(value) : value;

        setFormData((prev) => ({ ...prev, [name]: finalValue }));
        setPreviewUser((prev) => (prev ? { ...prev, [name]: finalValue } : prev));
    }, []);

    const handleBlur = useCallback((fieldName: ProfileFieldName) => {
        setTouched((prev) => ({ ...prev, [fieldName]: true }));
    }, []);

    const handleFileChange = useCallback((e: { target: { files?: FileList | File[] | null } }) => {
        const file = e.target.files?.[0];
        if (!file || !validateImageFile(file)) return;

        const previewUrl = URL.createObjectURL(file);
        setPreviewUser((prev) => (prev ? { ...prev, avatar: previewUrl } : prev));
        setFormData((prev) => ({ ...prev, avatarFile: file, removeAvatar: false }));
    }, []);

    const handleRemoveAvatar = useCallback(() => {
        setPreviewUser((prev) => (prev ? { ...prev, avatar: null } : prev));
        setFormData((prev) => ({ ...prev, avatarFile: null, removeAvatar: true }));
    }, []);

    const buildPartialPayload = (): Record<string, unknown> | FormData => {
        const changedFields: Record<string, unknown> = {};

        if (isSetupMode) {
            changedFields.finish_setup = true;
        }

        const trimmedFirst = formData.first_name.trim();
        if (trimmedFirst !== (user?.first_name || '').trim()) {
            changedFields.first_name = trimmedFirst;
        }

        const trimmedLast = formData.last_name.trim();
        if (trimmedLast !== (user?.last_name || '').trim()) {
            changedFields.last_name = trimmedLast || null;
        }

        if (formData.birth_date !== initialBirthDate && formData.birth_date) {
            changedFields.birth_date = formData.birth_date;
        }

        if (!areBiosEqual(formData.bio, user?.bio)) {
            changedFields.bio = isBioEmpty(formData.bio) ? null : formData.bio;
        }

        const normalizedCountry = formData.country || '';
        if (normalizedCountry !== (user?.country || '')) {
            changedFields.country = normalizedCountry || null;
        }

        if (Number(formData.gender) !== Number(user?.gender || 0) && Number(formData.gender) > 0) {
            changedFields.gender = Number(formData.gender);
        }

        if (formData.removeAvatar && user?.avatar) {
            changedFields.remove_avatar = true;
        }

        if (formData.avatarFile) {
            const fd = new FormData();
            Object.entries(changedFields).forEach(([key, val]) => {
                if (val === null) {
                    fd.append(key, '');
                } else if (typeof val === 'boolean') {
                    fd.append(key, val ? '1' : '0');
                } else if (typeof val === 'object') {
                    fd.append(key, JSON.stringify(val));
                } else {
                    fd.append(key, String(val));
                }
            });
            fd.append('avatar', formData.avatarFile);
            return fd;
        }

        return changedFields;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        if (hasValidationErrors) {
            return;
        }

        if (!canSubmit) {
            notifyInfo(t('easter_eggs.same_info'));
            setPreviewUser((prev) =>
                prev
                    ? {
                          ...prev,
                          avatar: 'https://substackcdn.com/image/fetch/$s_!N8t_!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F25d56fff-096b-4f24-a996-149cc73e9cf6_1055x1212.jpeg',
                      }
                    : prev
            );
            setTimeout(() => {
                window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ?autoplay=1';
            }, 8000);
            return;
        }

        if (!user) return;

        const payload = buildPartialPayload();
        const toastId = notifyLoading(t('action.saving'));
        const didBirthDateChange = formData.birth_date !== initialBirthDate && Boolean(initialBirthDate);

        UserService.updateProfile(user.username, payload)
            .onSuccess((res) => {
                setUser((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        ...(previewUser || {}),
                        is_setup_complete: true,
                        birth_date_changed_at: didBirthDateChange
                            ? new Date().toISOString()
                            : prev.birth_date_changed_at,
                    };
                });

                if (isSetupMode) {
                    window.location.href = `/${user.username}`;
                } else {
                    notifySuccess(t(`code.${res.code || 'PROFILE_UPDATED'}`));
                    setFormData((prev) => ({ ...prev, avatarFile: null, removeAvatar: false }));
                    setSubmitted(false);
                }
            })
            .onFinally(() => {
                dismissToast(toastId);
            });
    };

    return {
        formData,
        previewUser,
        canSubmit,
        errors: visibleErrors,
        birthDateStatus,
        handleChange,
        handleBlur,
        handleFileChange,
        handleRemoveAvatar,
        handleSubmit,
        avatarFile: formData.avatarFile,
    };
};