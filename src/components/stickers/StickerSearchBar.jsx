import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {SearchIcon} from "../ui/Icons.jsx";
import Input from "../ui/Input.jsx";

const searchSchema = z.object({
    query: z.string().optional()
});

export default function StickerSearchBar({initialValue = '', onSearch})
{
    const {t} = useTranslation();

    const {register, handleSubmit, setValue} = useForm({
        resolver:      zodResolver(searchSchema),
        defaultValues: {query: initialValue}
    });

    useEffect(() =>
    {
        setValue('query', initialValue);
    }, [initialValue, setValue]);

    const onSubmit = (data) =>
    {
        onSearch(data.query?.trim() || '');
    };

    return (
        <form className="flex mb-[15px]" onSubmit={handleSubmit(onSubmit)}>
            <div className="relative w-full flex items-center">
                <div className="absolute left-[8px] text-text-muted flex items-center">
                    <SearchIcon/>
                </div>
                <Input
                    type="text"
                    className="w-full pl-[28px] pr-[8px] py-[4px] border border-input-border bg-input-bg text-text-main text-[11px] focus:outline-none focus:border-border shadow-inner"
                    placeholder={t('stickers.search_placeholder')}
                    {...register('query')}
                />
            </div>
        </form>
    );
}