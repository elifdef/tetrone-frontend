import { useState, useRef } from "react";
import { Link } from "react-router";
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
    const [step, setStep] = useState(1);
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
            setSuccessMsg(t('auth.code_sent_success'));
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
            <div className="p-[20px] text-center">
                <div className="bg-[rgba(75,179,75,0.1)] text-theme-success border border-[rgba(75,179,75,0.3)] p-[15px] rounded-[2px] mb-[15px]">
                    <span className="font-bold text-[13px] block mb-[5px]">
                        {t('auth.password_reset_success')}
                    </span>
                    <Link to="/login" className="text-theme-link no-underline hover:underline text-[11px]">
                        {t('action.go_to_login')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-[15px] flex flex-col gap-[12px]">
            {successMsg && (step === 2 || step === 3) && (
                <div className="bg-[rgba(75,179,75,0.1)] text-theme-success border border-[rgba(75,179,75,0.3)] p-[8px] text-[11px] rounded-[2px] text-center">
                    {successMsg}
                </div>
            )}

            {error && (
                <div className="bg-[rgba(255,51,71,0.1)] text-theme-error border border-[rgba(255,51,71,0.3)] p-[8px] text-[11px] rounded-[2px] text-center">
                    {error}
                </div>
            )}

            {step === 1 && (
                <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="flex flex-col gap-[12px]">
                    <p className="m-0 text-text-muted text-center leading-[1.4]">
                        {t('auth.forgot_password_instruction')}
                    </p>
                    <Input
                        type="email"
                        id="reset-email"
                        label={t('auth.email')}
                        {...registerEmail("email")}
                        error={emailErrors.email}
                    />
                    <Button type="submit" disabled={isEmailSubmitting} className="w-full">
                        {isEmailSubmitting ? t('common.loading') : t('action.get_code')}
                    </Button>
                </form>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center gap-[15px]">
                    <p className="m-0 text-text-muted text-center leading-[1.4]">
                        {t('auth.enter_code_sent_to')} <b className="text-text-main">{savedEmail}</b>
                    </p>

                    <div className="flex gap-[6px]" onPaste={handleCodePaste}>
                        {codeDigits.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                maxLength="1"
                                className="w-[32px] h-[36px] text-center border border-input-border bg-input-bg text-text-main text-[16px] font-bold rounded-[2px] focus:border-theme-link focus:outline-none transition-colors"
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                disabled={isVerifyingCode}
                            />
                        ))}
                    </div>

                    {isVerifyingCode && (
                        <div className="text-text-muted italic">
                            {t('common.loading')}...
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-[12px]">
                    <p className="m-0 text-text-muted text-center leading-[1.4]">
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

                    <Button type="submit" disabled={isPasswordSubmitting || (currentPassword && passwordScore < 5)} className="w-full">
                        {isPasswordSubmitting ? t('common.loading') : t('action.save_password')}
                    </Button>
                </form>
            )}

            {step < 4 && (
                <div className="mt-[10px] pt-[12px] border-t border-border text-center">
                    <Link to="/login" className="text-theme-link no-underline hover:underline text-[11px] font-bold">
                        {t('action.back_to_login')}
                    </Link>
                </div>
            )}
        </div>
    );
}