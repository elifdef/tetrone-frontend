import { memo } from 'react';
import { formatFileSize } from "../../../utils/upload";
import AudioTrack from "./AudioTrack";

import EpsteinIcon from "../../../assets/filetypes/pdf.svg?react";
import RARIcon from "../../../assets/filetypes/rar.svg?react";
import ZIPIcon from "../../../assets/filetypes/zip.svg?react";
import DocIcon from "../../../assets/filetypes/word.svg?react";
import DefaultFileIcon from "../../../assets/filetypes/what.svg?react";

const getFileIcon = (fileName) => {
    if (!fileName) return <DefaultFileIcon width={24} height={24} />;
    const ext = fileName.split('.').pop().toLowerCase();

    if (['pdf'].includes(ext)) return <EpsteinIcon width={24} height={24} />;
    if (['zip', '7z', 'tar', 'gz'].includes(ext)) return <ZIPIcon width={24} height={24} />;
    if (['rar'].includes(ext)) return <RARIcon width={24} height={24} />;
    if (['doc', 'docx'].includes(ext)) return <DocIcon width={24} height={24} />;

    return <DefaultFileIcon width={24} height={24} />;
};

const PostDocuments = ({ documents = [], postId }) => {
    if (documents.length === 0) return null;

    return (
        <div className="flex flex-col mt-[10px] pt-[5px] border-t border-dashed border-border">
            {documents.map((doc) => {
                const ext = doc.file_name.split('.').pop().toLowerCase();
                const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext) || doc.type === 'audio';

                if (isAudio) {
                    return <AudioTrack key={doc.id} doc={doc} postId={postId} />;
                }

                // Ретро ВК-стайл: прості рядки без важких фонів
                return (
                    <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center py-[4px] px-[2px] no-underline group hover:bg-[rgba(128,128,128,0.05)] transition-colors"
                        download={doc.file_name}
                    >
                        <div className="w-[24px] h-[24px] mr-[8px] flex shrink-0 items-center justify-center text-text-muted opacity-80 group-hover:opacity-100 group-hover:text-theme-link transition-all">
                            {getFileIcon(doc.file_name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-theme-link truncate group-hover:underline" title={doc.file_name}>
                                {doc.file_name}
                            </span>
                            <span className="text-[9px] text-text-muted mt-[1px]">
                                {formatFileSize(doc.file_size)}
                            </span>
                        </div>
                    </a>
                );
            })}
        </div>
    );
};

export default memo(PostDocuments, (prev, next) => {
    return prev.postId === next.postId && prev.documents === next.documents;
});