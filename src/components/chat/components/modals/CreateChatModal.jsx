import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@ui/Button';
import Modal from '@components/modals/Modal.jsx';
import SmartEditor from '@components/editor/SmartEditor';
import { hasRichContent } from '../../utils/messageParser.js';

export default function CreateChatModal({
    isOpen,
    onClose,
    friendsList = [],
    onCreateNewChat
}) {
    const { t } = useTranslation();
    const [createMode, setCreateMode] = useState('dm');
    const [selectedFriendUsername, setSelectedFriendUsername] = useState(friendsList[0]?.username || '');
    const [newGroupTitle, setNewGroupTitle] = useState(null);
    const [newGroupDesc, setNewGroupDesc] = useState(null);
    const [newGroupMembers, setNewGroupMembers] = useState([]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (createMode === 'dm') {
            if (!selectedFriendUsername) return;
            onCreateNewChat({ isGroup: false, targetUsername: selectedFriendUsername });
        } else {
            if (!hasRichContent(newGroupTitle)) return;
            onCreateNewChat({
                isGroup: true,
                title: newGroupTitle,
                description: newGroupDesc,
                participantUsernames: newGroupMembers
            });
        }
        setNewGroupTitle(null);
        setNewGroupDesc(null);
        setNewGroupMembers([]);
        onClose();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('chat.modals.create_title')}
            sizeClass="modal-md"
            bodyClassName="p-[15px]"
        >
            <div className="flex flex-col gap-[12px] text-[11px]">
                <div className="flex gap-[8px] border-b border-border pb-[8px]">
                    <Button
                        variant={createMode === 'dm' ? 'primary' : 'secondary'}
                        onClick={() => setCreateMode('dm')}
                    >
                        {t('chat.modals.mode_dm')}
                    </Button>
                    <Button
                        variant={createMode === 'group' ? 'primary' : 'secondary'}
                        onClick={() => setCreateMode('group')}
                    >
                        {t('chat.modals.mode_group')}
                    </Button>
                </div>

                {createMode === 'dm' ? (
                    <div className="flex flex-col gap-[6px]">
                        <label className="font-bold text-text-muted">
                            {t('chat.modals.select_friend')}
                        </label>
                        <select
                            value={selectedFriendUsername}
                            onChange={(e) => setSelectedFriendUsername(e.target.value)}
                            className="p-[6px] bg-bg-box border border-border text-text-main outline-none"
                        >
                            {friendsList.map(f => (
                                <option key={f.username} value={f.username}>
                                    {f.first_name} {f.last_name} (@{f.username})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[10px]">
                        <div>
                            <div className="font-bold text-text-muted mb-[4px]">
                                {t('chat.info_modal.group_title')}
                            </div>
                            <div className="border border-border bg-bg-box">
                                <SmartEditor
                                    className="min-h-[38px] p-[6px] text-[12px] outline-none"
                                    value={newGroupTitle}
                                    onChange={setNewGroupTitle}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-text-muted mb-[4px]">
                                {t('chat.info_modal.group_desc')}
                            </div>
                            <div className="border border-border bg-bg-box">
                                <SmartEditor
                                    className="min-h-[54px] p-[6px] text-[12px] outline-none"
                                    value={newGroupDesc}
                                    onChange={setNewGroupDesc}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-text-muted mb-[4px]">
                                {t('chat.info_modal.participants')}
                            </div>
                            <div className="flex flex-col gap-[4px] max-h-[140px] overflow-y-auto p-[6px] border border-border bg-bg-page">
                                {friendsList.map(friend => {
                                    const checked = newGroupMembers.includes(friend.username);
                                    return (
                                        <label key={friend.username} className="flex items-center gap-[8px] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {
                                                    setNewGroupMembers(prev =>
                                                        checked
                                                            ? prev.filter(u => u !== friend.username)
                                                            : [...prev, friend.username]
                                                    );
                                                }}
                                            />
                                            <span>
                                                {friend.first_name} {friend.last_name} (@{friend.username})
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-[8px] mt-[8px]">
                    <Button variant="secondary" onClick={onClose}>
                        {t('chat.actions.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {t('chat.actions.new_chat')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}