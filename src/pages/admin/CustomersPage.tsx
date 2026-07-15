import { useOrders } from "@/hooks/useDatabase";
import { Mail, Phone, MapPin } from "lucide-react";
import DirhamIcon from "@/components/DirhamIcon";

const CustomersPage = () => {
  const { data: orders = [], isLoading } = useOrders();

  const customersMap = new Map<
    string,
    {
      name: string;
      email: string;
      phone: string;
      address: string;
      orders: number;
      totalSpent: number;
      lastOrder: string;
    }
  >();
  orders.forEach((o) => {
    const key = o.customer_email || o.customer_phone;
    const existing = customersMap.get(key);
    if (existing) {
      existing.orders += 1;
      existing.totalSpent += Number(o.total);
      if (o.created_at > existing.lastOrder) existing.lastOrder = o.created_at;
    } else {
      customersMap.set(key, {
        name: o.customer_name,
        email: o.customer_email || "",
        phone: o.customer_phone,
        address: o.shipping_address,
        orders: 1,
        totalSpent: Number(o.total),
        lastOrder: o.created_at,
      });
    }
  });

  const customers = Array.from(customersMap.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent,
  );

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">Loading...</p>
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
          Customers
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          {customers.length} customers
        </p>
      </div>
      {customers.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <p className="font-heading text-xl uppercase font-bold mb-2 text-foreground">
            No Customers Yet
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Customers will appear here after orders are placed
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Contact
                </th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Orders
                </th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Total Spent
                </th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Last Order
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.email || c.phone}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-heading font-bold text-primary">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">
                          {c.name}
                        </p>
                        <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {c.address}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {c.email}
                    </p>
                    <p className="font-body text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </p>
                  </td>
                  <td className="p-4 font-body text-sm font-semibold text-foreground">
                    {c.orders}
                  </td>
                  <td className="p-4 font-body text-sm font-bold text-primary flex items-center">
                    <DirhamIcon className="mr-1" /> {c.totalSpent}
                  </td>
                  <td className="p-4 font-body text-sm text-muted-foreground">
                    {new Date(c.lastOrder).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
