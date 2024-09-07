import './DashboardPage.css';
import ChatMessage from './ChatMessage';
import ChatMenu from './ChatMenu';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';


function DashboardPage() {
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [nextChatIndex, setNextChatIndex] = useState(0);
  const [chatAdded, setChatAdded] = useState(false);
  const [visibleSide, setVisibleSide] = useState(false);
  const chatLogRef = useRef(chatLog);

  const textareaRef = useRef(null);
  const endChatRef = useRef(null);
  const chatContainerRef = useRef(null);

  const toggleOptions = () => {
    if (visibleSide === true) {
      setVisibleSide(false);
    } else {
      setVisibleSide(true);
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    if (endChatRef.current) {
        endChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog]);

  // scroll-Down button shows when scroll-Up
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    const scrollDownButton = document.getElementById('scrollDownButton');

    const handleScroll = () => {
      const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
      
      if (isAtBottom) {
        scrollDownButton.style.display = 'none';
      } else {
        scrollDownButton.style.display = 'block';
      }
    };

    chatContainer.addEventListener('scroll', handleScroll);

    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToBottom = () => {
    if (endChatRef.current) {
      endChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  function adjustTextareaHeight() {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Update the ref whenever chatLog changes
  useEffect(() => {
    chatLogRef.current = chatLog;
  }, [chatLog]);

  useEffect(() => {
    // Fetch the next chat index when the chatAdded changes
    const fetchChatIndex = async () => {
      try {
        const userId = 1;
        const response = await fetch(`https://ahouari-openai.onrender.com/chatIndex/${userId}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const index = await response.json();
        setNextChatIndex(index);
      } catch (error) {
        console.error("Error fetching chat index:", error.message);
      }
    };

    if (chatAdded) {
      fetchChatIndex();
      setTimeout(() => setChatAdded(false), 100);
    }
  }, [chatAdded]);

  // Automatically trigger a new chat when the component first mounts
  useEffect(() => {
    newChat();
  }, []);

  // adjust the chat log with the selected chat
  async function fetchChat(chatId) {
    try {
      const response = await fetch(`https://ahouari-openai.onrender.com/userChats/${chatId}`);
      if (!response.ok) {
        throw new Error('Chat not found');
      }
      const data = await response.json();
      setChatLog(data.history);
      setNextChatIndex(chatId);
    } catch (error) {
      console.error("Error fetching chat:", error.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Update the chat log with the user's message
    setChatLog(chatLog => [...chatLog, { role: "user", content: `${input}` }]);

    // Initialize the AI's message
    setChatLog(chatLog => [...chatLog, { role: "model", content: "" }]);

    try {
      // Filter out any empty messages
      const updatedChatLog = [...chatLog, { role: 'user', content: `${input}` }]; 
      
      if (!Array.isArray(updatedChatLog)) {
        console.error('History is not an array:', updatedChatLog);
      }
      const response = await fetch("https://ahouari-openai.onrender.com/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: updatedChatLog,
          message: `${input}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      // Creating a separate function to handle state update outside the loop
      const updateChatLog = (text) => {
        setChatLog(chatLog => {
          const newChatLog = [...chatLog];
          newChatLog[newChatLog.length - 1].content = text;
          return newChatLog;
        })
      };

      let responseText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;

        updateChatLog(responseText);
      }
    }
    catch (error) {
      setChatLog(chatLog => [...chatLog, { role: "model", content: "Ooops, something went wrong..." }]);
    }

    try {
      // Use the latest chatLog from the ref
      console.log('Sending chat log to server:', JSON.stringify({
        userId: 1,
        id: nextChatIndex,
        history: chatLogRef.current
      }));

      await fetch("https://ahouari-openai.onrender.com/chatLog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1,
          id: nextChatIndex,
          history: chatLogRef.current
        })
      });
    }
    catch (e) {
      console.error("Error sending chat log to server:", e);
    }

    setInput("");
  }

  function newChat() {
    setChatLog([])
    setChatAdded(true);
  }

  return (
    <div className="Dashboard">
      {visibleSide === true ? (
        <div className='side active'>
          <div className="side-menu active">
            <div className='chat-btns'>
              <div className="close-side-menu"
                onClick={() => {
                  toggleOptions();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  fill="none"
                  className="icon-xl-heavy">
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M8.857 3h6.286c1.084 0 1.958 0 2.666.058.729.06 1.369.185 1.961.487a5 5 0 0 1
                        2.185 2.185c.302.592.428 1.233.487 1.961.058.708.058 1.582.058 2.666v3.286c0
                        1.084 0 1.958-.058 2.666-.06.729-.185 1.369-.487 1.961a5 5 0 0 
                        1-2.185 2.185c-.592.302-1.232.428-1.961.487C17.1 21 16.227 21 15.143 21H8.857c-1.084
                        0-1.958 0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0
                        1-2.186-2.185c-.302-.592-.428-1.232-.487-1.961C1.5 15.6 1.5 14.727 1.5
                        13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.728.185-1.369.487-1.96A5 5 0 0 1
                        4.23 3.544c.592-.302 1.233-.428 1.961-.487C6.9 3 7.773 3 8.857 3M6.354
                        5.051c-.605.05-.953.142-1.216.276a3 3 0 0 0-1.311 1.311c-.134.263-.226.611-.276 
                        1.216-.05.617-.051 1.41-.051 2.546v3.2c0 1.137 0 1.929.051 2.546.05.605.142.953.276
                        1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226 1.216.276.617.05 1.41.051
                        2.546.051h.6V5h-.6c-1.137 0-1.929 0-2.546.051M11.5 5v14h3.6c1.137 0 1.929 0
                        2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0
                        1.311-1.311c.134-.263.226-.611.276-1.216.05-.617.051-1.41.051-2.546v-3.2c0-1.137
                        0-1.929-.051-2.546-.05-.605-.142-.953-.276-1.216a3 3 0 0 0-1.311-1.311c-.263-.134-.611-.226-1.216-.276C17.029
                        5.001 16.236 5 15.1 5zM5 8.5a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1M5 12a1
                        1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="new-chat-btn" onClick={newChat}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  fill="currentColor"
                  className="icon-xl-heavy">
                  <path d="M15.673 3.913a3.121 3.121 0 1 1 4.414 4.414l-5.937 5.937a5 5 0 0
                      1-2.828 1.415l-2.18.31a1 1 0 0 1-1.132-1.13l.311-2.18A5 5 0 0 1 9.736 9.85zm3
                      1.414a1.12 1.12 0 0 0-1.586 0l-5.937 5.937a3 3 0 0 0-.849 1.697l-.123.86.86-.122a3
                      3 0 0 0 1.698-.849l5.937-5.937a1.12 1.12 0 0 0 0-1.586M11 4a1 1 0 0 1-1 1c-.998
                      0-1.702.008-2.253.06-.54.052-.862.141-1.109.267a3 3 0 0 0-1.311
                      1.311c-.134.263-.226.611-.276 1.216C5.001 8.471 5 9.264 5 10.4v3.2c0 1.137
                      0 1.929.051 2.546.05.605.142.953.276 1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226
                      1.216.276.617.05 1.41.051 2.546.051h3.2c1.137 0 1.929 0
                      2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0 1.311-1.311c.126-.247.215-.569.266-1.108.053-.552.06-1.256.06-2.255a1
                      1 0 1 1 2 .002c0 .978-.006 1.78-.069 2.442-.064.673-.192 1.27-.475 1.827a5 5 0 0
                      1-2.185 2.185c-.592.302-1.232.428-1.961.487C15.6 21 14.727 21 13.643 21h-3.286c-1.084 0-1.958
                      0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0 1-2.186-2.185c-.302-.592-.428-1.233-.487-1.961C3
                      15.6 3 14.727 3 13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.729.185-1.369.487-1.961A5 5 0 0 1 5.73
                      3.545c.556-.284 1.154-.411 1.827-.475C8.22 3.007 9.021 3 10 3a1 1 0 0 1 1 1" />
                </svg>
              </div>
            </div>

            <hr />
            <ChatMenu chatAdded={chatAdded} setChatAdded={setChatAdded} fetchChat={fetchChat}/>

            <div className='footer-side-menu'>
              <hr />
              <div>/<Link to="/">Home</Link>/Dashboard</div>
              <br />
              Copyright &copy; 2024 <br /> By Mohamed Ahouari
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className='side'>
            <div className="side-menu"></div>
          </div>
          <div className='chat-btns v2'>
            <div className="close-side-menu v2"
              onClick={() => {
                toggleOptions();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                fill="none"
                className="icon-xl-heavy">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M8.857 3h6.286c1.084 0 1.958 0 2.666.058.729.06 1.369.185 1.961.487a5 5 0 0 1
                            2.185 2.185c.302.592.428 1.233.487 1.961.058.708.058 1.582.058 2.666v3.286c0
                            1.084 0 1.958-.058 2.666-.06.729-.185 1.369-.487 1.961a5 5 0 0 
                            1-2.185 2.185c-.592.302-1.232.428-1.961.487C17.1 21 16.227 21 15.143 21H8.857c-1.084
                            0-1.958 0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0
                            1-2.186-2.185c-.302-.592-.428-1.232-.487-1.961C1.5 15.6 1.5 14.727 1.5
                            13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.728.185-1.369.487-1.96A5 5 0 0 1
                            4.23 3.544c.592-.302 1.233-.428 1.961-.487C6.9 3 7.773 3 8.857 3M6.354
                            5.051c-.605.05-.953.142-1.216.276a3 3 0 0 0-1.311 1.311c-.134.263-.226.611-.276 
                            1.216-.05.617-.051 1.41-.051 2.546v3.2c0 1.137 0 1.929.051 2.546.05.605.142.953.276
                            1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226 1.216.276.617.05 1.41.051
                            2.546.051h.6V5h-.6c-1.137 0-1.929 0-2.546.051M11.5 5v14h3.6c1.137 0 1.929 0
                            2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0
                            1.311-1.311c.134-.263.226-.611.276-1.216.05-.617.051-1.41.051-2.546v-3.2c0-1.137
                            0-1.929-.051-2.546-.05-.605-.142-.953-.276-1.216a3 3 0 0 0-1.311-1.311c-.263-.134-.611-.226-1.216-.276C17.029
                            5.001 16.236 5 15.1 5zM5 8.5a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1M5 12a1
                            1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="new-chat-btn v2" onClick={newChat}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                fill="currentColor"
                className="icon-xl-heavy">
                <path d="M15.673 3.913a3.121 3.121 0 1 1 4.414 4.414l-5.937 5.937a5 5 0 0
                        1-2.828 1.415l-2.18.31a1 1 0 0 1-1.132-1.13l.311-2.18A5 5 0 0 1 9.736 9.85zm3
                        1.414a1.12 1.12 0 0 0-1.586 0l-5.937 5.937a3 3 0 0 0-.849 1.697l-.123.86.86-.122a3
                        3 0 0 0 1.698-.849l5.937-5.937a1.12 1.12 0 0 0 0-1.586M11 4a1 1 0 0 1-1 1c-.998
                        0-1.702.008-2.253.06-.54.052-.862.141-1.109.267a3 3 0 0 0-1.311
                        1.311c-.134.263-.226.611-.276 1.216C5.001 8.471 5 9.264 5 10.4v3.2c0 1.137
                        0 1.929.051 2.546.05.605.142.953.276 1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226
                        1.216.276.617.05 1.41.051 2.546.051h3.2c1.137 0 1.929 0
                        2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0 1.311-1.311c.126-.247.215-.569.266-1.108.053-.552.06-1.256.06-2.255a1
                        1 0 1 1 2 .002c0 .978-.006 1.78-.069 2.442-.064.673-.192 1.27-.475 1.827a5 5 0 0
                        1-2.185 2.185c-.592.302-1.232.428-1.961.487C15.6 21 14.727 21 13.643 21h-3.286c-1.084 0-1.958
                        0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0 1-2.186-2.185c-.302-.592-.428-1.233-.487-1.961C3
                        15.6 3 14.727 3 13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.729.185-1.369.487-1.961A5 5 0 0 1 5.73
                        3.545c.556-.284 1.154-.411 1.827-.475C8.22 3.007 9.021 3 10 3a1 1 0 0 1 1 1" />
              </svg>
            </div>
          </div>
        </>
      )}
      <div className="chat-box">
        <div className="chat-log" ref={chatContainerRef}>
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          <div className='end-chat' ref={endChatRef} />
        </div>
        <button
          id="scrollDownButton"
          className='scroll-down'
          onClick={scrollToBottom}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            fill="none"
            className="icon-md text-token-text-primary"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M12 21a1 1 0 0 1-.707-.293l-7-7a1 1 0 1 1 1.414-1.414L11 17.586V4a1 1 0
               1 1 2 0v13.586l5.293-5.293a1 1 0 0 1 1.414 1.414l-7 7A1 1 0 0 1 12 21Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <form className="chat-input-block" onSubmit={handleSubmit}>
          <textarea
            type="text"
            placeholder="Type To Search..."
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            ref={textareaRef}
          />
          <button type="submit" title="submit-search" className="submit-search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={32}
              height={32}
              fill="none"
              className="icon-2xl">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616
                      1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143
                      1.143 0 1 1-1.616-1.616z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default DashboardPage;
