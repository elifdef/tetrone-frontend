import { useState } from "react";
import { usePostMedia } from "../hooks/usePostMedia";
import { isOnlyStickers } from "../../../utils/editorHelpers";
import RichText from "../../common/RichText";
import PostGallery from "./PostGallery";
import PostVideos from "./PostVideos";
import PostAudios from "./PostAudios";
import PostDocuments from "./PostDocuments";
import PostPoll from "./PostPoll";
import PhotoModal from "../../modals/PhotoModal.jsx";

export default function PostContent({ content: originalContent, post, onUpdate, isOwner, className }) {
    const { content, local, external } = usePostMedia(
        originalContent,
        post?.attachments,
        { removed_previews: post?.youtube_settings?.removed_previews }
    );

    const [selectedImageId, setSelectedImageId] = useState(null);
    const bigStickersClass = isOnlyStickers(content) ? 'post-only-stickers' : ''; // Наш клас із global.css

    return (
        <div className={`text-[11px] leading-[1.4] ${bigStickersClass} ${className || ''}`}>
            <RichText text={content} />

            {post?.poll && (
                <PostPoll poll={post.poll} postId={post.id} isOwner={isOwner} />
            )}

            <PostVideos localVideos={local.videos} youtubeVideos={external.youtube} />
            <PostGallery images={local.images} onMediaClick={setSelectedImageId} />
            <PostAudios audios={local.audios} postId={post.id} />
            <PostDocuments documents={local.documents} />

            {selectedImageId !== null && (
                <PhotoModal
                    isOpen={selectedImageId !== null}
                    mediaId={selectedImageId}
                    post={post}
                    onClose={() => setSelectedImageId(null)}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
}