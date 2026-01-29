import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  LogOut,
  Menu,
  X,
  UserCheck,
  BarChart3,
  Wallet
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Produtos",
    url: createPageUrl("Products"),
    icon: Package,
  },
  {
    title: "Clientes",
    url: createPageUrl("Clients"),
    icon: Users,
  },
  {
    title: "Vendedores",
    url: createPageUrl("Sellers"),
    icon: UserCheck,
  },
  {
    title: "Vendas",
    url: createPageUrl("Sales"),
    icon: ShoppingCart,
  },
  {
    title: "Caixa",
    url: createPageUrl("CashRegister"),
    icon: Wallet,
  },
  {
    title: "Relatórios",
    url: createPageUrl("Reports"),
    icon: BarChart3,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getUserInitials = () => {
    if (!user?.full_name) return "U";
    return user.full_name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleName = () => {
    const roleMap = {
      admin: "Administrador",
      operator: "Operador",
      viewer: "Consulta"
    };
    return roleMap[user?.user_role || user?.role] || "Usuário";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <style>{`
        :root {
          --navy: #1e3a5f;
          --green: #10b981;
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#10b981] flex items-center justify-center">
                <span className="text-white font-bold text-sm">GT</span>
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--navy)' }}>Geek Tec</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex pt-16 lg:pt-0">
        {/* Sidebar */}
        <aside className={`
          fixed top-16 lg:top-0 left-0 h-[calc(100vh-4rem)] lg:h-screen w-72 
          bg-white border-r border-slate-200 z-40 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Header */}
          <div className="hidden lg:flex items-center gap-3 p-6 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#10b981] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">GT</span>
            </div>
            <div>
              <h2 className="font-bold text-xl" style={{ color: 'var(--navy)' }}>Geek Tec</h2>
              <p className="text-xs text-slate-500">Sistema de Vendas</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-[#1e3a5f] to-[#10b981] text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-gradient-to-br from-[#1e3a5f] to-[#10b981]">
                  <AvatarFallback className="text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs text-slate-500">{getRoleName()}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}