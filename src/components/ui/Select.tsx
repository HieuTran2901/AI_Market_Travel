import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown, Check } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value: controlledValue, onChange, defaultValue, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    // Manage internal value to render the trigger label correctly if it's uncontrolled
    const [internalValue, setInternalValue] = React.useState(controlledValue ?? defaultValue ?? "");
    
    React.useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue as string);
      }
    }, [controlledValue]);

    // Parse children to get options
    const options = React.useMemo(() => {
      const opts: { value: string, label: string, disabled?: boolean }[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          opts.push({
            value: child.props.value as string,
            label: child.props.children as string,
            disabled: child.props.disabled
          });
        }
      });
      return opts;
    }, [children]);

    const selectedOption = options.find(opt => String(opt.value) === String(internalValue)) || options[0];

    const containerRef = React.useRef<HTMLDivElement>(null);
    const nativeSelectRef = React.useRef<HTMLSelectElement | null>(null);

    // Merge refs for the native select
    const mergedRef = React.useCallback((node: HTMLSelectElement) => {
      nativeSelectRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLSelectElement>).current = node;
    }, [ref]);

    // Handle outside click to close
    React.useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isOpen]);

    const handleSelect = (val: string, isDisabled?: boolean) => {
      if (isDisabled) return;
      
      if (controlledValue === undefined) {
        setInternalValue(val);
      }
      setIsOpen(false);
      
      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = val;
        // manually dispatch change event for react-hook-form / native listeners
        const event = new Event('change', { bubbles: true });
        nativeSelectRef.current.dispatchEvent(event);
        
        if (onChange) {
           onChange({
             target: { name: props.name, value: val },
             currentTarget: { name: props.name, value: val },
             preventDefault: () => {},
             stopPropagation: () => {}
           } as any);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      } else if (isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
         e.preventDefault();
         const currentIndex = options.findIndex(opt => String(opt.value) === String(internalValue));
         let nextIndex = currentIndex;
         if (e.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
         if (e.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
         
         const nextOpt = options[nextIndex];
         if (!nextOpt.disabled) {
           handleSelect(nextOpt.value);
         }
      }
    };

    return (
      <div 
        className="relative w-full text-left" 
        ref={containerRef}
      >
        <select 
          ref={mergedRef}
          value={internalValue}
          onChange={onChange}
          disabled={disabled}
          {...props}
          className="sr-only" // visually hidden
        >
          {children}
        </select>
        
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-[48px] w-full items-center justify-between rounded-[14px] border border-white/8 bg-[#1A2032] px-4 text-[15px] font-medium text-white transition-all duration-200 outline-none",
            "hover:border-blue-400/55 hover:bg-[#1E2437]",
            "focus-visible:border-blue-500 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]",
            disabled && "cursor-not-allowed opacity-50 hover:border-white/5 hover:bg-[#1A2032]",
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">{selectedOption?.label || "Select..."}</span>
          <ChevronDown 
            className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen ? "rotate-180" : "")} 
            style={{ color: 'inherit', opacity: 0.7 }}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute left-0 right-0 z-[999] mt-1.5 overflow-hidden rounded-[16px] border border-white/10 bg-[#1E2437] shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              <ul 
                className="max-h-[264px] overflow-y-auto p-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-blue-600 [&::-webkit-scrollbar-thumb]:to-indigo-500 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
                role="listbox"
              >
                {options.map((opt) => {
                  const isSelected = String(opt.value) === String(internalValue);
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value, opt.disabled)}
                      className={cn(
                        "relative flex h-[44px] cursor-pointer items-center justify-between rounded-[12px] px-3 transition-colors duration-150",
                        opt.disabled && "cursor-not-allowed opacity-50",
                        !opt.disabled && !isSelected && "hover:bg-blue-500/12 hover:text-white",
                        isSelected 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]" 
                          : "text-slate-300"
                      )}
                    >
                      <span className={cn("truncate text-[15px]", isSelected ? "font-medium" : "")}>{opt.label}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
