import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function NavDropdown({ title, items, children }) {
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

  // Check if any item or submenu item is active
  const isActive = items ? items.some(item => {
    if (item.items) {
      return item.items.some(subItem => location.pathname === subItem.path);
    }
    return location.pathname === item.path;
  }) : false;

  // Find active item for title
  const activeItem = items?.find(item => {
    if (item.items) {
      return item.items.some(subItem => location.pathname === subItem.path);
    }
    return location.pathname === item.path;
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
      >
        {activeItem?.icon}
        {activeItem?.label || title}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 min-w-56 bg-white border border-slate-200 rounded-lg shadow-md py-2 flex flex-col z-50">
          {items && items.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={idx} className="h-px bg-slate-200 my-1" />;
            }

            // Handle dropdown submenu items
            if (item.items) {
              return (
                <div
                  key={idx}
                  className="relative"
                  onMouseEnter={() => setActiveSubmenu(idx)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-3 text-sm font-semibold cursor-pointer border-l-4 border-transparent hover:bg-slate-50`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>

                  {activeSubmenu === idx && (
                    <div className="absolute left-full top-0 min-w-48 bg-white border border-slate-200 rounded-lg shadow-md py-2 ml-1">
                      {item.items.map((subItem, subIdx) => {
                        if (subItem.type === 'divider') {
                          return <div key={subIdx} className="h-px bg-slate-200 my-1" />;
                        }
                        const isSubItemActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subIdx}
                            to={subItem.path}
                            onClick={() => { setIsOpen(false); setActiveSubmenu(null); }}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-l-4 ${isSubItemActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent text-slate-800 hover:bg-slate-50'}`}
                          >
                            {subItem.icon}
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular items
            const isItemActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-l-4 ${isItemActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent text-slate-800 hover:bg-slate-50'}`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
          {children}
        </div>
      )}
    </div>
  );
}
