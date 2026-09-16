import { useTranslation } from 'react-i18next';
import { useProfileSettings } from './hooks/useProfileSettings';
import UserProfileCard from '../profile/UserProfileCard';

import Input from '../ui/Input';
import DateInput from '../ui/DateInput';
import Button from '../ui/Button';
import ImageDropzone from './ImageDropzone';
import GenderSelect from './GenderSelect';
import CountrySelect from './CountrySelect';
import SmartEditor from '../editor/SmartEditor';

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
        <div className="flex flex-col gap-[15px] w-full font-tahoma text-[11px] text-text-main">
            {/* Попередній перегляд картки */}
            <div className="w-full">
                <UserProfileCard currentUser={previewUser} isPreview={true} />
            </div>

            {/* Форма налаштувань */}
            <div className="w-full bg-bg-box border border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] rounded-[3px]">
                <form onSubmit={handleSubmit} className="flex flex-col">

                    <div className="p-[15px] border-b border-border last:border-b-0 flex flex-col gap-[15px]">

                        {/* Аватар */}
                        <div className="w-full">
                            <label className="block mb-[6px] font-bold text-text-main text-[11px]">
                                {t('common.avatar')}
                            </label>
                            <ImageDropzone
                                onFileSelect={handleFileChange}
                                fileName={avatarFile ? avatarFile.name : null}
                            />
                        </div>

                        {/* Ім'я та Прізвище */}
                        <div className="flex gap-[15px] w-full max-md:flex-col">
                            <div className="flex-1">
                                <Input
                                    label={`${t('common.first_name')} *`}
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    label={t('common.last_name')}
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    maxLength={50}
                                />
                            </div>
                        </div>
                        {/* Дата народження, Країна, Стать */}
                        <div className="flex gap-[15px] w-full max-md:flex-col">
                            <div className="flex-1">
                                <DateInput
                                    label={`${t('common.birthday')} *`}
                                    name="birth_date" // Тут name був, але краще підстрахувати onChange
                                    value={formData.birth_date}
                                    onChange={(eOrVal) => {
                                        const value = eOrVal?.target ? eOrVal.target.value : eOrVal;
                                        handleChange({ target: { name: 'birth_date', value } });
                                    }}
                                    required={isSetupMode}
                                />
                            </div>
                            <div className="flex-1">
                                <CountrySelect
                                    name="country" // ДОДАНО
                                    value={formData.country}
                                    onChange={(eOrVal) => {
                                        const value = eOrVal?.target ? eOrVal.target.value : eOrVal;
                                        handleChange({ target: { name: 'country', value } });
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <GenderSelect
                                    name="gender" // ДОДАНО
                                    label={`${t('common.gender')} *`}
                                    value={formData.gender}
                                    onChange={(eOrVal) => {
                                        const value = eOrVal?.target ? eOrVal.target.value : eOrVal;
                                        handleChange({ target: { name: 'gender', value } });
                                    }}
                                    required={isSetupMode}
                                />
                            </div>
                        </div>

                        {/* Про себе (Біо) */}
                        <div className="w-full">
                            <label className="block mb-[6px] font-bold text-text-main text-[11px]">
                                {t('settings.about_me')}
                            </label>
                            <div className="w-full">
                                <SmartEditor
                                    value={formData.bio}
                                    onChange={(jsonContent) => handleChange({ target: { name: 'bio', value: jsonContent } })}
                                    preset="bio"
                                    placeholder={t('settings.about_me_placeholder', 'Розкажіть про себе...')}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Футер з кнопкою */}
                    <div className="p-[10px_15px] bg-bg-page flex justify-end border-t border-border w-full rounded-b-[3px]">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!canSubmit}
                            className={isSetupMode ? 'w-full py-[8px] text-[12px]' : ''}
                        >
                            {t(isSetupMode ? 'first_setup.save_and_finish' : 'action.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}