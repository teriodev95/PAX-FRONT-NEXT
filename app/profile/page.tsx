"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ModernHeader } from "@/components/layout/modern-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Building, MapPin, Award, BookOpen, Clock, Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ModernHeader />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#DDA92C] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-gray-900 font-bold text-2xl sm:text-3xl">
                {user.nombre ? user.nombre.charAt(0).toUpperCase() : ""}
                {user.apellido_paterno ? user.apellido_paterno.charAt(0).toUpperCase() : ""}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Mi Perfil</h1>
            <p className="text-sm sm:text-base text-gray-400">Información personal y progreso académico</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <User className="mr-2 h-5 w-5 text-[#DDA92C]" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-400">Nombre Completo</label>
                      <p className="text-base sm:text-lg font-medium text-white">
                        {user.nombre || ""} {user.apellido_paterno || ""} {user.apellido_materno}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-400">Usuario</label>
                      <p className="text-base sm:text-lg font-medium text-white">{user.Usuario}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-400">ID de Usuario</label>
                      <p className="text-base sm:text-lg font-medium text-white">{user.UsuarioID}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-1">Tipo</label>
                      <Badge className="bg-[#DDA92C] text-gray-900 inline-block">{user.rol}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organizational Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Building className="mr-2 h-5 w-5 text-[#DDA92C]" />
                    Información Organizacional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-400">Gerencia</label>
                      <p className="text-base sm:text-lg font-medium text-white">{user.Gerencia}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-400">Agencia</label>
                      <p className="text-base sm:text-lg font-medium text-white">{user.Agencia}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sucursales */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <MapPin className="mr-2 h-5 w-5 text-[#DDA92C]" />
                    Sucursales Asignadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {user.sucursales.map((sucursal) => (
                      <Badge key={sucursal} variant="outline" className="border-gray-600 text-gray-300 text-xs sm:text-sm">
                        {sucursal}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              {/* Progress Stats */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Award className="mr-2 h-5 w-5 text-[#DDA92C]" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-[#DDA92C] mx-auto mb-1 sm:mb-2" />
                      <div className="text-xl sm:text-2xl font-bold text-white">0</div>
                      <div className="text-xs sm:text-sm text-gray-400">Cursos</div>
                    </div>

                    <div className="text-center p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[#DDA92C] mx-auto mb-1 sm:mb-2" />
                      <div className="text-xl sm:text-2xl font-bold text-white">0h</div>
                      <div className="text-xs sm:text-sm text-gray-400">Estudio</div>
                    </div>

                    <div className="text-center p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <Award className="h-6 w-6 sm:h-8 sm:w-8 text-[#DDA92C] mx-auto mb-1 sm:mb-2" />
                      <div className="text-xl sm:text-2xl font-bold text-white">0</div>
                      <div className="text-xs sm:text-sm text-gray-400">Certificados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => router.push("/home")}
                    className="w-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 text-sm sm:text-base py-2 sm:py-2.5"
                  >
                    Ver Cursos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
