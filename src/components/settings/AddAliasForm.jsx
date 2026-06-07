import { useState, useEffect, useRef } from 'react';
import UserService from '../../services/user.service';
import Button from '../ui/Button';
import { notifySuccess, notifyError } from '../common/Notify';

export default function AddAliasForm({ t, onCancel, onSuccess }) {
    const [inputValue, setInputValue] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState(null);
    const [backendError, setBackendError] = useState('');
    const [loading, setLoading] = useState(false);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!inputValue || inputValue.length < 3) {
            setIsAvailable(null);
            setBackendError('');
            return;
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        setIsChecking(true);
        setIsAvailable(null);
        setBackendError('');

        typingTimeoutRef.current = setTimeout(async () => {
            const res = await UserService.checkUsernameAvailability(inputValue);
            setIsChecking(false);

            if (res.success && res.data) {
                setIsAvailable(res.data.available);
                if (!res.data.available) setBackendError(t('settings.username_taken'));
            } else {
                setIsAvailable(false);
                setBackendError(res.message);
            }
        }, 500);

        return () => clearTimeout(typingTimeoutRef.current);
    }, [inputValue, t]);

    const handleSubmit = async () => {
        if (!inputValue || isAvailable === false) return;
        setLoading(true);
        setBackendError('');

        const res = await UserService.addAlias(inputValue);
        setLoading(false);

        if (res.success) {
            notifySuccess(t('settings.alias_added_success'));
            onSuccess(inputValue);
        } else {
            setBackendError(res.message);
            notifyError(res.message);
        }
    };

    return (
        <>
            <div className="tetrone-modal-body">
                <p className="tetrone-modal-message">{t('settings.add_alias_msg')}</p>

                <div className="tetrone-input-with-icon-wrapper">
                    <input
                        type="text"
                        className={`tetrone-form-input ${isAvailable === false ? 'error' : ''} ${isAvailable === true ? 'success' : ''}`}
                        placeholder={t('settings.alias_placeholder')}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        disabled={loading}
                        autoFocus
                    />
                    <div className="tetrone-input-indicator">
                        {isChecking && <span className="tetrone-spinner-micro"></span>}
                        {!isChecking && isAvailable === true && <span className="tetrone-icon-success">✓</span>}
                        {!isChecking && isAvailable === false && <span className="tetrone-icon-error">✖</span>}
                    </div>
                </div>
                {backendError && <div className="tetrone-form-error tetrone-mt-8">{backendError}</div>}
            </div>

            <div className="tetrone-modal-footer">
                <Button variant="secondary" onClick={onCancel} disabled={loading}>{t('action.cancel')}</Button>
                <Button onClick={handleSubmit} disabled={loading || !inputValue || isAvailable === false || isChecking}>
                    {loading ? t('common.loading') : t('action.submit')}
                </Button>
            </div>
        </>
    );
}