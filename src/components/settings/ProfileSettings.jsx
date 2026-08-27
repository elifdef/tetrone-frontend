import { useTranslation } from 'react-i18next';
import { useProfileSettings } from './hooks/useProfileSettings';
import UserProfileCard from '../profile/UserProfileCard';

import Input from '../ui/Input';
import DateInput from '../ui/DateInput';
import Button from '../ui/Button';
import ImageDropzone from './ImageDropzone';
import GenderSelect from './GenderSelect';
import CountrySelect from './CountrySelect';
import SmartEditor from '../editor/SmartEditor'; // Використовуємо новий SmartEditor

export default function ProfileSettings({ isSetupMode = false }) {
    const { t } = useTranslation();

    const {
        formData,
        previewUser,
        canSubmit,
        handleChange,
        handleFileChange,
        handleSubmit,
        avatarFile
    } = useProfileSettings(isSetupMode);

    return (
        <div className={`flex flex-col gap-[15px] w-full font-tahoma text-[11px] text-text-main ${isSetupMode ? 'max-w-[600px] mx-auto' : ''}`}>
            <div className="w-full">
                <UserProfileCard currentUser={previewUser} isPreview={true} />
            </div>

            <div className="w-full bg-bg-box border border-border">
                <form onSubmit={handleSubmit} className="flex flex-col">

                    <div className="p-[12px_15px] border-b border-border last:border-b-0">
                        <div className="mb-[12px] relative w-full">
                            <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{t('common.avatar')}</label>
                            <ImageDropzone
                                onFileSelect={handleFileChange}
                                fileName={avatarFile ? avatarFile.name : null}
                            />
                        </div>

                        <div className="flex gap-[15px] w-full max-md:flex-col">
                            <div className="mb-[12px] relative flex-1">
                                <Input
                                    label={`${t('common.first_name')} *`}
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div className="mb-[12px] relative flex-1">
                                <Input
                                    label={t('common.last_name')}
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        <div className="flex gap-[15px] w-full max-md:flex-col mb-[12px]">
                            <div className="flex-1">
                                <DateInput
                                    label={`${t('common.birthday')} *`}
                                    name="birth_date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    required={isSetupMode}
                                />
                            </div>
                            <div className="flex-1">
                                <CountrySelect
                                    value={formData.country}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex-1">
                                <GenderSelect
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required={isSetupMode}
                                    label={`${t('common.gender')} *`}
                                />
                            </div>
                        </div>

                        <div className="mb-[12px] relative w-full">
                            <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{t('settings.about_me')}</label>
                            <div className="w-full">
                                {/* Використовуємо preset="bio", який відключає таблиці, заголовки тощо */}
                                <SmartEditor
                                    value={formData.bio}
                                    onChange={(jsonContent) => handleChange({ target: { name: 'bio', value: jsonContent } })}
                                    preset="bio"
                                    placeholder={t('settings.about_me_placeholder', 'Розкажіть про себе...')}
                                    className="w-full text-[12px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-[10px_15px] bg-bg-page flex justify-end border-t border-border w-full">
                        <Button
                            type="submit"
                            variant="save"
                            disabled={!canSubmit}
                            className={isSetupMode ? 'w-full' : ''}
                        >
                            {t(isSetupMode ? 'first_setup.save_and_finish' : 'action.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}