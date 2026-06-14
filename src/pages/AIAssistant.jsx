import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import ReactMarkdown from "react-markdown";

import {
  Send,
  Plus,
  Bot,
  User,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { model } from "../Component/Gemini";

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);

  const [history, setHistory] = useState([
    "New Chat",
  ]);

  const suggestions = [
    "Can I take Dolo 650 after food?",
    "Explain my prescription",
    "Side effects of Azithromycin",
    "Find alternative medicine",
  ];

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;

    if (messages.length === 0) {
      setMessages([
        {
          role: "user",
          content: userMessage,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: userMessage,
        },
      ]);
    }

    if (history.length === 1) {
      setHistory((prev) => [
        userMessage.slice(0, 30),
        ...prev,
      ]);
    }

    setInput("");
    setLoading(true);

    try {
      const prompt = `
You are NearMyMed AI Assistant.

Rules:
- Help users with medicines.
- Explain prescriptions.
- Explain side effects.
- Suggest consulting a doctor when required.
- Never claim to replace a doctor.

User Question:
${userMessage}
`;

      const result =
        await model.generateContent(prompt);

      const response =
        result.response.text();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
  };

  const messagesEndRef = useRef(null);
  const [copiedIndex, setCopiedIndex] =
    useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const copyMessage = async (
    text,
    index
  ) => {
    await navigator.clipboard.writeText(
      text
    );

    setCopiedIndex(index);

    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };


  return (
    <div className="h-[calc(100vh-9.25rem)] flex bg-[#f7f7f8]">
      {/* Sidebar */}
      <aside className="
        hidden
        md:flex
        w-72
        bg-white/90
        backdrop-blur-md
        border-r
        border-gray-200
        flex-col
        ">  

        <div className="p-4">
        <button
            onClick={newChat}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="px-3 pb-3">
          <h3 className="text-xs text-gray-400 uppercase mb-3">
            Recent Chats
          </h3>

          {history.map((item, index) => (
            <button
              key={index}
              className="w-full text-left p-3 rounded-xl hover:bg-gray-100 flex items-center gap-2 mb-2"
            >
              <MessageSquare size={15} />
              <span className="truncate">
                {item}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-gray-300 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>

            <div>
              <p className="font-medium">
                NearMyMed User
              </p>
              <p className="text-xs text-gray-500">
                Medical Assistant
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">
          
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white p-2 rounded-xl shadow">
            <Bot size={18} />
          </div>

          <div>
            <h2 className="font-semibold">
              NearMyMed AI
            </h2>

            <p className="text-xs text-green-600">
              🟢 Powered by Gemini
            </p>
          </div>
        </div>
      </header>
 
       {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-linear-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Bot size={40} className="text-white" />
            </div>

            <h1 className="text-4xl font-bold mt-6 text-center">
              Welcome to NearMyMed AI
            </h1>

            <p className="text-gray-500 mt-3 text-center max-w-xl">
              Get medicine information, understand prescriptions,
              learn about side effects and healthcare guidance.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-10 max-w-4xl w-full">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => setInput(item)}
                  className="bg-white border border-gray-200 rounded-3xl p-5 text-left shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-green-500 transition-all duration-300"
                >
                  <p className="font-semibold text-gray-800">
                    {item}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Click to ask NearMyMed AI
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === "user"
                      ? "flex-row-reverse"
                      : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user"
                        ? "bg-green-500 text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>

                  <div>
                    <div
                      className={`px-5 py-3 rounded-2xl shadow-sm ${
                        msg.role === "user"
                          ? "bg-green-500 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.role === "assistant" && (
                      <button
                        onClick={() =>
                          copyMessage(
                            msg.content,
                            index
                          )
                        }
                        className="mt-2 text-xs flex items-center gap-1
                         text-gray-500 hover:text-green-600"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={14} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <Bot size={16} />
                </div>

                <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce [animation-delay:150ms]">
                      •
                    </span>
                    <span className="animate-bounce [animation-delay:300ms]">
                      •
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
        {/* Input */}
        <div className="p-5 bg-[#f7f7f8]">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-3xl
             flex items-center px-5 py-3 shadow-lg focus-within:ring-2 focus-within:ring-green-500 transition">
              <input
                type="text"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  sendMessage()
                }
                placeholder="Ask anything about medicines..."
                className="flex-1 outline-none bg-transparent"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="
                  bg-linear-to-r
                  from-green-500
                  to-emerald-600
                  hover:scale-105
                  disabled:scale-100
                  text-white
                  p-3
                  rounded-xl
                  transition-all
                  duration-200
                  shadow-md
                  "
              >
                <Send size={18} />
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              AI can make mistakes. Always verify important medical information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}