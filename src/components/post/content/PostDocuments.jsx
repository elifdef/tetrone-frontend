import { memo } from 'react';
import { formatFileSize } from "../../../utils/upload";
import FileTypeIcon from '../../ui/FileTypeIcon';

const PostDocuments = ({ documents = [] }) => {
    if (!documents || documents.length === 0) return null;

    return (
        <div className="flex flex-col">
            {documents.map((doc) => {
                const displayName = doc.original_name || doc.file_name || 'file';

                return (
                    <a
                        key={doc.id || doc.url}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center py-[4px] px-[2px] no-underline group hover:bg-[rgba(128,128,128,0.05)] transition-colors"
                        download={displayName}
                    >
                        <div className="w-[24px] h-[24px] mr-[8px] flex shrink-0 items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                            <FileTypeIcon fileName={displayName} size={24} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span
                                className="text-[11px] font-bold text-theme-link truncate group-hover:underline"
                                title={displayName}
                            >
                                {displayName}
                            </span>
                            {doc.file_size > 0 && (
                                <span className="text-[9px] text-text-muted mt-[1px]">
                                    {formatFileSize(doc.file_size)}
                                </span>
                            )}
                        </div>
                    </a>
                );
            })}
        </div>
    );
};

export default memo(PostDocuments, (prev, next) => {
    return prev.documents === next.documents;
});