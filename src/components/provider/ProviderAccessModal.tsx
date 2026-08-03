import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarCheck, Home, LayoutDashboard, LineChart, ShieldCheck, Sparkles, Star, Users, ArrowRight, X } from "lucide-react";

export interface ProviderAccessModalProps {
  open: boolean;
}

export const ProviderAccessModal: React.FC<ProviderAccessModalProps> = ({ open }) => {
  const navigate = useNavigate();

  // Prevent background scrolling when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, navigate]);

  const handleBecomeProvider = () => {
    // Assuming /settings/profile or /provider/register is the target
    navigate("/settings"); 
  };

  const features = [
    { icon: Building2, title: "Create & Manage Listings", desc: "List your hotels, restaurants, tours, vehicles and experiences.", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: CalendarCheck, title: "Receive & Manage Bookings", desc: "Receive reservations, communicate with travelers and manage schedules.", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: LayoutDashboard, title: "Access Provider Dashboard", desc: "Manage listings, earnings, bookings and marketplace activity.", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: LineChart, title: "View Provider Analytics", desc: "Track revenue, customer growth and listing performance.", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const modalVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300, duration: 0.3 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 lg:p-6">
          {/* Blurred Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-slate-950/80"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-modal-title"
            className="relative w-[92vw] max-w-[1080px] h-auto max-h-[calc(100vh-48px)] overflow-y-auto lg:overflow-hidden rounded-[32px] bg-white shadow-2xl dark:bg-[#0b1120] dark:ring-1 dark:ring-white/10"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close Button */}
            <button
              onClick={() => navigate(-1)}
              aria-label="Close modal"
              className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left Column */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left justify-center">
                  <motion.img 
                    src="/assets/images/provider-bag.png" 
                    alt="Provider Access Illustration"
                    className="w-[200px] lg:w-[240px] max-w-[260px] object-contain mx-auto lg:mx-0 drop-shadow-lg"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />

                  <h2 id="provider-modal-title" className="mt-4 text-4xl lg:text-[48px] xl:text-[54px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mx-auto lg:mx-0">
                    Provider Access<br/>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Required</span>
                  </h2>

                  <div className="my-3 flex items-center justify-center lg:justify-start gap-3 mx-auto lg:mx-0">
                    <div className="h-px w-8 bg-blue-100 dark:bg-slate-800"></div>
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <div className="h-px w-8 bg-blue-100 dark:bg-slate-800"></div>
                  </div>

                  <p className="mt-2 text-[15px] xl:text-[17px] leading-snug text-slate-500 dark:text-slate-400 max-w-sm mx-auto lg:mx-0">
                    You need to become a Provider to access this feature. Only verified Providers can unlock the Provider Dashboard and manage marketplace services.
                  </p>

                  <div className="mt-6 flex w-full max-w-sm items-start gap-3 rounded-2xl bg-[#EEF2FF] p-[16px] border border-blue-100/50 dark:bg-blue-500/10 dark:border-blue-500/20 mx-auto lg:mx-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-[14px]">Trusted. Verified. Professional.</p>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5">
                        Join our community of trusted Providers and grow your business with AI Travel Marketplace.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="rounded-[24px] bg-slate-50/50 p-5 border border-slate-100 dark:bg-slate-900/40 dark:border-slate-800/60 h-auto self-start w-full">
                  <div className="mb-4 inline-flex items-center gap-2.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <span className="text-[13px] font-bold text-blue-900 dark:text-blue-100">
                      As a Provider, you can:
                    </span>
                  </div>

                  <div className="relative flex flex-col gap-[16px]">
                    {/* Dotted Timeline Line */}
                    <div className="absolute left-[24px] top-6 bottom-6 w-px border-l-2 border-dotted border-slate-200 dark:border-slate-700"></div>
                    
                    {features.map((feature, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (i * 0.1) }}
                        className="relative z-10 flex items-center gap-4 rounded-[16px] border border-slate-100 bg-white p-[16px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.03)] transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                      >
                        <div className={`flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl ${feature.bg} ${feature.color} ring-1 ring-black/5 dark:ring-white/5`}>
                          <feature.icon className="h-[22px] w-[22px]" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-0.5">{feature.title}</h4>
                          <p className="text-[15px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-2">{feature.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Row */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left Bottom */}
                <div className="flex flex-col w-full max-w-md mx-auto lg:mx-0">
                  <button
                    onClick={handleBecomeProvider}
                    className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-[16px] bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[15px] font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                  >
                    <span className="text-lg">👑</span>
                    <span>Become a Provider</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[16px] border border-slate-100 bg-slate-50 p-3 dark:border-slate-800/60 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
                      <Users className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span>Thousands of providers are already growing their business with AI Travel.</span>
                    </div>
                    <button className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      Learn more <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Right Bottom */}
                <div className="flex flex-col w-full">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex h-12 w-full items-center justify-center rounded-[16px] border-2 border-slate-200 bg-white px-6 text-[15px] font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800/50 dark:focus:ring-slate-800"
                  >
                    Go Back
                  </button>

                  <div className="mt-5 pt-2 text-center lg:text-right">
                    <button
                      onClick={() => navigate("/")}
                      className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Home className="h-3.5 w-3.5" />
                      Return to Home
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
