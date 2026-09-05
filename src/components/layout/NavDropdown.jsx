import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function NavDropdown({ 
  title, 
  items, 
  children, 
  icon, 
  alwaysShowTitle = false, 
  menuWidth = 'min-w-56' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if a path or matchPaths is active
  const checkActive = (item) => {
    if (!item) return false;
    if (location.pathname === item.path) return true;
    if (item.matchPaths && item.matchPaths.some(p => location.pathname === p || location.pathname.startsWith(p))) {
      return true;
    }
    return false;
  };

  // Check if any item or submenu item is active
  const isActive = items ? items.some(item => {
    if (item.items) {
      return item.items.some(checkActive);
    }
    return checkActive(item);
  }) : false;

  // Find active item for title
  const activeItem = items?.find(item => {
    if (item.items) {
      return item.items.some(checkActive);
    }
    return checkActive(item);
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-600 font-bold' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        {alwaysShowTitle ? (
          <>
            {icon || activeItem?.icon}
            <span>{title}</span>
            {activeItem && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {activeItem.shortLabel || activeItem.badge || activeItem.label}
              </span>
            )}
          </>
        ) : (
          <>
            {activeItem?.icon || icon}
            <span>{activeItem?.label || title}</span>
          </>
        )}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 ${menuWidth} bg-white border border-slate-200 rounded-xl shadow-xl py-2 flex flex-col z-50 animate-in fade-in slide-in-from-top-1`}>
          {items && items.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={idx} className="h-px bg-slate-200 my-1" />;
            }

            if (item.type === 'header') {
              return (
                <div key={idx} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {item.label}
                </div>
              );
            }

            // Handle dropdown submenu items
            if (item.items) {
              const isSubmenuActive = item.items.some(checkActive);
              const activeSub = item.items.find(checkActive);
              return (
                <div
                  key={idx}
                  className="relative"
                  onMouseEnter={() => setActiveSubmenu(idx)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 text-xs cursor-pointer border-l-4 transition-colors ${
                      isSubmenuActive
                        ? 'border-blue-600 bg-blue-50/90 text-blue-700 font-bold'
                        : 'border-transparent text-slate-700 hover:bg-slate-50 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0">{item.icon}</div>
                      <span>{item.label}</span>
                      {activeSub ? (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">
                          {activeSub.shortLabel || activeSub.badge}
                        </span>
                      ) : item.badge ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>

                  {activeSubmenu === idx && (
                    <div className="absolute left-full top-0 w-84 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 ml-1.5 z-50 animate-in fade-in slide-in-from-left-1">
                      {item.items.map((subItem, subIdx) => {
                        if (subItem.type === 'divider') {
                          return <div key={subIdx} className="h-px bg-slate-200 my-1" />;
                        }
                        if (subItem.type === 'header') {
                          return (
                            <div key={subIdx} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {subItem.label}
                            </div>
                          );
                        }
                        const isSubItemActive = checkActive(subItem);
                        const isExternalTab = subItem.target === '_blank' || subItem.newTab;
                        return (
                          <Link
                            key={subIdx}
                            to={subItem.path}
                            target={isExternalTab ? '_blank' : undefined}
                            rel={isExternalTab ? 'noopener noreferrer' : undefined}
                            onClick={() => { setIsOpen(false); setActiveSubmenu(null); }}
                            className={`flex items-start gap-3 px-4 py-2.5 text-xs transition-colors border-l-4 ${
                              isSubItemActive 
                                ? 'border-blue-600 bg-blue-50/90 text-blue-700 font-bold' 
                                : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">{subItem.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-xs flex items-center gap-1.5 ${isSubItemActive ? 'font-black text-blue-800' : 'font-bold text-slate-800'}`}>
                                  {subItem.label}
                                  {isExternalTab && (
                                    <ExternalLink size={11} className="text-slate-400 shrink-0" />
                                  )}
                                </span>
                                {subItem.badge && (
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                                    isSubItemActive ? 'bg-blue-200/90 text-blue-900' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {subItem.badge}
                                  </span>
                                )}
                              </div>
                              {subItem.description && (
                                <div className="text-[11px] font-normal text-slate-400 mt-0.5 leading-snug">
                                  {subItem.description}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular items (supports rich badge & description)
            const isItemActive = checkActive(item);
            const isItemExternal = item.target === '_blank' || item.newTab;
            return (
              <Link
                key={idx}
                to={item.path}
                target={isItemExternal ? '_blank' : undefined}
                rel={isItemExternal ? 'noopener noreferrer' : undefined}
                onClick={() => setIsOpen(false)}
                className={`flex items-start gap-3 px-4 py-2.5 text-xs transition-colors border-l-4 ${
                  isItemActive 
                    ? 'border-blue-600 bg-blue-50/90 text-blue-700 font-bold' 
                    : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs flex items-center gap-1.5 ${isItemActive ? 'font-black text-blue-800' : 'font-bold text-slate-800'}`}>
                      {item.label}
                      {isItemExternal && (
                        <ExternalLink size={11} className="text-slate-400 shrink-0" />
                      )}
                    </span>
                    {item.badge && (
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                        isItemActive ? 'bg-blue-200/90 text-blue-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-[11px] font-normal text-slate-400 mt-0.5 leading-snug">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          {children}
        </div>
      )}
    </div>
  );
}
