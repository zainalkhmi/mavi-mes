import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function NavDropdown({ title, pathMatches, items, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const isActive = pathMatches.some(path => location.pathname.includes(path) || location.pathname === path);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-[0.9rem] font-semibold rounded transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        {title}
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-md py-2 flex flex-col z-[1001] overflow-hidden">
          {items && items.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={idx} className="h-px bg-slate-200 my-1" />;
            }
            if (item.type === 'custom') {
              return <div key={idx} onClick={() => setIsOpen(false)}>{item.content}</div>;
            }
            
            const isItemActive = location.pathname === item.path;
            
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-3 text-[0.85rem] font-semibold transition-colors border-l-4 ${
                  isItemActive 
                    ? 'border-blue-500 bg-blue-50 text-blue-500' 
                    : 'border-transparent text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
          {children && <div onClick={() => setIsOpen(false)}>{children}</div>}
        </div>
      )}
    </div>
  );
}
