import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AuthService from "../../services/auth.service";
import PasswordStrengthBar from "../ui/PasswordStrengthBar";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function RegisterForm() {
    const { t } = useTranslation();
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [passwordScore, setPasswordScore] = useState(0);

    // 1. СТВОРЮЄМО СХЕМУ ВАЛІДАЦІЇ ZOD
    const registerSchema = z.object({
        username: z.string().min(3, t('validation.min_3_chars')),
        email: z.string().email(t('validation.invalid_email')),
        password: z.string().min(8, t('validation.min_8_chars')),
        password_confirmation: z.string()
    }).refine((data) => data.password === data.password_confirmation, {
        message: t('auth.password_not_match'),
        path: ["password_confirmation"], // Де показати помилку
    });

    // 2. ПІДКЛЮЧАЄМО REACT HOOK FORM
    const {
        register,         // Реєструє інпути
        handleSubmit,     // Обгортка для сабміту
        watch,            // Слідкує за значеннями (нам треба для прогресбару)
        setError,         // Щоб ставити помилки з бекенду
        formState: { errors, isSubmitting } // isSubmitting заміняє наш loading!
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onBlur" // Валідація спрацює, коли юзер забере фокус з інпуту
    });

    // Слідкуємо за паролем для прогресбару
    const currentPassword = watch("password", "");

    // 3. ФУНКЦІЯ САБМІТУ (спрацює ТІЛЬКИ якщо Zod сказав "все ок")
    const onSubmit = async (data) => {
        if (passwordScore < 5) {
            setMsg({ text: t('auth.password_too_weak'), type: "error" });
            return;
        }

        setMsg({ text: "", type: "" });

        const res = await AuthService.signUp(data);

        if (res.success) {
            setMsg({
                text: (
                    <span className="tetrone-auth-success-text">
                        {res.message || t('auth.you_have_registered')}<br />
                        <Link to="/login" className="tetrone-link tetrone-auth-msg-link">
                            {t('action.login')}
                        </Link>
                    </span>
                ),
                type: "success"
            });
        } else {
            // Якщо помилка прийшла з бекенду (наприклад, "email зайнятий")
            setMsg({ text: res.message || t('error.action_failed'), type: "error" });

            // Опціонально: можна прив'язати бекенд-помилку до конкретного поля:
            // if (res.code === 'ERR_EMAIL_TAKEN') setError('email', { message: res.message });
        }
    };

    if (msg.type === "success") {
        return (
            <div className="tetrone-auth-success-wrapper">
                <div className="tetrone-auth-msg success tetrone-auth-success-hero">
                    <div className="tetrone-auth-success-icon" />
                    <div className="tetrone-auth-success-content">{msg.text}</div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="tetrone-auth-form">
            <Input
                id="reg-username"
                label={t('auth.username')}
                autoComplete="off"
                {...register("username")}
                error={errors.username}
            />

            <Input
                type="email"
                id="reg-email"
                label={t('auth.email')}
                autoComplete="username"
                {...register("email")}
                error={errors.email}
            />

            <div className="tetrone-form-row">
                <div className="tetrone-form-group" style={{ width: '100%' }}>
                    <Input
                        type="password"
                        id="reg-password"
                        label={t('auth.password')}
                        autoComplete="new-password"
                        {...register("password")}
                        error={errors.password}
                    />
                </div>
                <div className="tetrone-form-group" style={{ width: '100%' }}>
                    <Input
                        type="password"
                        id="reg-confirm"
                        label={t('auth.password_confirmation')}
                        autoComplete="new-password"
                        {...register("password_confirmation")}
                        error={errors.password_confirmation}
                    />
                </div>
            </div>

            <PasswordStrengthBar password={currentPassword} onScoreChange={setPasswordScore} />

            {msg.type === "error" && (
                <div className="tetrone-auth-msg error">
                    {msg.text}
                </div>
            )}

            <Button
                className="tetrone-btn tetrone-btn-block"
                type="submit"
                disabled={isSubmitting || (currentPassword && passwordScore < 5)}
            >
                {isSubmitting ? t('common.loading') : t('action.register')}
            </Button>

            <div className="tetrone-auth-footer">
                {t('auth.already_have_account')}{' '}
                <Link to="/login" className="tetrone-link">
                    {t('action.login')}
                </Link>
            </div>
        </form>
    );
}