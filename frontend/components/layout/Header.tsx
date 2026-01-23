'use client';

interface HeaderProps {
  userEmail?: string | null;
}

export default function Header({ userEmail }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between z-10">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{userEmail || 'Usuario'}</span>
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
          {userEmail ? userEmail[0].toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}
