'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Folder, Home, Scissors, Calendar, FileText, Clock } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/mi', label: 'Ministrarte', icon: Folder },
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/services', label: 'Servicios', icon: Scissors },
    { href: '/dashboard/availability', label: 'Disponibilidad', icon: Calendar },
    { href: '/dashboard/appointments', label: 'Turnos', icon: FileText },
    { href: '/dashboard/history', label: 'Historial', icon: Clock },
  ];

  return (
    <aside className="w-[240px] shrink-0 bg-blue-50 flex flex-col border-r border-blue-100">
      {/* Navigation */}
      <nav className="flex-1 py-4 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
