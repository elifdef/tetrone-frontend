import { useTranslation } from 'react-i18next';

export const useGender = (genderValue) => {
    const { t } = useTranslation();

    const isFemale = genderValue === 2;
    const genderKey = isFemale ? 'female' : 'male';
    const genderSuffix = isFemale ? 'f' : 'm';

    const getGenderMap = (t) => ({
        1: {
            gender: t('common.male'),
            wrote_on_wall: t('post.wrote_on_wall_male'),
            restricted: (name) => t('profile.restricted_profile_male', { name }),
            last_seen: (time) => t('profile.status.last_seen_m', { time }),
            liked: t('notifications.liked_male'),
            commented: t('notifications.commented_male'),
            reposted: t('notifications.reposted_male'),
            wall_post: t('notifications.wall_post_male'),
            repost: t('notifications.repost_male'),
            wrote: t('notifications.wrote_male'),
            sent_image: t('notifications.sent_image_male'),
            sent_video: t('notifications.sent_video_male'),
            sent_file: t('notifications.sent_file_male'),
            mentioned: t('notifications.mentioned_male'),
            left_video: t('notifications.left_video_male'),
            left_image: t('notifications.left_image_male'),
            left_audio: t('notifications.left_audio_male'),
            left_poll: t('notifications.left_poll_male'),
            left_file: t('notifications.left_file_male'),
            left_post: t('notifications.left_post_male'),
        },
        2: {
            gender: t('common.female'),
            wrote_on_wall: t('post.wrote_on_wall_female'),
            restricted: (name) => t('profile.restricted_profile_female', { name }),
            last_seen: (time) => t('profile.status.last_seen_f', { time }),
            liked: t('notifications.liked_female'),
            commented: t('notifications.commented_female'),
            reposted: t('notifications.reposted_female'),
            wall_post: t('notifications.wall_post_female'),
            repost: t('notifications.repost_female'),
            wrote: t('notifications.wrote_female'),
            sent_image: t('notifications.sent_image_female'),
            sent_video: t('notifications.sent_video_female'),
            sent_file: t('notifications.sent_file_female'),
            mentioned: t('notifications.mentioned_female'),
            left_video: t('notifications.left_video_female'),
            left_image: t('notifications.left_image_female'),
            left_audio: t('notifications.left_audio_female'),
            left_poll: t('notifications.left_poll_female'),
            left_file: t('notifications.left_file_female'),
            left_post: t('notifications.left_post_female'),
        }
    });

    return { isFemale, genderKey, genderSuffix, getGenderMap };
};