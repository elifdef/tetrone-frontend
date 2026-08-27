import { useState } from "react";
import SmartEditor from '../editor/SmartEditor';
import { isEditorEmpty } from "../../utils/editorHelpers";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { useTranslation } from 'react-i18next';

export default function CommentForm({ user, onSubmit, placeholder, onCancel }) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditorEmpty(content)) {
            return;
        }
        const finalContent = typeof content === 'object' ? content : {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }]
        };
        const success = await onSubmit(finalContent);
        if (success) {
            setContent('');
        }
    };

    return (
        <form className="flex gap-[10px] items-start mb-[15px]" onSubmit={handleSubmit}>
            {user && (
                <>
                    <Avatar user={user} className="w-[38px] h-[38px] border border-border object-cover rounded-[2px] flex-shrink-0" />
                    <div className="flex-1 flex flex-col min-w-0">
                        <SmartEditor
                            preset="comment"
                            placeholder={placeholder || t('action.write_comment')}
                            value={content}
                            onChange={setContent}
                        />

                        <div className="flex items-center gap-[10px] mt-[8px]">
                            <Button type="submit" disabled={isEditorEmpty(content)}>
                                {placeholder || t('action.send')}
                            </Button>
                            {onCancel && (
                                <Button type="button" variant="secondary" onClick={onCancel}>
                                    {t('action.cancel')}
                                </Button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </form>
    );
}