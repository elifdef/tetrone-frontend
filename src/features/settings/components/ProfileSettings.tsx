import { useTranslation } from 'react-i18next';
import { useProfileSettings } from '../hooks/useProfileSettings';
import UserProfileCard from '@/components/profile/UserProfileCard';
import Input from '@/components/ui/Input';
import DateInput from '@/components/ui/DateInput';
import Button from '@/components/ui/Button';
import ImageDropzone from '../../../components/ui/ImageDropzone';
import GenderSelect from './GenderSelect';
import CountrySelect from './CountrySelect';
import SmartEditor from '@/components/editor/SmartEditor';
import type { TipTapDoc } from '@/types/user';

export interface ProfileSettingsProps {
    isSetupMode?: boolean;
}

export default function ProfileSettings({ isSetupMode = false }: ProfileSettingsProps) {
    const { t } = useTranslation();

    const {
        formData,
        previewUser,
        canSubmit,
        errors,
        birthDateStatus,
        handleChange,
        handleBlur,
        handleFileChange,
        handleSubmit,
        avatarFile,
    } = useProfileSettings(isSetupMode);

    return (
        <div className="flex flex-col gap-[15px] w-full font-tahoma text-[11px] text-text-main rounded-none">
            <div className="w-full">
                <UserProfileCard currentUser={previewUser} isPreview={true} />
            </div>

            <div className="w-full bg-bg-box border border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] rounded-none">
                <form onSubmit={handleSubmit} noValidate className="flex flex-col">
                    <div className="p-[15px] border-b border-border last:border-b-0 flex flex-col gap-[15px]">
                        <div className="w-full">
                            <label className="block mb-[6px] font-bold text-text-main text-[11px]">
                                {t('common.avatar')}
                            </label>
                            <ImageDropzone
                                onFileSelect={handleFileChange}
                                fileName={avatarFile ? avatarFile.name : null}
                            />
                        </div>

                        <div className="flex gap-[15px] w-full max-md:flex-col">
                            <div className="flex-1">
                                <Input
                                    label={`${t('common.first_name')} *`}
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={(e) =>
                                        handleChange({
                                            target: { name: 'first_name', value: e.target.value },
                                        })
                                    }
                                    onBlur={() => handleBlur('first_name')}
                                    error={errors.first_name}
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    label={t('common.last_name')}
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={(e) =>
                                        handleChange({
                                            target: { name: 'last_name', value: e.target.value },
                                        })
                                    }
                                    onBlur={() => handleBlur('last_name')}
                                    error={errors.last_name}
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        <div className="flex gap-[15px] w-full max-md:flex-col">
                            <div className="flex-1">
                                <DateInput
                                    label={`${t('common.birthday')}${isSetupMode ? ' *' : ''}`}
                                    name="birth_date"
                                    value={formData.birth_date}
                                    disabled={!birthDateStatus.canEdit}
                                    onChange={(e) => {
                                        handleChange({
                                            target: { name: 'birth_date', value: e.target.value },
                                        });
                                        handleBlur('birth_date');
                                    }}
                                    error={errors.birth_date}
                                    required={isSetupMode}
                                />
                                {!birthDateStatus.canEdit && (
                                    <span className="block mt-[4px] text-[10px] text-text-muted">
                                        {birthDateStatus.reason === 'cooldown'
                                            ? t('settings.birth_date_cooldown_hint')
                                            : t('settings.birth_date_birthday_only_hint')}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1">
                                <CountrySelect
                                    name="country"
                                    value={formData.country}
                                    onChange={(e) => {
                                        handleChange({
                                            target: { name: 'country', value: e.target.value },
                                        });
                                        handleBlur('country');
                                    }}
                                />
                            </div>

                            <div className="flex-1">
                                <GenderSelect
                                    name="gender"
                                    label={`${t('common.gender')}${isSetupMode ? ' *' : ''}`}
                                    value={formData.gender}
                                    onChange={(e) => {
                                        handleChange({
                                            target: { name: 'gender', value: e.target.value },
                                        });
                                        handleBlur('gender');
                                    }}
                                    error={errors.gender}
                                    required={isSetupMode}
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            <label className="block mb-[6px] font-bold text-text-main text-[11px]">
                                {t('settings.about_me')}
                            </label>
                            <div className="w-full">
                                <SmartEditor
                                    value={(formData.bio as TipTapDoc | null) || null}
                                    onChange={(jsonContent: TipTapDoc) =>
                                        handleChange({
                                            target: { name: 'bio', value: jsonContent },
                                        })
                                    }
                                    preset="bio"
                                    placeholder={t('settings.about_me_placeholder')}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-[10px_15px] bg-bg-page flex justify-end border-t border-border w-full rounded-none">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!canSubmit}
                            className={
                                isSetupMode
                                    ? 'w-full py-[8px] text-[12px] rounded-none'
                                    : 'rounded-none'
                            }
                        >
                            {t(isSetupMode ? 'first_setup.save_and_finish' : 'action.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}