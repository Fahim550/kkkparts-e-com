import { Button } from "@/components/ui/button";
import {
  useContactMessages,
  useDeleteContactMessage,
  useUpdateContactMessage,
  type ContactMessage,
} from "@/hooks/useContactMessages";
import { CheckCircle, Mail, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MessagesManager = () => {
  const { data: messages = [], isLoading } = useContactMessages();
  const updateMessage = useUpdateContactMessage();
  const deleteMessage = useDeleteContactMessage();
  const [search, setSearch] = useState("");
  const [viewingMsg, setViewingMsg] = useState<ContactMessage | null>(null);

  const filtered = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase()),
  );

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  const handleMarkRead = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "unread" ? "read" : "unread";
    try {
      await updateMessage.mutateAsync({ id, status: newStatus });
      toast.success(`Marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteMessage.mutateAsync(id);
      toast.success("Message deleted");
      if (viewingMsg?.id === id) setViewingMsg(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">Loading...</p>
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
          Contact Messages
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          {messages.length} total messages · {unreadCount} unread
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-border bg-card rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Sender
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Subject
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Date
              </th>
              <th className="text-right p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className={`border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${m.status === "unread" ? "bg-primary/5" : ""}`}
              >
                <td className="p-4">
                  {m.status === "unread" ? (
                    <span className="px-2 py-1 text-xs font-body font-bold rounded-full uppercase bg-yellow-100 text-yellow-700">
                      Unread
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-body font-bold rounded-full uppercase bg-green-100 text-green-700">
                      Read
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <p className="font-body text-sm font-semibold text-foreground">
                    {m.name}
                  </p>
                  <a
                    href={`mailto:${m.email}`}
                    className="font-body text-xs text-primary hover:underline"
                  >
                    {m.email}
                  </a>
                </td>
                <td className="p-4">
                  <p className="font-body text-sm text-foreground truncate max-w-[250px]">
                    {m.subject || "No Subject"}
                  </p>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <p className="font-body text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setViewingMsg(m);
                        if (m.status === "unread")
                          handleMarkRead(m.id, m.status);
                      }}
                      className="p-2 hover:bg-secondary rounded-md transition-colors"
                      title="View Message"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleMarkRead(m.id, m.status)}
                      className="p-2 hover:bg-secondary rounded-md transition-colors"
                      title="Toggle Status"
                    >
                      <CheckCircle
                        className={`w-4 h-4 ${m.status === "read" ? "text-green-500" : "text-muted-foreground"}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground font-body text-sm"
                >
                  No messages found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Message Details Modal */}
      {viewingMsg && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl my-8 p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-foreground">
                Message Details
              </h2>
              <button
                onClick={() => setViewingMsg(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <p className="font-body text-sm font-bold text-foreground">
                    {viewingMsg.name}
                  </p>
                  <a
                    href={`mailto:${viewingMsg.email}`}
                    className="font-body text-sm text-primary hover:underline"
                  >
                    {viewingMsg.email}
                  </a>
                </div>
                <span className="font-body text-xs text-muted-foreground">
                  {new Date(viewingMsg.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Subject
                </p>
                <p className="font-body text-sm font-semibold text-foreground">
                  {viewingMsg.subject || "No Subject"}
                </p>
              </div>

              <div>
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Message
                </p>
                <div className="bg-secondary/50 p-4 rounded-md font-body text-sm text-foreground whitespace-pre-wrap">
                  {viewingMsg.message}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleMarkRead(viewingMsg.id, viewingMsg.status)
                  }
                >
                  {viewingMsg.status === "read"
                    ? "Mark as Unread"
                    : "Mark as Read"}
                </Button>
                <a
                  href={`mailto:${viewingMsg.email}?subject=Re: ${encodeURIComponent(viewingMsg.subject || "")}`}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all flex items-center justify-center"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesManager;
