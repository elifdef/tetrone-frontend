export const mockCurrentUser = {
    id: 1,
    username: 'admin',
    first_name: 'Admin',
    last_name: 'Super',
    avatar: null
};

// Інші користувачі для групових чатів
const userAndrew = { id: 2, username: 'elifdef', first_name: 'Andrew', last_name: 'Dev', avatar: null, last_seen_at: new Date().toISOString() };
const userMaria = { id: 3, username: 'maria_ui', first_name: 'Maria', last_name: 'Designer', avatar: null, last_seen_at: new Date().toISOString() };
const userOleg = { id: 4, username: 'oleg_sys', first_name: 'Oleg', last_name: 'Ops', avatar: null, last_seen_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() };

const richTextExample = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"id\":\"block-x57r1wfdc\",\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"короче \",\"marks\":[{\"type\":\"bold\"}]},{\"type\":\"text\",\"text\":\"це \",\"marks\":[{\"type\":\"italic\"}]},{\"type\":\"text\",\"text\":\"дуже \",\"marks\":[{\"type\":\"underline\"}]},{\"type\":\"text\",\"text\":\"великий \",\"marks\":[{\"type\":\"strike\"}]},{\"type\":\"text\",\"text\":\"і \"},{\"type\":\"text\",\"text\":\"жирний \",\"marks\":[{\"type\":\"spoiler\"}]},{\"type\":\"text\",\"text\":\"текст \",\"marks\":[{\"type\":\"link\",\"attrs\":{\"href\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\"target\":\"_blank\",\"rel\":\"noopener noreferrer nofollow\"}}]},{\"type\":\"text\",\"text\":\"тому \",\"marks\":[{\"type\":\"subscript\"}]},{\"type\":\"text\",\"text\":\"я \",\"marks\":[{\"type\":\"superscript\"}]},{\"type\":\"text\",\"text\":\"дальше \",\"marks\":[{\"type\":\"highlight\"}]},{\"type\":\"text\",\"text\":\"продовжую \",\"marks\":[{\"type\":\"textStyle\",\"attrs\":{\"color\":\"#00ffff\"}}]},{\"type\":\"text\",\"text\":\"дуже \",\"marks\":[{\"type\":\"textStyle\",\"attrs\":{\"color\":\"#ff8000\"}},{\"type\":\"underline\"},{\"type\":\"bold\"},{\"type\":\"italic\"},{\"type\":\"strike\"},{\"type\":\"spoiler\"},{\"type\":\"highlight\",\"attrs\":{\"color\":\"#8000ff\"}}]},{\"type\":\"text\",\"text\":\"довго \",\"marks\":[{\"type\":\"textStyle\",\"attrs\":{\"fontFamily\":\"Times New Roman\"}}]},{\"type\":\"text\",\"text\":\"писати \",\"marks\":[{\"type\":\"textStyle\",\"attrs\":{\"fontFamily\":\"Courier New\"}}]},{\"type\":\"text\",\"text\":\"щоб \",\"marks\":[{\"type\":\"textStyle\",\"attrs\":{\"fontSize\":\"16px\"}}]},{\"type\":\"text\",\"text\":\"перевірити\"}]}]}";

export const mockChats = [
    {
        slug: 'chat_with_andrew',
        is_group: false,
        initiator_id: 2, // Andrew почав чат
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 днів тому
        target_user: userAndrew,
        // ... інші існуючі поля
    },
    {
        slug:               'group_frontend_team',
        is_group:           true,
        title:              '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Frontend Developers 🚀","marks":[{"type":"bold"}]}]}]}',
        description:        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Робочий чат фронтендерів. Без спаму."}]}]}',
        participants_count: 3,
        owner_id:           1, // Я адмін
        participants:       [
            {user: mockCurrentUser, role: 'owner'},
            {user: userMaria, role: 'member'},
            {user: userOleg, role: 'member'}
        ],
        created_at:         new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
    {
        slug: 'chat_with_maria',
        is_group: false,
        target_user: userMaria,
        last_message: "Дякую! Все працює ідеально.",
        last_message_sender_id: 1, // Моє останнє
        unread_count: 0,
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    }
];

export const mockMessages = [
    // --- ПОВІДОМЛЕННЯ ДЛЯ ГРУПИ (щоб було видно різних юзерів) ---
    {
        id: 201,
        isMine: false,
        author: userMaria, // ВАЖЛИВО: тепер автор передається явно
        text: "Привіт всім! Як справи з рефакторингом?",
        status: 'read',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read_at: new Date(Date.now() - 1000 * 60 * 59 * 2).toISOString(),
        is_edited: false,
        is_pinned: false,
        files: []
    },
    {
        id: 202,
        isMine: true,
        author: mockCurrentUser,
        text: "Привіт. Переписую чати на Tailwind, виходить супер чисто.",
        status: 'read',
        created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        read_at: new Date(Date.now() - 1000 * 60 * 49).toISOString(),
        is_edited: true,
        is_pinned: false,
        files: []
    },
    {
        id: 203,
        isMine: false,
        author: userOleg,
        text: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Я скинув нові API ендпоінти\"}]}]}",
        status: 'sent',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read_at: null,
        is_edited: false,
        is_pinned: true, // Закріплене в групі
        files: []
    },
    // --- СИСТЕМНІ ПОВІДОМЛЕННЯ (фіча на майбутнє) ---
    {
        id: 204,
        is_system: true,
        text: "Oleg Ops закріпив повідомлення",
        created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    },

    // --- СТАРИЙ РІЧТЕКСТ ---
    {
        id: 103,
        isMine: false,
        author: userAndrew,
        text: richTextExample,
        status: 'sent',
        created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        read_at: null,
        is_edited: false,
        is_pinned: false,
        files: []
    },
    {
        id: 301,
        isMine: false,
        author: userMaria,
        text: "Скинула макет",
        status: 'read',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        files: [{ name: 'design.jpg', url: 'https://picsum.photos/400/300', type: 'image/jpeg' }]
    },
    {
        id: 302,
        isMine: true,
        author: mockCurrentUser,
        text: "Ось документація",
        status: 'read',
        created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        files: [{ name: 'api_docs.pdf', url: '#', type: 'application/pdf' }]
    },
    {
        id: 303,
        isMine: false,
        author: userOleg,
        text: "Крутий трек",
        status: 'read',
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        files: [{ name: 'song.mp3', url: '#', type: 'audio/mpeg' }]
    },
    {
        id: 304,
        isMine: false,
        author: userAndrew,
        text: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Дивись: \"},{\"type\":\"text\",\"text\":\"Google\",\"marks\":[{\"type\":\"link\",\"attrs\":{\"href\":\"https://google.com\"}}]}]}]}",
        status: 'read',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        files: [] // Але є лінк у річтексті
    },
];