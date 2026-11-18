import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useOnClickOutside from '@/components/editor/hooks/useOnClickOutside';
import Avatar from '@/components/ui/Avatar';

export default function IdentitySwitcher({ currentUser, ownedSpaces, selectedUsername, onChangeIdentity }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useOnClickOutside(ref, () => setIsOpen(false));

    const currentEntity = currentUser.username === selectedUsername
        ? currentUser
        : (ownedSpaces.find(s => s.username === selectedUsername) || currentUser);

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                type="button"
                className="w-[38px] h-[38px] rounded-[2px] overflow-hidden cursor-pointer hover:ring-[2px] hover:ring-theme-link transition-all border border-border p-0 bg-bg-box"
                onClick={() => setIsOpen(!isOpen)}
                title={t('editor.write_as')}
            >
                <Avatar user={currentEntity} className="w-full h-full object-cover" />
            </button>

            {isOpen && (
                <div className="absolute top-[42px] left-0 w-[200px] bg-bg-box border border-border shadow-sm flex flex-col py-[2px] z-[100] rounded-[2px]">
                    <div className="px-[8px] py-[4px] text-[10px] font-bold text-text-muted bg-bg-page border-b border-border">
                        {t('editor.write_as_label')}
                    </div>

                    <button
                        type="button"
                        className={`w-full text-left px-[8px] py-[6px] flex items-center gap-[6px] hover:bg-bg-page transition-colors cursor-pointer border-none outline-none text-theme-link hover:underline ${
                            selectedUsername === currentUser.username ? 'bg-bg-page' : 'bg-transparent'
                        }`}
                        onClick={() => { onChangeIdentity(currentUser.username); setIsOpen(false); }}
                    >
                        <Avatar user={currentUser} className="w-[18px] h-[18px] rounded-[2px] shrink-0 object-cover" />
                        <span className="text-[11px] font-bold truncate">
                            {currentUser.first_name || currentUser.username}
                        </span>
                    </button>

                    {ownedSpaces.length > 0 && (
                        <>
                            <div className="px-[8px] py-[4px] mt-[2px] text-[10px] font-bold text-text-muted bg-bg-page border-y border-border">
                                {t('editor.my_spaces')}
                            </div>
                            <div className="max-h-[180px] overflow-y-auto flex flex-col">
                                {ownedSpaces.map(space => (
                                    <button
                                        key={space.username}
                                        type="button"
                                        className={`w-full text-left px-[8px] py-[6px] flex items-center gap-[6px] hover:bg-bg-page transition-colors cursor-pointer border-none outline-none text-theme-link hover:underline ${
                                            selectedUsername === space.username ? 'bg-bg-page' : 'bg-transparent'
                                        }`}
                                        onClick={() => { onChangeIdentity(space.username); setIsOpen(false); }}
                                    >
                                        <Avatar user={space} className="w-[18px] h-[18px] rounded-[2px] shrink-0 object-cover" />
                                        <span className="text-[11px] font-bold truncate">
                                            {space.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}