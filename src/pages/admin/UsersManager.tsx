import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DbUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  sponsored_details?: string;
  area?: string;
  license_number?: string;
  is_approved?: boolean;
  plain_password?: string;
  created_at: string;
}

const UsersManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["dealers_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbUser[];
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users_list"] });
    },
  });

  const updateApproval = useMutation({
    mutationFn: async ({
      id,
      is_approved,
    }: {
      id: string;
      is_approved: boolean;
    }) => {
      const { error } = await supabase
        .from("dealers")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealers_list"] });
    },
  });

  const deleteDealer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dealers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealers_list"] });
    },
  });

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ id, role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch {
      toast.error("Failed to update user role. Are you sure you are an admin?");
    }
  };

  const handleApprovalChange = async (id: string, is_approved: boolean) => {
    try {
      await updateApproval.mutateAsync({ id, is_approved });
      toast.success(
        `Dealer ${is_approved ? "approved" : "disabled"} successfully`,
      );
    } catch {
      toast.error("Failed to update dealer status");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this dealer?")) {
      try {
        await deleteDealer.mutateAsync(id);
        toast.success("Dealer deleted successfully");
      } catch {
        toast.error("Failed to delete dealer");
      }
    }
  };

  const searchTerms = search
    .toLowerCase()
    .split(" ")
    .filter((term) => term.trim() !== "");

  const filtered = users.filter((u) => {
    if (searchTerms.length === 0) return true;

    const searchableText = [
      u.full_name,
      u.email,
      u.area,
      u.phone,
      u.sponsored_details,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchTerms.every((term) => searchableText.includes(term));
  });

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">
        Loading users...
      </p>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Dealers
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage wholesale dealer registrations and approvals
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-border bg-card rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
          >
            {/* Left accent border */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${user.is_approved ? "bg-green-500" : "bg-amber-400"}`}
            ></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto flex-1 pl-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 w-full">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-lg text-gray-900 leading-none">
                    {user.full_name || "No Name"}
                  </h3>
                  {!user.is_approved && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-500 font-body">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${user.email}`}
                      className="hover:text-primary transition-colors"
                    >
                      {user.email}
                    </a>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${user.phone}`}
                        className="hover:text-primary transition-colors"
                      >
                        {user.phone}
                      </a>
                    </div>
                  )}
                </div>
                {user.plain_password && (
                  <div className="flex items-center gap-2 mt-2 bg-gray-50 w-max px-3 py-1.5 rounded-lg border border-gray-100">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-gray-600 font-medium">
                      Password:{" "}
                      <span className="font-mono text-gray-900 tracking-wider font-bold">
                        {user.plain_password}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 w-full lg:w-auto lg:border-l border-gray-100 lg:pl-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      License
                    </p>
                    <p className="font-medium text-gray-900">
                      {user.license_number || (
                        <span className="italic text-gray-400 font-normal">
                          Not provided
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Joined
                    </p>
                    <p className="font-medium text-gray-900">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Location
                    </p>
                    <div className="font-medium text-gray-900 leading-tight mt-1 space-y-1">
                      {user.sponsored_details && (
                        <span className="block text-gray-700">
                          <span className="text-gray-500 font-normal">
                            Address:
                          </span>{" "}
                          {user.sponsored_details}
                        </span>
                      )}
                      {user.area && (
                        <span className="block">
                          <span className="text-gray-500 font-normal">
                            Area:
                          </span>{" "}
                          {user.area}
                        </span>
                      )}
                      {!user.area && !user.sponsored_details && (
                        <span className="block italic text-gray-400 font-normal">
                          Not provided
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 gap-4 shrink-0">
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                <span
                  className={`text-sm font-bold ${user.is_approved ? "text-green-600" : "text-amber-500"}`}
                >
                  {user.is_approved ? "Approved" : "Disabled"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={user.is_approved || false}
                    disabled={updateApproval.isPending}
                    onChange={(e) =>
                      handleApprovalChange(user.id, e.target.checked)
                    }
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                </label>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={deleteDealer.isPending}
                className="flex items-center gap-2 px-3 py-3 text-sm text-red-600 bg-red-50 hover:bg-red-400 hover:text-white rounded-xl transition-all duration-300 font-bold border border-red-100 group-hover:opacity-100 lg:opacity-70 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">
              No dealers found
            </h3>
            <p className="text-gray-500 font-body">
              There are no dealers matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManager;
