"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Send, FileText, Loader2, Bot, User, CheckCircle2, AlertCircle } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    setUploadedFileName(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        setUploadStatus({ type: "success", msg: `"${file.name}" uploaded and indexed successfully!` });
        setUploadedFileName(file.name);
      } else {
        setUploadStatus({ type: "error", msg: data.detail || "Failed to upload document" });
      }
    } catch (err) {
      setUploadStatus({ type: "error", msg: "Server connection failed" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: botMsgId, role: "assistant", content: "" }]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content, history }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === botMsgId 
              ? { ...msg, content: msg.content + chunk } 
              : msg
          )
        );
      }
    } catch (err) {
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === botMsgId 
            ? { ...msg, content: "Sorry, I encountered an error connecting to the server." } 
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-sky-100 p-6 flex flex-col shadow-sm z-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md border border-sky-100 overflow-hidden p-1">
            <img src="/logo.png" alt="DocuMind Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              DocuMind
            </h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Assistant</p>
          </div>
        </div>

        <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-sky-600" /> Knowledge Base
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Upload PDF documents to expand my knowledge.
          </p>
          
          <input 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-all shadow-sm"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {isUploading ? "Uploading..." : "Upload Document"}
          </button>

          {uploadStatus && (
            <div className={`mt-3 flex items-start gap-2 text-xs p-2.5 rounded-lg ${
              uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {uploadStatus.type === 'success' ? <CheckCircle2 size={14} className="mt-0.5 text-emerald-600" /> : <AlertCircle size={14} className="mt-0.5 text-red-600" />}
              <span className="leading-snug">{uploadStatus.msg}</span>
            </div>
          )}
        </div>

        {uploadedFileName && (
          <div className="mt-6 px-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sample Questions</h3>
            <div className="space-y-2">
              {[
                "What is the main topic of this document?",
                "Can you summarize the key points?",
                "What are the main conclusions or takeaways?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q)}
                  className="w-full text-left text-xs bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 text-slate-600 p-3 rounded-xl transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        
        <div className="mt-auto">
          {/* Removed powered by text as requested */}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-slate-50">
        {/* Chat Header */}
        <div className="h-16 border-b border-sky-100 flex items-center px-8 bg-white/80 backdrop-blur-sm z-10 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Corporate SOP Chat</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mb-6 shadow-sm border border-sky-200">
                <Bot size={32} className="text-sky-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">How can I help?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Upload your company documents on the left and ask me any question. I'll provide answers with exact citations.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <Bot size={18} className="text-white" />
                    </div>
                  )}
                  
                  <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-sky-500 text-white rounded-tr-sm' 
                      : 'bg-white text-slate-800 rounded-tl-sm border border-sky-100'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed text-slate-800">
                        {/* Simple markdown parsing for bold text (citations) */}
                        {msg.content.split('\n').map((line, i) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <strong key={i} className="block mt-4 text-sky-700">{line.replace(/\*\*/g, '')}</strong>;
                          }
                          return <span key={i}>{line}<br/></span>;
                        })}
                      </div>
                    ) : (
                      <div className="text-sm">{msg.content}</div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <User size={18} className="text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="w-full bg-white border border-sky-200 text-slate-900 placeholder-slate-400 text-sm rounded-xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-md"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors"
              >
                {isTyping ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <Send size={16} />}
              </button>
            </form>
            <div className="text-center mt-3 text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              <span className="font-bold text-slate-900">DocuMind AI can make mistakes.</span> Verify important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
