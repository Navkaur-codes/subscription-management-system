import {
  BarChart3,
  Boxes,
  CalendarClock,
  CreditCard,
  FileText,
  LayoutDashboard,
  Percent,
  ReceiptText,
  ScrollText,
  Tags,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/session";

export type NavItem = { href: string; label: string; icon: LucideIcon; roles: Role[] };
export type NavGroup = { label: string; items: NavItem[] };

const TEAM: Role[] = ["ADMIN", "STAFF"];

/** Every internal route. Main session owns this file. */
export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: TEAM },
      { href: "/reports", label: "Reports", icon: BarChart3, roles: TEAM },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/subscriptions", label: "Subscriptions", icon: CalendarClock, roles: TEAM },
      { href: "/customers", label: "Customers", icon: Users, roles: TEAM },
      { href: "/templates", label: "Quotation templates", icon: ScrollText, roles: TEAM },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/invoices", label: "Invoices", icon: ReceiptText, roles: TEAM },
      { href: "/payments", label: "Payments", icon: CreditCard, roles: TEAM },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: Boxes, roles: TEAM },
      { href: "/plans", label: "Plans", icon: FileText, roles: TEAM },
      { href: "/taxes", label: "Taxes", icon: Tags, roles: TEAM },
      { href: "/discounts", label: "Discounts", icon: Percent, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/users", label: "Team members", icon: UserCog, roles: ["ADMIN"] }],
  },
];

export const PORTAL_NAV = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/subscriptions", label: "Subscriptions" },
  { href: "/portal/invoices", label: "Invoices" },
];
