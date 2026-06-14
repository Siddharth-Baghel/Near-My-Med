// Layout.jsx

import { useState } from "react";
import {
  Bot,
  Send,
  Paperclip,
  Sparkles,
  ChevronRight,
} from "lucide-react";

/* ===========================
   PAGE LAYOUT
=========================== */

export function PageLayout({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              {icon}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {title}
              </h1>

              <p className="text-slate-500 mt-1">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-4 text-sm text-slate-500">
            Home
            <ChevronRight size={14} />
            AI Assistant
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}

/* ===========================
   CHAT UI
=========================== */

export function ChatUI() {
  const [message, setMessage] = useState("");

  const messages = [
    {
      role: "assistant",
      content:
        "👋 Welcome to NearMyMed AI. Ask me about medicines, dosage, side effects and drug interactions.",
    },
    {
      role: "user",
      content: "What is Dolo 650 used for?",
    },
    {
      role: "assistant",
      content:
        "Dolo 650 contains Paracetamol and is commonly used to reduce fever and relieve mild to moderate pain.",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={22} />
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              NearMyMed AI Assistant
            </h3>

            <p className="text-sm opacity-80">
              Online • Ready to Help
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="border-b bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
          Popular Questions
        </p>

        <div className="flex flex-wrap gap-2">
          {[
            "What is Metformin?",
            "Side effects of Ibuprofen",
            "Drug interactions with Aspirin",
            "Can I take Paracetamol daily?",
          ].map((item) => (
            <button
              key={item}
              className="px-4 py-2 rounded-full border bg-white text-sm hover:border-emerald-400 hover:text-emerald-600 transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="h-[500px] overflow-y-auto bg-slate-50 p-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-5 ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white mr-3">
                <Bot size={18} />
              </div>
            )}

            <div
              className={`max-w-xl px-5 py-4 rounded-2xl ${
                msg.role === "user"
                  ? "bg-emerald-500 text-white"
                  : "bg-white border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing Animation */}
        <div className="flex items-center gap-2">
          <Bot
            size={18}
            className="text-emerald-500"
          />

          <div className="bg-white border rounded-full px-4 py-2 flex gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200"></span>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 border rounded-xl flex items-center justify-center hover:bg-slate-50">
            <Paperclip size={18} />
          </button>

          <div className="flex-1 relative">
            <input
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Ask about medicines..."
              className="w-full border rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <Sparkles
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
            />
          </div>

          <button className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}