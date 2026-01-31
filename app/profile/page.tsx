"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ModernHeader } from "@/components/layout/modern-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { coursesService, type CourseEnrollment } from "@/services/courses-service"
import { downloadCertificateFromTemplate } from "@/components/certificate/download-certificate"
import {
  User,
  Building,
  MapPin,
  Award,
  BookOpen,
  Clock,
  Loader2,
  Download,
  CheckCircle,
  Trophy,
  FileText,
  ChevronRight,
  GraduationCap,
} from "lucide-react"

interface CompletedCourse {
  enrollment: CourseEnrollment
  examStatus: {
    aprobado: boolean
    puntaje?: string
    fechaAprobacion?: string
  }
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadCompletedCourses()
    }
  }, [user])

  const loadCompletedCourses = async () => {
    if (!user) return

    try {
      setLoadingCourses(true)
      const userId = (user as any).id

      const enrolledCourses = await coursesService.getEnrolledCourses(userId)

      const coursesWithExamStatus = await Promise.all(
        enrolledCourses.map(async (enrollment) => {
          try {
            const examStatus = await coursesService.verificarExamenAprobado(
              userId,
              enrollment.cursoId
            )
            return {
              enrollment,
              examStatus: examStatus || { aprobado: false },
            }
          } catch {
            return {
              enrollment,
              examStatus: { aprobado: false },
            }
          }
        })
      )

      const completed = coursesWithExamStatus.filter(
        (course) => course.examStatus.aprobado
      )

      setCompletedCourses(completed)

      const totalHours = enrolledCourses.reduce(
        (acc, course) => acc + (course.curso?.duracionVideoMinutos || 0),
        0
      )

      setStats({
        totalCourses: enrolledCourses.length,
        completedCourses: completed.length,
        totalHours: Math.round(totalHours / 60),
      })
    } catch (error) {
      console.error("Error cargando cursos completados:", error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleDownloadCertificate = async (course: CompletedCourse) => {
    if (!user) return

    const courseId = course.enrollment.cursoId
    setDownloadingId(courseId)

    try {
      const configResponse = await coursesService.getCertificateConfig()
      const config = configResponse.message.certificate

      const fullName = `${user.nombre || ""} ${user.apellido_paterno || ""} ${user.apellido_materno || ""}`.trim()
      const currentDate = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      const userId = (user as any).id
      const certificateId = `CERT-${userId?.slice(0, 8)}-${courseId.slice(0, 8)}`
      const PRODUCTION_URL = "https://pax-front.xpress1.cc"

      const score = course.examStatus.puntaje
        ? parseFloat(course.examStatus.puntaje)
        : undefined

      const queryParams = new URLSearchParams({
        userName: fullName || "Nombre del Participante",
        courseName: course.enrollment.curso.titulo,
        ...(score !== undefined && { score: score.toString() }),
      }).toString()

      await downloadCertificateFromTemplate({
        recipientName: fullName || "Nombre del Participante",
        courseName: course.enrollment.curso.titulo,
        completionDate: course.examStatus.fechaAprobacion
          ? new Date(course.examStatus.fechaAprobacion).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : currentDate,
        coordinatorName: config.issued_by || "PAX Learning",
        coordinatorTitle: "Coordinador",
        certificateType: "CERTIFICADO DE RECONOCIMIENTO",
        certificateId: certificateId,
        verificationUrl: `${PRODUCTION_URL}/verify/${userId}/${courseId}?${queryParams}`,
        fileName: `certificado-${courseId}-${user.Usuario}.pdf`,
        score: score,
      })
    } catch (error) {
      console.error("Error descargando certificado:", error)
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#DDA92C]" />
          <p className="text-gray-400 text-sm">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const fullName = `${user.nombre || ""} ${user.apellido_paterno || ""} ${user.apellido_materno || ""}`.trim()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ModernHeader />

      <main className="pb-8">
        {/* Profile Hero Section */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 pt-8 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-[#DDA92C] to-[#c49625] rounded-full flex items-center justify-center shadow-lg shadow-[#DDA92C]/20">
                <span className="text-gray-900 font-bold text-3xl">
                  {user.nombre ? user.nombre.charAt(0).toUpperCase() : ""}
                  {user.apellido_paterno ? user.apellido_paterno.charAt(0).toUpperCase() : ""}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-gray-900">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Name & Role */}
            <h1 className="text-xl font-semibold text-white mb-1">{fullName}</h1>
            <p className="text-gray-400 text-sm mb-3">@{user.Usuario}</p>
            <Badge className="bg-[#DDA92C]/15 text-[#DDA92C] border-[#DDA92C]/25 font-medium">
              {user.rol}
            </Badge>
          </div>
        </div>

        {/* Stats Cards - Floating */}
        <div className="px-4 -mt-8">
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 rounded-2xl p-4 text-center border border-gray-700/50 shadow-lg">
                <BookOpen className="h-5 w-5 text-[#DDA92C] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalCourses}</div>
                <div className="text-xs text-gray-500">Cursos</div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-4 text-center border border-gray-700/50 shadow-lg">
                <Clock className="h-5 w-5 text-[#DDA92C] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalHours}h</div>
                <div className="text-xs text-gray-500">Estudio</div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-4 text-center border border-gray-700/50 shadow-lg">
                <Award className="h-5 w-5 text-[#DDA92C] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.completedCourses}</div>
                <div className="text-xs text-gray-500">Certificados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-4 mt-6 space-y-4 max-w-lg mx-auto">

          {/* Personal Info Card */}
          <Card className="bg-gray-800/50 border-gray-700/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#DDA92C]" />
                  <span className="text-sm font-medium text-gray-300">Información Personal</span>
                </div>
              </div>
              <div className="divide-y divide-gray-700/30">
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Nombre</span>
                  <span className="text-sm text-white font-medium">{fullName}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-400">ID Usuario</span>
                  <span className="text-sm text-white font-medium">{user.UsuarioID}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Card */}
          <Card className="bg-gray-800/50 border-gray-700/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-[#DDA92C]" />
                  <span className="text-sm font-medium text-gray-300">Organización</span>
                </div>
              </div>
              <div className="divide-y divide-gray-700/30">
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Gerencia</span>
                  <span className="text-sm text-white font-medium">{user.Gerencia}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Agencia</span>
                  <span className="text-sm text-white font-medium">{user.Agencia}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branches Card */}
          <Card className="bg-gray-800/50 border-gray-700/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#DDA92C]" />
                  <span className="text-sm font-medium text-gray-300">Sucursales</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {user.sucursales.map((sucursal) => (
                    <Badge
                      key={sucursal}
                      variant="outline"
                      className="border-gray-600/50 text-gray-300 text-xs bg-gray-700/30"
                    >
                      {sucursal}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#DDA92C]" />
                <h2 className="text-base font-semibold text-white">Mis Certificados</h2>
              </div>
              {completedCourses.length > 0 && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">
                  {completedCourses.length}
                </Badge>
              )}
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-[#DDA92C] mr-2" />
                <span className="text-gray-400 text-sm">Cargando...</span>
              </div>
            ) : completedCourses.length === 0 ? (
              <Card className="bg-gray-800/30 border-gray-700/30 border-dashed">
                <CardContent className="py-10 text-center">
                  <div className="w-14 h-14 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-7 w-7 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-sm mb-1">Sin certificados aún</p>
                  <p className="text-gray-500 text-xs mb-4">
                    Completa un curso para obtener tu certificado
                  </p>
                  <Button
                    onClick={() => router.push("/home")}
                    size="sm"
                    className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium"
                  >
                    Explorar Cursos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedCourses.map((course) => (
                  <Card
                    key={course.enrollment.cursoId}
                    className="bg-gray-800/50 border-gray-700/50 overflow-hidden"
                  >
                    <CardContent className="p-0">
                      {/* Course Header */}
                      <div className="flex gap-3 p-3">
                        {/* Thumbnail */}
                        {course.enrollment.curso.portada ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-700">
                            <img
                              src={course.enrollment.curso.portada}
                              alt={course.enrollment.curso.titulo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-gray-500" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white leading-tight line-clamp-2">
                            {course.enrollment.curso.titulo}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5 text-[#DDA92C]" />
                              <span className="text-xs text-gray-300 font-medium">
                                {course.examStatus.puntaje || "100"}%
                              </span>
                            </div>
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-xs py-0 px-1.5">
                              Aprobado
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-gray-700/30 px-3 py-2 flex gap-2">
                        <Button
                          onClick={() => handleDownloadCertificate(course)}
                          disabled={downloadingId === course.enrollment.cursoId}
                          size="sm"
                          className="flex-1 bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium h-9"
                        >
                          {downloadingId === course.enrollment.cursoId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1.5" />
                              Certificado
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => router.push(`/course/${course.enrollment.cursoId}`)}
                          variant="outline"
                          size="sm"
                          className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 bg-transparent h-9"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="pt-4 pb-4">
            <Button
              onClick={() => router.push("/home")}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-12"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Todos los Cursos
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
