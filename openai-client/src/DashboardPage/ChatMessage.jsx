import Markdown from "react-markdown";

export default function ChatMessage({ message }) {
    return (
        <div className={`chat-message ${message.role === 'model' && "ai"}`}>
            <div className={`avatar ${message.role === 'model' && "ai"}`}>
                {<div>{message.role === 'model' ? "AI" : "Me"}</div>}
            </div>
            <div className="message">
                <Markdown>{message.content}</Markdown>
            </div>
        </div>
    );
}