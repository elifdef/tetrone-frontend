import { useState } from "react";
import SendIcon from "../../assets/sendComment.svg?react";
import Editor from '../editor/Editor';
import { isEditorEmpty } from "../../utils/editorHelpers";
import Avatar from "../ui/Avatar";
import { CloseIcon } from "../ui/Icons";

export default function CommentForm({ user, onSubmit, placeholder, onCancel })
{
    const [content, setContent] = useState('');

    const handleSubmit = async (e) =>
    {
        e.preventDefault();
        if (isEditorEmpty(content))
        {
            return;
        }
        const finalContent = typeof content === 'object' ? content : {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }]
        };
        const success = await onSubmit(finalContent);
        if (success)
        {
            setContent('');
        }
    };

    return (
        <form className="tetrone-comment-form" onSubmit={ handleSubmit }>
            { user && (
                <>
                    <Avatar user={ user } className="tetrone-comment-avatar-input square-avatar"/>
                    <div className="tetrone-comment-input-wrapper">
                        <div className="tetrone-comment-input-row">
                            <Editor
                                className="tetrone-comment-textarea"
                                placeholder={ placeholder }
                                value={ content }
                                onChange={ setContent }
                            />

                            <div
                                style={ { display: 'flex', gap: '8px', alignItems: 'flex-end', paddingBottom: '8px' } }>
                                { onCancel && (
                                    <button type="button" className="tetrone-action-icon" onClick={ onCancel }
                                            title="Скасувати">
                                        <CloseIcon width={ 16 } height={ 16 }/>
                                    </button>
                                ) }
                                <button type="submit" className="tetrone-send-btn" disabled={ isEditorEmpty(content) }>
                                    <SendIcon width={ 16 } height={ 16 }/>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) }
        </form>
    );
}