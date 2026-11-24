import type { Dispatch, SetStateAction } from 'react';
import CreateChatModal from './modals/CreateChatModal';
import type { CreateGroupChatPayload } from './modals/CreateChatModal';
import JumpToDateModal from './modals/JumpToDateModal';
import ReportMessageModal from './modals/ReportMessageModal';
import type { UserData } from '@/types/user';

export interface ReportModalState {
    isOpen: boolean;
    messageUuid: string | null;
}

export interface ChatModalsProps {
    currentUser: UserData | null | undefined;
    friendsList?: UserData[];
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: Dispatch<SetStateAction<boolean>>;
    handleCreateNewChat: (payload: CreateGroupChatPayload) => void;
    isDateModalOpen: boolean;
    setIsDateModalOpen: Dispatch<SetStateAction<boolean>>;
    selectedDateJump: string;
    setSelectedDateJump: Dispatch<SetStateAction<string>>;
    onJumpToDate: () => void;
    reportModalState: ReportModalState;
    setReportModalState: Dispatch<SetStateAction<ReportModalState>>;
    handleReportMessage: (messageUuid: string | null, reason: string) => void;
}

export default function ChatModals({
    currentUser,
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
    handleReportMessage,
}: ChatModalsProps) {
    return (
        <>
            <CreateChatModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                currentUser={currentUser}
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