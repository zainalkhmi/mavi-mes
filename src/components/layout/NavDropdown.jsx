import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function NavDropdown({ title, items, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = items ? items.some(item => location.pathname === item.path) : false;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
      >
        {title}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 min-w-48 bg-white border border-slate-200 rounded-lg shadow-md py-2 flex flex-col z-50">
          {items && items.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={idx} className="h-px bg-slate-200 my-1" />;
            }
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
