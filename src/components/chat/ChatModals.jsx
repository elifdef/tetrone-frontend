import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Modal from '../modals/Modal.jsx';
import SmartEditor from '../editor/SmartEditor';
import { hasRichContent } from './utils/messageParser.js';
import { ArrowRightSvg } from '../ui/Icons.jsx';

export default function ChatModals({
    friendsList = [],
    allChats = [],
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleCreateNewChat,
    forwardModalState,
    setForwardModalState,
    handleForwardMessages,
    isDateModalOpen,
    setIsDateModalOpen,
    selectedDateJump,
    setSelectedDateJump,
    onJumpToDate,
    reportModalState,
    setReportModalState,
    handleReportMessage,
    renderChatTitle
}) {
    const { t } = useTranslation();

    const [createMode, setCreateMode] = useState('dm');
    const [selectedFriendUsername, setSelectedFriendUsername] = useState(friendsList[0]?.username || '');
    const [newGroupTitle, setNewGroupTitle] = useState(null);
    const [newGroupDesc, setNewGroupDesc] = useState(null);
    const [newGroupMembers, setNewGroupMembers] = useState([]);

    const [forwardComment, setForwardComment] = useState('');
    const [reportReason, setReportReason] = useState('');

    const submitCreateChat = () => {
        if (createMode === 'dm') {
            if (!selectedFriendUsername) return;
            handleCreateNewChat({ isGroup: false, targetUsername: selectedFriendUsername });
        } else {
            if (!hasRichContent(newGroupTitle)) return;
            handleCreateNewChat({
                isGroup: true,
                title: newGroupTitle,
                description: newGroupDesc,
                participantUsernames: newGroupMembers
            });
        }
        setIsCreateModalOpen(false);
        setNewGroupTitle(null);
        setNewGroupDesc(null);
        setNewGroupMembers([]);
    };

    return (
        <>
            {/* СТВОРЕННЯ РОЗМОВИ */}
            {isCreateModalOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsCreateModalOpen(false)}
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
                                                    <span>{friend.first_name} {friend.last_name} (@{friend.username})</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-[8px] mt-[8px]">
                            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                                {t('chat.actions.cancel')}
                            </Button>
                            <Button variant="primary" onClick={submitCreateChat}>
                                {t('chat.actions.new_chat')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ПЕРЕСИЛАННЯ */}
            {forwardModalState.isOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setForwardModalState({ isOpen: false, messageUuids: [] })}
                    title={t('chat.modals.forward_title')}
                    sizeClass="modal-md"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col gap-[10px] text-[11px]">
                        <input
                            type="text"
                            value={forwardComment}
                            onChange={(e) => setForwardComment(e.target.value)}
                            placeholder={t('chat.modals.forward_comment_placeholder')}
                            className="w-full p-[6px] bg-bg-box border border-border text-text-main outline-none"
                        />
                        <div className="flex flex-col divide-y divide-border border border-border max-h-[240px] overflow-y-auto">
                            {allChats.map(target => (
                                <div
                                    key={target.slug}
                                    onClick={() => {
                                        handleForwardMessages(target.slug, forwardModalState.messageUuids, forwardComment);
                                        setForwardModalState({ isOpen: false, messageUuids: [] });
                                        setForwardComment('');
                                    }}
                                    className="flex items-center justify-between p-[8px_10px] hover:bg-bg-hover cursor-pointer"
                                >
                                    <div className="font-bold text-theme-link">
                                        {renderChatTitle(target)}
                                    </div>
                                    <span className="text-text-muted">
                                        <ArrowRightSvg />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            {/* ВИБІР ДАТИ */}
            {isDateModalOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsDateModalOpen(false)}
                    title={t('chat.viewer.select_date_title')}
                    sizeClass="modal-sm"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col gap-[10px] text-[11px]">
                        <input
                            type="date"
                            value={selectedDateJump}
                            onChange={(e) => setSelectedDateJump(e.target.value)}
                            className="p-[6px] bg-bg-box border border-border text-text-main outline-none"
                        />
                        <div className="flex justify-end gap-[8px]">
                            <Button variant="secondary" onClick={() => setIsDateModalOpen(false)}>
                                {t('chat.actions.cancel')}
                            </Button>
                            <Button variant="primary" onClick={onJumpToDate}>
                                {t('chat.modals.jump_to_date')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* СКАРГА */}
            {reportModalState.isOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setReportModalState({ isOpen: false, messageUuid: null })}
                    title={t('chat.modals.report_title')}
                    sizeClass="modal-sm"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col gap-[10px] text-[11px]">
                        <textarea
                            rows={3}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder={t('chat.modals.report_placeholder')}
                            className="w-full p-[6px] bg-bg-box border border-border text-text-main outline-none"
                        />
                        <div className="flex justify-end gap-[8px]">
                            <Button variant="secondary" onClick={() => setReportModalState({ isOpen: false, messageUuid: null })}>
                                {t('chat.actions.cancel')}
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    handleReportMessage(reportModalState.messageUuid, reportReason);
                                    setReportModalState({ isOpen: false, messageUuid: null });
                                    setReportReason('');
                                }}
                            >
                                {t('chat.modals.submit_report')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}