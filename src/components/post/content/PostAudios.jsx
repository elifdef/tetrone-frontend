import { memo } from 'react';
import AudioTrack from '../../ui/AudioTrack';

const PostAudios = ({ audios = [], postId }) => {
    if (!audios || audios.length === 0) return null;

    return (
        <div className="flex flex-col gap-[6px] mt-[8px]">
            {audios.map((audio) => (
                <AudioTrack
                    key={audio.id || audio.url}
                    doc={audio}
                    sourceInfo={postId ? { type: 'post', id: postId, url: `/post/${postId}` } : null}
                />
            ))}
        </div>
    );
};

export default memo(PostAudios, (prev, next) => {
    return prev.postId === next.postId && prev.audios === next.audios;
});