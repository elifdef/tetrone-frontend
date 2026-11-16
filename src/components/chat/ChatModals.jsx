import CreateChatModal from './components/modals/CreateChatModal.jsx';
import JumpToDateModal from './components/modals/JumpToDateModal.jsx';
import ReportMessageModal from './components/modals/ReportMessageModal.jsx';

export default function ChatModals({
    friendsList = [],
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleCreateNewChat,
    isDateModalOpen,
    setIsDateModalOpen,
    selectedDateJump,
    setSelectedDateJump,
    onJumpToDate,
    reportModalState,
    setReportModalState,
    handleReportMessage
}) {
    return (
        <>
            <CreateChatModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                friendsList={friendsList}
                onCreateNewChat={handleCreateNewChat}
            />

            <JumpToDateModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                selectedDate={selectedDateJump}
                onChangeDate={setSelectedDateJump}
                onJump={onJumpToDate}
            />

            <ReportMessageModal
                isOpen={reportModalState.isOpen}
                onClose={() => setReportModalState({ isOpen: false, messageUuid: null })}
                onSubmit={(reason) => handleReportMessage(reportModalState.messageUuid, reason)}
            />
        </>
    );
}