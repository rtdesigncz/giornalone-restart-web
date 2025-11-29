"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Database } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Message = {
    role: "user" | "assistant";
    content: string;
    sql?: string;
    data?: any[];
};

export default function AgentWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Ciao! Sono Mauriz, il tuo assistente. Chiedimi qualsiasi cosa!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [avatarState, setAvatarState] = useState<"neutro" | "pensa" | "ok">("neutro");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);
        setAvatarState("pensa");

        try {
            const res = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Errore sconosciuto");
            }

            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.answer || "Ecco i dati che hai richiesto:",
                sql: data.sql,
                data: data.data
            }]);

            setAvatarState("ok");
            setTimeout(() => setAvatarState("neutro"), 3000);

        } catch (err: any) {
            setMessages(prev => [...prev, { role: "assistant", content: `❌ Errore: ${err.message}` }]);
            setAvatarState("neutro");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("open-ai-agent", handleOpen);
        return () => window.removeEventListener("open-ai-agent", handleOpen);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[700px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

            {/* Left Panel - Avatar Stage */}
            <div className="w-[280px] bg-gradient-to-br from-brand to-brand-ink relative flex flex-col items-center justify-end overflow-hidden shrink-0">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-xl"></div>
                    <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500 rounded-full blur-2xl"></div>
                </div>

                {/* Avatar */}
                <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                    <video
                        src="/mauriz/mauriz.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover object-center"
                    />
                </div>

                {/* Name/Title overlay */}
                <div className="absolute bottom-6 left-6 z-20 bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg">
                    <h2 className="text-2xl font-bold tracking-tight text-teal-400 drop-shadow-md">Mauriz</h2>
                    <p className="text-[10px] text-teal-100 font-bold uppercase tracking-widest mt-0.5 drop-shadow-sm">Assistente AI</p>
                </div>
            </div>

            {/* Right Panel - Chat Interface */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Header (Simplified) */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Sparkles size={16} className="text-brand" />
                        <span className="text-xs font-medium uppercase tracking-wider">Parla con Mauriz!</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-slate-100 p-2 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
                    {messages.map((m, i) => (
                        <div key={i} className={cn("flex flex-col max-w-[90%]", m.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
                            <div className={cn(
                                "px-4 py-3 rounded-2xl text-sm shadow-sm",
                                m.role === "user"
                                    ? "bg-brand text-white rounded-br-none"
                                    : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
                            )}>
                                <div className="prose prose-sm max-w-none text-inherit leading-relaxed">
                                    <ReactMarkdown
                                        components={{
                                            ul: ({ node, ...props }: any) => <ul className="list-none space-y-3 my-3 pl-0" {...props} />,
                                            li: ({ node, ...props }: any) => <li className={cn("p-2 rounded-lg text-sm", m.role === 'user' ? "bg-white/10" : "bg-slate-50 border border-slate-100")} {...props} />,
                                            strong: ({ node, ...props }: any) => <strong className={cn("font-semibold", m.role === 'user' ? "text-white" : "text-brand-ink")} {...props} />,
                                            p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                                            code: ({ node, ...props }: any) => <code className={cn("px-1 py-0.5 rounded text-xs font-mono", m.role === 'user' ? "bg-white/20" : "bg-slate-100 text-slate-600")} {...props} />,
                                        }}
                                    >
                                        {m.content.replace(/\. \*/g, ".\n\n*").replace(/\* \*\*/g, "\n\n* **")}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* SQL & Data Preview (Assistant only) */}
                            {m.role === "assistant" && m.sql && (
                                <div className="mt-2 w-full text-xs pl-1">
                                    <details className="group">
                                        <summary className="cursor-pointer text-slate-400 hover:text-brand flex items-center gap-1 list-none transition-colors">
                                            <Database size={12} />
                                            <span>Dettagli Tecnici</span>
                                        </summary>
                                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-200">
                                            <div className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono overflow-x-auto text-[10px] leading-relaxed shadow-inner">
                                                {m.sql}
                                            </div>
                                            {m.data && m.data.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                                                    <table className="w-full text-[10px]">
                                                        <thead className="sticky top-0 bg-slate-50 z-10">
                                                            <tr className="text-left border-b border-slate-200">
                                                                {Object.keys(m.data[0]).map(k => <th key={k} className="p-2 font-semibold text-slate-600">{k}</th>)}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {m.data.slice(0, 5).map((row, idx) => (
                                                                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                                    {Object.values(row).map((v: any, vi) => <td key={vi} className="p-2 truncate max-w-[120px] text-slate-600">{String(v)}</td>)}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {m.data.length > 5 && <div className="text-center p-2 text-slate-400 italic bg-slate-50 border-t border-slate-100">...altri {m.data.length - 5} risultati</div>}
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs ml-2">
                            <div className="w-2 h-2 bg-brand/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-brand/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-brand/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Chiedi a Mauriz..."
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-sm transition-all placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="p-3 bg-brand text-white rounded-xl hover:bg-brand-ink disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/20 hover:shadow-brand/40 active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
