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
import { useBrand } from "@/lib/use-brand"
import {
  User,
  MapPin,
  Award,
  BookOpen,
  Clock,
  Loader2,
  Download,
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
  const brand = useBrand()
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalMinutes: 0,
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

      const totalMinutes = enrolledCourses.reduce(
        (acc, course) => acc + (course.curso?.duracionVideoMinutos || 0),
        0
      )

      setStats({
        totalCourses: enrolledCourses.length,
        completedCourses: completed.length,
        totalMinutes,
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
        brand,
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-accent" />
          <p className="text-gray-400 text-sm">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const fullName = `${user.nombre || ""} ${user.apellido_paterno || ""} ${user.apellido_materno || ""}`.trim()
  const empresaLabel = user.empresa === "gocash" ? "GoCash" : "Xpress"
  const initials = `${user.nombre?.charAt(0) || ""}${user.apellido_paterno?.charAt(0) || ""}`.toUpperCase()
  const studyTimeLabel = stats.totalMinutes >= 60
    ? `${Math.round(stats.totalMinutes / 60)}h`
    : `${stats.totalMinutes}m`

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ModernHeader />

      <main className="px-4 py-6 pb-10">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <section className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: brand.accent }}
              >
                <span className="text-2xl font-bold" style={{ color: brand.onAccent }}>
                  {initials}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge
                    variant="outline"
                    className="h-7 rounded-full px-3 text-xs font-medium"
                    style={{ borderColor: brand.accent, color: brand.accent }}
                  >
                    {empresaLabel}
                  </Badge>
                  <Badge className="h-7 rounded-full border-gray-600 bg-gray-700 px-3 text-xs font-medium text-gray-200">
                    {user.rol}
                  </Badge>
                </div>
                <h1 className="truncate text-2xl font-bold leading-8 text-white">{fullName}</h1>
                <p className="mt-1 text-sm text-gray-400">@{user.Usuario}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4 text-center">
              <BookOpen className="mx-auto mb-2 h-5 w-5 text-primary-accent" />
              <div className="text-2xl font-bold leading-8 text-white">{stats.totalCourses}</div>
              <div className="text-xs text-gray-400">Cursos</div>
            </div>
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4 text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-primary-accent" />
              <div className="text-2xl font-bold leading-8 text-white">{studyTimeLabel}</div>
              <div className="text-xs text-gray-400">Estudio</div>
            </div>
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4 text-center">
              <Award className="mx-auto mb-2 h-5 w-5 text-primary-accent" />
              <div className="text-2xl font-bold leading-8 text-white">{stats.completedCourses}</div>
              <div className="text-xs text-gray-400">Certificados</div>
            </div>
          </section>

          <Card className="overflow-hidden rounded-2xl border-gray-700 bg-gray-800">
            <CardContent className="p-0">
              <div className="border-b border-gray-700 px-5 py-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-accent" />
                  <h2 className="text-base font-semibold text-white">Datos del perfil</h2>
                </div>
              </div>

              <div className="divide-y divide-gray-700">
                <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-white">{fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ID usuario</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-white">{user.UsuarioID}</p>
                  </div>
                </div>

                <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Empresa</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-white">{empresaLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gerencia</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-white">{user.Gerencia || "Sin dato"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Agencia</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-white">{user.Agencia || "Sin dato"}</p>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary-accent" />
                    <p className="text-sm font-semibold text-gray-200">Sucursales</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(user.sucursales || []).map((sucursal) => (
                      <Badge
                        key={sucursal}
                        variant="outline"
                        className="h-7 rounded-full border-gray-600 bg-gray-700 px-3 text-xs text-gray-200"
                      >
                        {sucursal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary-accent" />
                <h2 className="text-lg font-semibold text-white">Mis certificados</h2>
              </div>
              <Badge className="h-7 rounded-full border-gray-700 bg-gray-800 px-3 text-xs text-gray-300">
                {completedCourses.length}
              </Badge>
            </div>

            {loadingCourses ? (
              <Card className="rounded-2xl border-gray-700 bg-gray-800">
                <CardContent className="flex items-center justify-center py-10">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-accent" />
                  <span className="text-sm text-gray-400">Cargando certificados...</span>
                </CardContent>
              </Card>
            ) : completedCourses.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-gray-700 bg-gray-800/60">
                <CardContent className="px-6 py-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-700">
                    <GraduationCap className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-200">Aún no tienes certificados disponibles</p>
                  <p className="mx-auto mt-2 max-w-[320px] text-sm leading-6 text-gray-400">
                    Cuando apruebes un examen, el certificado aparecerá aquí para descargarlo de nuevo.
                  </p>
                  <Button
                    onClick={() => router.push("/home")}
                    className="mt-5 h-12 rounded-xl px-5 font-semibold"
                    style={{ backgroundColor: brand.accent, color: brand.onAccent }}
                  >
                    Ver cursos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedCourses.map((course) => {
                  const score = course.examStatus.puntaje
                    ? `${Math.round(parseFloat(course.examStatus.puntaje))}%`
                    : "Aprobado"

                  return (
                    <Card
                      key={course.enrollment.cursoId}
                      className="overflow-hidden rounded-2xl border-gray-700 bg-gray-800"
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {course.enrollment.curso.portada ? (
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-700">
                              <img
                                src={course.enrollment.curso.portada}
                                alt={course.enrollment.curso.titulo}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-700">
                              <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-white">
                              {course.enrollment.curso.titulo}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge className="h-7 rounded-full bg-primary-accent/15 px-3 text-xs font-semibold text-primary-accent">
                                {score}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {course.examStatus.fechaAprobacion
                                  ? new Date(course.examStatus.fechaAprobacion).toLocaleDateString("es-ES")
                                  : "Certificado disponible"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                          <Button
                            onClick={() => handleDownloadCertificate(course)}
                            disabled={downloadingId === course.enrollment.cursoId}
                            className="h-12 rounded-xl font-semibold"
                            style={{ backgroundColor: brand.accent, color: brand.onAccent }}
                          >
                            {downloadingId === course.enrollment.cursoId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar certificado
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => router.push(`/course/${course.enrollment.cursoId}`)}
                            variant="outline"
                            className="h-12 w-12 rounded-xl border-gray-600 bg-transparent p-0 text-gray-300 hover:bg-gray-700"
                            aria-label="Ver curso"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          <Button
            onClick={() => router.push("/home")}
            variant="outline"
            className="h-12 w-full rounded-xl border-gray-700 bg-transparent font-semibold text-gray-300 hover:bg-gray-800"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Ver cursos
          </Button>
        </div>
      </main>
    </div>
  )
}
