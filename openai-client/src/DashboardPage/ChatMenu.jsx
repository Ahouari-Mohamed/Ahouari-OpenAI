import { useState, useEffect } from 'react';

export default function ChatMenu({ chatAdded, setChatAdded, fetchChat}) {
    const [userChats, setUserChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleOptionsChatId, setVisibleOptionsChatId] = useState(null);
    const [editingChatId, setEditingChatId] = useState(null);
    const [newChatName, setNewChatName] = useState('');

    const toggleOptions = (chatId) => {
        if (visibleOptionsChatId === chatId) {
            setVisibleOptionsChatId(null); // Hide options if already visible
        } else {
            setVisibleOptionsChatId(chatId); // Show options for the selected chat
        }
    };

    async function handleClick(id) {
        try {
            await fetchChat(id);
        } catch (error) {
            console.error("Error fetching chat:", error.message);
        }
    }

    async function handleDelete(chatId) {
        try {
            const response = await fetch(`http://localhost:3080/delete/${chatId}`, {
                method: 'DELETE'
            });
    
            if (!response.ok) {
                throw new Error('Error deleting chat');
            }
    
            // Remove the chat from the side menu state
            setUserChats(userChats => userChats.filter(chat => chat._id !== chatId));
            setChatAdded(true);
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    }
    
    async function handleRename(chatId) {
        try {
            const response = await fetch(`http://localhost:3080/rename/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newName: newChatName })
            });
    
            if (!response.ok) {
                throw new Error('Error renaming chat');
            }
    
            // Update the chat in the side menu state
            setUserChats(userChats => userChats.map(chat =>
                chat._id === chatId ? { ...chat, title: newChatName } : chat
            ));
            
            // Reset the editing state
            setEditingChatId(null);
            setNewChatName('');
        } catch (error) {
            console.error("Error renaming chat:", error);
        }
    }

    const startEditing = (chatId, currentName) => {
        setEditingChatId(chatId);
        setNewChatName(currentName);
    };

    const handleKeyPress = (event, chatId) => {
        if (event.key === 'Enter') {
            handleRename(chatId);
        } else if (event.key === 'Escape') {
            setEditingChatId(null); // Cancel editing on "Escape"
        }
    };
    
    useEffect(() => {
        const fetchUserChats = async () => {
            try {
                const response = await fetch(`http://localhost:3080/userChats`);

                console.log('Status Code:', response.status);
                if (!response.ok) {
                    throw new Error('User chats not found');
                }
                const data = await response.json();
                setUserChats(data);
            } catch (error) {
                console.log(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserChats();
    }, [chatAdded]);

    if (loading) return <div className='loading'>Loading...</div>;


    return (
        <div className='chat-menu'>
            {userChats.map((userChat) => (
                <div
                    key={userChat._id}
                    onClick={() => handleClick(userChat._id)}
                    className="chat-btn"
                >
                    {editingChatId === userChat._id ? (
                        <input
                            type="text"
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            onKeyDown={(e)=>handleKeyPress(e, userChat._id)}
                            onClick={(e) => e.stopPropagation()} // Prevent the parent div click from firing
                            className='option-rename-input'
                        />
                    ) : (
                        userChat.title
                    )}
                    <button
                        className='options-elem-btn'
                        onClick={(e) => {
                            e.stopPropagation(); 
                            toggleOptions(userChat._id);
                        }}
                    >
                        ...
                    </button>
                    {visibleOptionsChatId === userChat._id && (
                        <div className="options-div">
                            <div className='option-rename' onClick={(e) => {
                                e.stopPropagation(); 
                                setVisibleOptionsChatId(null);
                                startEditing(userChat._id, userChat.title);
                            }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width={24}
                                    height={24}
                                    fill="none"
                                    className="h-5 w-5 shrink-0"
                                >
                                    <path
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    d="M13.293 4.293a4.536 4.536 0 1 1 6.414 6.414l-1 1-7.094 7.094A5 5 0 0 1
                                    8.9 20.197l-4.736.79a1 1 0 0 1-1.15-1.151l.789-4.736a5 5 0 0 1 1.396-2.713zM13
                                    7.414l-6.386 6.387a3 3 0 0 0-.838 1.628l-.56 3.355 3.355-.56a3 3 0 0 0
                                    1.628-.837L16.586 11zm5 2.172L14.414 6l.293-.293a2.536 2.536 0 0 1 3.586 3.586z"
                                    clipRule="evenodd"
                                    />
                                </svg>
                                Rename
                            </div>
                            <div className='option-delete' onClick={(e) => {
                                e.stopPropagation(); 
                                handleDelete(userChat._id);
                            }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width={24}
                                    height={24}
                                    fill="none"
                                    className="h-5 w-5 shrink-0"
                                >
                                    <path
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    d="M10.556 4a1 1 0 0 0-.97.751l-.292 1.14h5.421l-.293-1.14A1 1 0 0 0 13.453 4zm6.224
                                    1.892-.421-1.639A3 3 0 0 0 13.453 2h-2.897A3 3 0 0 0 7.65 4.253l-.421 1.639H4a1 1 0 1 0 0
                                    2h.1l1.215 11.425A3 3 0 0 0 8.3 22h7.4a3 3 0 0 0 2.984-2.683l1.214-11.425H20a1 1 0 1 0
                                    0-2zm1.108 2H6.112l1.192 11.214A1 1 0 0 0 8.3 20h7.4a1 1 0 0 0 .995-.894zM10 10a1 1 0
                                    0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1"
                                    clipRule="evenodd"
                                    />
                                </svg>
                                Delete
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
