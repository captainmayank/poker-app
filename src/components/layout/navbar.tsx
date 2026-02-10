"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLES } from "@/lib/constants";
import { Home, Users, Calendar, DollarSign, BarChart3, User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === ROLES.ADMIN;

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Poker Tracker
          </Link>
          <div className="hidden space-x-4 md:flex">
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/sessions"
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary"
            >
              <Calendar className="h-4 w-4" />
              <span>Sessions</span>
            </Link>
            <Link
              href="/settlements"
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary"
            >
              <DollarSign className="h-4 w-4" />
              <span>Settlements</span>
            </Link>
            <Link
              href="/reports"
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Reports</span>
            </Link>
            {isAdmin && (
              <Link
                href="/players"
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary"
              >
                <Users className="h-4 w-4" />
                <span>Players</span>
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{session.user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-600"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
