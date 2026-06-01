import { avatar } from '../../utils/avatar';

export default function Avatar({ user, ...props }) {
    return (
        <img
            src={avatar(user)}
            alt={user?.username}
            {...props}
        />
    );
}