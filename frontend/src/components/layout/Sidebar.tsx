import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CalendarDays, 
  CreditCard,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    const base = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    if (user?.role === "ADMIN") {
      base.push(
        { name: "Students", href: "/students", icon: Users },
        { name: "Teachers", href: "/teachers", icon: GraduationCap },
        { name: "Classes", href: "/classes", icon: CalendarDays },
        { name: "Payments", href: "/payments", icon: CreditCard }
      );
    } else if (user?.role === "TEACHER") {
      base.push(
        { name: "My Classes", href: "/classes", icon: CalendarDays },
        { name: "Attendance", href: "/attendance", icon: Users },
        { name: "Payments", href: "/payments", icon: CreditCard }
      );
    } else if (user?.role === "STUDENT") {
      base.push(
        { name: "My Classes", href: "/classes", icon: CalendarDays },
        { name: "Attendance", href: "/attendance", icon: Users },
        { name: "Fees", href: "/payments", icon: CreditCard }
      );
    }
    return base;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-full w-64 flex-col bg-surface-950 text-white">
      <div className="flex h-16 items-center px-6 border-b border-surface-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Tuition Track</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-surface-300 hover:bg-surface-800 hover:text-white"
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-surface-800 p-4">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 truncate">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-surface-500 capitalize">{user?.role.toLowerCase()}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-surface-300 hover:bg-surface-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
