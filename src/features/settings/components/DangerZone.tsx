import { useState } from 'react';
import type { TFunction } from 'i18next';
import Button from '@/components/ui/Button';
import DeleteAccountModal from './modals/DeleteAccountModal';

export interface DangerZoneProps {
    t: TFunction;
}

const DangerZone = ({ t }: DangerZoneProps) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
        <>
            <div className="border border-theme-error bg-[rgba(230,70,70,0.05)] p-[10px_15px]">
                <div className="flex justify-between items-center gap-[15px] max-md:flex-col max-md:items-start">
                    <div className="flex-1">
                        <h2 className="m-0 mb-[4px] text-[11px] font-bold text-theme-error">
                            {t('settings.account_delete.danger_zone')}
                        </h2>

                        {t('easter_eggs.quote') && (
                            <div className="italic text-text-muted text-[11px] mb-[6px] border-l-[2px] border-theme-error pl-[8px] whitespace-pre-line leading-[1.4]">
                                {t('easter_eggs.quote')}
                            </div>
                        )}

                        <p className="m-0 text-[11px] text-text-main">
                            {t('settings.account_delete.warning')}
                        </p>
                    </div>
                    <div className="flex-shrink-0 max-md:w-full">
                        <Button
                            variant="danger"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="max-md:w-full"
                        >
                            {t('settings.account_delete.button')}
                        </Button>
                    </div>
                </div>
            </div>

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        </>
    );
};

export default DangerZone;