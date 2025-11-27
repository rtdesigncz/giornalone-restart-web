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
        { role: "assistant", content: "Ciao! Sono il tuo assistente dati. Chiedimi qualsiasi cosa, ad esempio: 'Quanti abbonamenti venduti oggi?'" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
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

        } catch (err: any) {
            setMessages(prev => [...prev, { role: "assistant", content: `❌ Errore: ${err.message}` }]);
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
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="bg-brand text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} />
                    <h3 className="font-semibold">Assistente Dati</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={cn("flex flex-col max-w-[85%]", m.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
                        <div className={cn(
                            "px-4 py-2 rounded-2xl text-sm shadow-sm",
                            m.role === "user"
                                ? "bg-brand text-white rounded-br-none"
                                : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
                        )}>
                            <ReactMarkdown
                                components={{
                                    ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                    li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
                                    strong: ({ node, ...props }: any) => <strong className="font-bold text-brand-ink" {...props} />,
                                    p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                                }}
                            >
                                {m.content}
                            </ReactMarkdown>
                        </div>

                        {/* SQL & Data Preview (Assistant only) */}
                        {m.role === "assistant" && m.sql && (
                            <div className="mt-2 w-full text-xs">
                                <details className="group">
                                    <summary className="cursor-pointer text-slate-400 hover:text-brand flex items-center gap-1 list-none">
                                        <Database size={12} />
                                        <span>Dettagli Tecnici</span>
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-200">
                                        <div className="bg-slate-900 text-slate-300 p-2 rounded font-mono overflow-x-auto">
                                            {m.sql}
                                        </div>
                                        {m.data && m.data.length > 0 && (
                                            <div className="max-h-32 overflow-y-auto border border-slate-200 rounded bg-white p-1">
                                                <table className="w-full text-[10px]">
                                                    <thead>
                                                        <tr className="bg-slate-50 text-left">
                                                            {Object.keys(m.data[0]).map(k => <th key={k} className="p-1">{k}</th>)}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {m.data.slice(0, 5).map((row, idx) => (
                                                            <tr key={idx} className="border-t border-slate-100">
                                                                {Object.values(row).map((v: any, vi) => <td key={vi} className="p-1 truncate max-w-[100px]">{String(v)}</td>)}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {m.data.length > 5 && <div className="text-center p-1 text-slate-400 italic">...altri {m.data.length - 5} risultati</div>}
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
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Chiedi qualcosa..."
                    className="flex-1 px-4 py-2 rounded-full bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-sm transition-all"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 bg-brand text-white rounded-full hover:bg-brand-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
