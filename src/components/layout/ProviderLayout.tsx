import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Banknote,
  CalendarCheck,
  ChevronDown,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemeMenu, ThemeToggle } from "@/components/theme/ThemeControls";

const getInitials = (name?: string) => {
  if (!name) return "P";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export const ProviderLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [isProfileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement | null>(null);

  const providerName =
    user?.providerProfile?.businessName || user?.fullName || "Provider";
  const providerRole = user?.providerProfile?.businessType
    ? `${user.providerProfile.businessType.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())} Provider`
    : "Marketplace Provider";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  React.useEffect(() => {
    if (!isProfileOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isProfileOpen]);

  const navItems = [
    { name: "Overview", path: "/provider/dashboard", icon: LayoutDashboard },
    { name: "My Listings", path: "/provider/listings", icon: ListOrdered },
    { name: "Bookings", path: "/provider/bookings", icon: CalendarCheck },
    { name: "Settlements", path: "/provider/settlements", icon: Banknote },
    { name: "Reviews & Ratings", path: "/provider/reviews", icon: Star },
    { name: "Messages", path: "/provider/messages", icon: MessageSquare },
    { name: "Analytics", path: "/provider/analytics", icon: BarChart3 },
    { name: "Profile", path: "/provider/profile", icon: UserCircle },
    { name: "Settings", path: "/provider/settings", icon: Settings },
  ];

  return (
    <div className={`provider-theme ${resolvedTheme === "dark" ? "dark" : ""}`}>
      <div className="flex min-h-screen bg-[#f7f9fc] text-slate-950 transition-colors duration-200 dark:bg-[#07111f] dark:text-slate-50">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close provider navigation"
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm xl:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
        fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] transform flex-col overflow-hidden border-r border-slate-200/70 bg-gradient-to-br from-white via-sky-50/70 to-blue-50/45 shadow-[12px_0_34px_rgba(15,23,42,0.08)] transition-transform duration-300 ease-out dark:border-blue-300/10 dark:bg-[#061322] dark:bg-none dark:shadow-blue-950/35 xl:z-40 xl:translate-x-0 xl:rounded-r-[26px]
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
        >
          <div className="relative flex h-full min-h-0 flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_30%_0%,rgba(59,130,246,0.14),transparent_58%)] dark:bg-[radial-gradient(circle_at_30%_0%,rgba(59,130,246,0.18),transparent_55%)]" />
            <div className="relative flex min-h-[118px] items-center justify-between px-7 pt-5">
              <button
                type="button"
                className="flex items-center gap-3 text-left"
                onClick={() => navigate("/")}
              >
                <img
                  src="/brand/ai-marketplace-traveler-logo.png"
                  alt="AI Marketplace Traveler"
                  className="h-[58px] w-auto object-contain drop-shadow-[0_10px_22px_rgba(37,99,235,0.16)] dark:drop-shadow-[0_10px_22px_rgba(59,130,246,0.22)]"
                />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white xl:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative px-7 pb-3 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Main Menu
              </p>
            </div>

            <nav className="relative min-h-0 flex-1 space-y-1 overflow-y-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => `
                  group flex min-h-[50px] items-center gap-3 rounded-[14px] px-4 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60
                  ${
                    isActive
                      ? "translate-x-0 bg-gradient-to-r from-blue-600 to-[#4f8dfd] text-white shadow-[0_8px_22px_rgba(37,99,235,0.22)]"
                      : "text-slate-700 hover:translate-x-0.5 hover:bg-blue-50/80 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-white"
                  }
                `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="flex w-8 shrink-0 justify-center">
                    <item.icon
                      className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${""}`}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                </NavLink>
              ))}
            </nav>

            <div className="relative shrink-0 space-y-4 p-5 pt-3">
              {/* <div className="overflow-hidden rounded-[18px] border border-blue-100 bg-blue-50/65 p-4 shadow-sm dark:border-blue-300/15 dark:bg-white/[0.055]">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-100 text-blue-600 ring-1 ring-blue-200/70 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-300/20">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      Provider Tools
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-600 dark:text-slate-300">
                      Everything you need to manage and grow your hospitality
                      business.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate("/provider/analytics");
                  }}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:border-blue-300/15 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500 dark:hover:text-white"
                >
                  Explore Tools
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div> */}
              <button
                onClick={handleLogout}
                className="flex h-12 w-full items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300/40 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200 dark:hover:border-red-400/30 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-clip xl:ml-[260px]">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800 dark:bg-[#081321]/92">
            <div className="flex h-20 w-full items-center justify-between px-4 lg:px-5 xl:px-6 2xl:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
                  aria-label="Open provider navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black tracking-tight text-blue-600">
                      Provider Portal
                    </p>
                    {user?.providerProfile?.verificationStatus === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/25">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:block">
                    Marketplace management dashboard
                  </p>
                </div>
              </div>

              <div className="mx-4 hidden min-w-0 flex-1 justify-center lg:flex">
                <label className="relative w-full max-w-[440px]">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 dark:text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="search"
                    placeholder="Search anything..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white/90 pl-11 pr-16 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/70 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-black text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                      /
                    </kbd>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <ThemeToggle />
                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isProfileOpen}
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/60 dark:border-slate-700/70 dark:bg-slate-900/80 dark:hover:border-blue-400/40"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={providerName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                        {getInitials(providerName)}
                      </span>
                    )}
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-[160px] truncate text-sm font-black text-slate-950 dark:text-slate-50">
                        {providerName}
                      </span>
                      <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {providerRole}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/70 dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-slate-950/50">
                      <div className="flex items-center gap-3 px-3 py-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                          {getInitials(providerName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-slate-50">
                            {providerName}
                          </p>
                          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {providerRole}
                          </p>
                        </div>
                      </div>
                      <ThemeMenu />
                      <div className="border-t border-slate-200/80 p-2 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 max-w-full flex-1 overflow-x-clip overflow-y-auto bg-[#f7f9fc] transition-colors duration-200 dark:bg-[#07111f]">
            <div className="w-full min-w-0 max-w-full px-4 py-5 lg:px-5 xl:px-6 2xl:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
