"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, Settings, Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useState } from "react"

export function MobileHeader() {
  const { user, logout } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  if (!user) return null

  const userInitials = user.nombre ? (user.nombre.charAt(0) + (user.apellido_paterno ? user.apellido_paterno.charAt(0) : '')).toUpperCase() : 'U'

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#DDA92C] rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">L</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">LMS Interno</div>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700 p-2">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#DDA92C] text-gray-900 font-semibold text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-3">
                  <p className="text-sm font-medium leading-none text-white">
                    {user.nombre || ""} {user.apellido_paterno || ""}
                  </p>
                  <p className="text-xs leading-none text-gray-400">{user.rol}</p>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 hover:text-white">
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 hover:bg-red-900 hover:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  )
}
