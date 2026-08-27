import React, { useState } from 'react';
import Input from '../ui/Input';
import PasswordStrengthBar from '../ui/PasswordStrengthBar';
import Button from '../ui/Button';

const PasswordChangeForm = ({
                                currentPassword, setCurrentPassword,
                                newPassword, setNewPassword,
                                confirmPassword, setConfirmPassword,
                                loading, onSubmit, t
                            }) => {
    const [newPasswordScore, setNewPasswordScore] = useState(0);

    return (
        <div className="p-[12px_15px] border-b border-border last:border-b-0">
            <h2 className="m-0 mb-[10px] text-[11px] font-bold text-theme-link border-b border-border pb-[4px]">
                {t('settings.change_password')}
            </h2>

            <form onSubmit={onSubmit} className="flex flex-col">
                <div className="mb-[12px]">
                    <Input
                        label={t('settings.current_password')}
                        type="password"
                        required
                        placeholder="********"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>

                <div className="mb-[12px]">
                    <Input
                        label={t('settings.new_password')}
                        type="password"
                        required
                        placeholder="********"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="mb-[12px]">
                    <Input
                        label={t('auth.password_confirmation')}
                        type="password"
                        required
                        placeholder="********"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                {/* Якщо PasswordStrengthBar має свої margins, він стане ідеально,
                    якщо ні — можна огорнути його в <div className="mb-[12px]"> */}
                <PasswordStrengthBar
                    password={newPassword}
                    onScoreChange={setNewPasswordScore}
                />

                <div className="flex justify-end mt-[5px]">
                    <Button
                        type="submit"
                        disabled={loading || (newPassword && newPasswordScore < 5)}
                    >
                        {loading ? t('action.saving') : t('action.save')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default PasswordChangeForm;