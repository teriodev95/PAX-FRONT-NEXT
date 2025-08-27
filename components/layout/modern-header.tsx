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

export function ModernHeader() {
  const { user, logout } = useAuth()

  if (!user) return null

  const userInitials = `${user.nombre.charAt(0)}${user.apellido_paterno.charAt(0)}`

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/home" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#DDA92C] rounded-lg flex items-center justify-center">
            <span className="text-gray-900 font-bold text-lg">L</span>
          </div>
          <div>
            <div className="text-xl font-bold text-white">LMS Interno</div>
            <div className="text-xs text-gray-400">Plataforma de Aprendizaje</div>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#DDA92C] text-gray-900 font-semibold">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-3">
                <p className="text-sm font-medium leading-none text-white">
                  {user.nombre} {user.apellido_paterno}
                </p>
                <p className="text-xs leading-none text-gray-400">{user.rol}</p>
                <p className="text-xs leading-none text-gray-500">{user.usuario}</p>
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white">
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-red-400 hover:bg-red-900/50 hover:text-red-300 focus:bg-red-900/50 focus:text-red-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
