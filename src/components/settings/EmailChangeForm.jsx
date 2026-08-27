import Button from '../ui/Button';
import Input from '../ui/Input';

const EmailChangeForm = ({
                             user,
                             email, setEmail,
                             passwordForEmail, setPasswordForEmail,
                             loading, onSubmit, t
                         }) => {
    const isVerified = Boolean(user?.email_verified_at);

    return (
        <div className="p-[12px_15px] border-b border-border last:border-b-0">
            <h2 className="m-0 mb-[10px] text-[11px] font-bold text-theme-link border-b border-border pb-[4px]">{t('settings.change_email')}</h2>

            <div className="bg-bg-page border border-border p-[8px_12px] mb-[15px] flex flex-col gap-[6px]">
                <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-muted">{t('settings.current_email')}:</span>
                    <span className="text-text-main font-bold">{user?.email}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-muted">{t('settings.verification_status')}:</span>
                    <span className={`font-bold ${isVerified ? 'text-theme-success' : 'text-[#f59e0b]'}`}>
                        {t(`common.${isVerified ? 'confirmed' : 'unconfirmed'}`)}
                    </span>
                </div>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col">
                <div className="mb-[12px]">
                    <Input
                        label={t('settings.new_email')}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="NewEmail@example.com"
                    />
                </div>

                <div className="mb-[12px]">
                    <Input
                        label={t('settings.account_password')}
                        type="password"
                        required
                        value={passwordForEmail}
                        onChange={(e) => setPasswordForEmail(e.target.value)}
                        placeholder="********"
                    />
                </div>

                <div className="flex justify-end mt-[5px]">
                    <Button type="submit" disabled={loading}>
                        {loading ? t('action.saving') : t('action.change')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EmailChangeForm;