import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import authService from "../../services/auth.service";
import Input from "../ui/Input";
import Button from "../ui/Button";
import PasswordStrengthBar from "../ui/PasswordStrengthBar";

export default function ForgotPasswordForm() {
    const { t } = useTranslation();
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password, 4: Success
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [passwordScore, setPasswordScore] = useState(0);

    const [savedEmail, setSavedEmail] = useState("");
    const [savedCode, setSavedCode] = useState("");

    const emailSchema = z.object({
        email: z.string().email(t('validation.invalid_email'))
    });

    const passwordSchema = z.object({
        password: z.string().min(8, t('validation.min_8_chars')),
        password_confirmation: z.string()
    }).refine((data) => data.password === data.password_confirmation, {
        message: t('auth.password_not_match'),
        path: ["password_confirmation"],
    });

    const {
        register: registerEmail,
        handleSubmit: handleEmailSubmit,
        formState: { errors: emailErrors, isSubmitting: isEmailSubmitting }
    } = useForm({ resolver: zodResolver(emailSchema) });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        watch: watchPassword,
        formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
    } = useForm({ resolver: zodResolver(passwordSchema) });

    const currentPassword = watchPassword("password", "");

    const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);

    const onEmailSubmit = async (data) => {
        setError(null);
        const res = await authService.forgotPassword(data.email);

        if (res.success) {
            setSavedEmail(data.email);
            setSuccessMsg(res.message || t('auth.code_sent_success'));
            setStep(2);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } else {
            setError(res.message || t('error.something_went_wrong'));
        }
    };

    const handleCodeChange = async (index, value) => {
        if (!/^[0-9]*$/.test(value)) return;

        const newDigits = [...codeDigits];
        newDigits[index] = value;
        setCodeDigits(newDigits);
        setError(null);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }

        const fullCode = newDigits.join('');
        if (fullCode.length === 6) {
            await verifyCodeAuto(fullCode);
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleCodePaste = async (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newDigits = [...codeDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pastedData[i] || '';
        }
        setCodeDigits(newDigits);

        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex].focus();

        if (pastedData.length === 6) {
            await verifyCodeAuto(pastedData);
        }
    };

    const verifyCodeAuto = async (codeToVerify) => {
        setIsVerifyingCode(true);
        const res = await authService.verifyResetCode(savedEmail, codeToVerify);
        setIsVerifyingCode(false);

        if (res.success) {
            setSavedCode(codeToVerify);
            setSuccessMsg(null);
            setStep(3);
        } else {
            setError(t('error.invalid_code'));
            setCodeDigits(['', '', '', '', '', '']);
            inputRefs.current[0].focus();
        }
    };

    const onPasswordSubmit = async (data) => {
        if (passwordScore < 5) {
            setError(t('auth.password_too_weak'));
            return;
        }

        setError(null);
        const res = await authService.resetPassword(
            savedEmail,
            savedCode,
            data.password,
            data.password_confirmation
        );

        if (res.success) {
            setStep(4);
        } else {
            setError(res.message || t('error.something_went_wrong'));
        }
    };

    if (step === 4) {
        return (
            <div className="tetrone-auth-success-wrapper">
                <div className="tetrone-auth-success-icon">✅</div>
                <div className="tetrone-auth-msg success">
                    {t('auth.password_reset_success')}
                </div>
                <Link to="/login" className="tetrone-landing-btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>
                    {t('action.go_to_login')}
                </Link>
            </div>
        );
    }

    return (
        <div className="tetrone-auth-form-container">
            {successMsg && (step === 2 || step === 3) && (
                <div className="tetrone-auth-msg success">{successMsg}</div>
            )}

            {error && (
                <div className="tetrone-auth-msg error">{error}</div>
            )}

            {step === 1 && (
                <form onSubmit={handleEmailSubmit(onEmailSubmit)}>
                    <p className="tetrone-landing-auth-text" style={{ marginBottom: '15px' }}>
                        {t('auth.forgot_password_instruction')}
                    </p>
                    <Input
                        type="email"
                        id="reset-email"
                        label={t('auth.email')}
                        {...registerEmail("email")}
                        error={emailErrors.email}
                    />
                    <Button disabled={isEmailSubmitting}>
                        {isEmailSubmitting ? t('common.loading') : t('action.get_code')}
                    </Button>
                </form>
            )}

            {step === 2 && (
                <div className="tetrone-code-step">
                    <p className="tetrone-landing-auth-text" style={{ textAlign: 'center', marginBottom: '15px' }}>
                        {t('auth.enter_code_sent_to')} <b>{savedEmail}</b>
                    </p>

                    <div className="tetrone-code-inputs-wrapper" onPaste={handleCodePaste}>
                        {codeDigits.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                maxLength="1"
                                className="tetrone-code-single-input"
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                disabled={isVerifyingCode}
                            />
                        ))}
                    </div>

                    {isVerifyingCode && (
                        <div className="tetrone-landing-auth-text" style={{ textAlign: 'center', marginTop: '10px' }}>
                            {t('common.loading')}...
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                    <p className="tetrone-landing-auth-text" style={{ marginBottom: '15px' }}>
                        {t('auth.enter_new_password_instruction')}
                    </p>
                    <Input
                        type="password"
                        id="reset-new-password"
                        label={t('auth.new_password')}
                        {...registerPassword("password")}
                        error={passwordErrors.password}
                    />
                    <Input
                        type="password"
                        id="reset-confirm-password"
                        label={t('auth.confirm_new_password')}
                        {...registerPassword("password_confirmation")}
                        error={passwordErrors.password_confirmation}
                    />

                    <PasswordStrengthBar password={currentPassword} onScoreChange={setPasswordScore} />

                    <Button disabled={isPasswordSubmitting || (currentPassword && passwordScore < 5)}>
                        {isPasswordSubmitting ? t('common.loading') : t('action.save_password')}
                    </Button>
                </form>
            )}

            {step < 4 && (
                <div className="tetrone-auth-footer">
                    <Link to="/login" className="tetrone-link">
                        {t('action.back_to_login')}
                    </Link>
                </div>
            )}
        </div>
    );
}