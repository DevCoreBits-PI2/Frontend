"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type User = {
  nombre: string;
  rol: string;
  imagen_url?: string | null;
};

type HeaderProps = {
  user: User | null;
};

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="w-full border-b bg-white px-6 py-3 flex items-center justify-between">
      
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 flex items-center gap-2">
        <Link href="/" className="hover:underline text-gray-500">
          Inicio
        </Link>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;

          return (
            <span key={href} className="flex items-center gap-2">
              <span className="text-gray-400">›</span>

              {isLast ? (
                <span className="font-medium text-gray-800">
                  {formatSegment(segment)}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:underline text-gray-500"
                >
                  {formatSegment(segment)}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Usuario */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-right">
              <p className="text-sm font-medium">{user.nombre}</p>
              <p className="text-xs text-gray-500">{user.rol}</p>
            </div>

            {user.imagen_url ? (
              <img
                src={user.imagen_url}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
                {user.nombre?.charAt(0)}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400"></p>
        )}
      </div>
    </header>
  );
}