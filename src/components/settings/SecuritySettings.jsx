import { useSecuritySettings } from './hooks/useSecuritySettings';
import EmailChangeForm from './EmailChangeForm';
import PasswordChangeForm from './PasswordChangeForm';
import UsernameManager from './UsernameManager';
import DangerZone from './DangerZone';

const SecuritySettings = () => {
    const {
        user, fetchUserData,
        email, setEmail,
        passwordForEmail, setPasswordForEmail,
        loadingEmail, handleUpdateEmail,
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        loadingPass, handleUpdatePassword, t
    } = useSecuritySettings();

    return (
        <div className="flex flex-col gap-[15px] w-full font-tahoma text-[11px] text-text-main">
            <div className="w-full bg-bg-box border border-border flex flex-col">
                <UsernameManager
                    user={user}
                    t={t}
                    onUserUpdate={fetchUserData}
                />

                <EmailChangeForm
                    user={user}
                    email={email}
                    setEmail={setEmail}
                    passwordForEmail={passwordForEmail}
                    setPasswordForEmail={setPasswordForEmail}
                    loading={loadingEmail}
                    onSubmit={handleUpdateEmail}
                    t={t}
                />

                <PasswordChangeForm
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    loading={loadingPass}
                    onSubmit={handleUpdatePassword}
                    t={t}
                />

                <DangerZone t={t} />
            </div>
        </div>
    );
};

export default SecuritySettings;