import { useTranslation } from 'react-i18next';

export const useGender = (genderValue) => {
    const { t } = useTranslation();

    const getGenderMap = (t) => ({
        1: {
            liked: t('notifications.liked_male'),
            commented: t('notifications.commented_male'),
            reposted: t('notifications.reposted_male'),
            wall_post: t('notifications.wall_post_male'),
            repost: t('notifications.repost_male'),
            wrote: t('notifications.wrote_male'),
            mentioned: t('notifications.mentioned_male'),
            left_video: t('notifications.left_video_male'),
            left_image: t('notifications.left_image_male'),
            left_audio: t('notifications.left_audio_male'),
            left_poll: t('notifications.left_poll_male'),
            left_file: t('notifications.left_file_male'),
            left_post: t('notifications.left_post_male'),
            reacted: t('notifications.reacted_male'),
            accepted_friend: t('notifications.accepted_friend_male'),
            voted: t('notifications.voted_male'),
        },
        
        2: {
            liked: t('notifications.liked_female'),
            commented: t('notifications.commented_female'),
            reposted: t('notifications.reposted_female'),
            wall_post: t('notifications.wall_post_female'),
            repost: t('notifications.repost_female'),
            wrote: t('notifications.wrote_female'),
            mentioned: t('notifications.mentioned_female'),
            left_video: t('notifications.left_video_female'),
            left_image: t('notifications.left_image_female'),
            left_audio: t('notifications.left_audio_female'),
            left_poll: t('notifications.left_poll_female'),
            left_file: t('notifications.left_file_female'),
            left_post: t('notifications.left_post_female'),
            reacted: t('notifications.reacted_female'),
            accepted_friend: t('notifications.accepted_friend_female'),
            voted: t('notifications.voted_female'),
        }
    });

    return { getGenderMap };
};