import { getBrandByEmpresa, type BrandConfig } from "@/lib/brand-config"

interface CertificateProps {
  recipientName: string
  courseName: string
  completionDate: string
  coordinatorName: string
  coordinatorTitle?: string
  certificateType?: string
  certificateId?: string
  verificationUrl?: string
  score?: string | number
  brand?: BrandConfig
}
  
export default function CertificateTemplate({
  recipientName,
  courseName,
  completionDate,
  coordinatorName,
  coordinatorTitle = "Coordinador",
  certificateType = "CERTIFICADO DE RECONOCIMIENTO",
  certificateId,
  verificationUrl,
  score,
  brand = getBrandByEmpresa(),
}: CertificateProps) {
  const secondaryAccent = brand.accentScale[8] || brand.accentHover
  const [firstWord, ...rest] = certificateType.split(" ")
  const secondLine = rest.join(" ") || "DE RECONOCIMIENTO"
  const showQR = Boolean(verificationUrl)
  const numericScore = typeof score === "number" ? score : Number(score)
  const scoreLabel = Number.isFinite(numericScore) ? `${Math.round(numericScore)}%` : null
  const useDarkLogoSurface = brand.key === "gocash"
    return (
      <div
        className="relative w-full h-full bg-white overflow-hidden"
        style={{ aspectRatio: "297/210" }}
      >
        {/* Brand border */}
        <div
          className="absolute inset-0 p-8"
          style={{ background: `linear-gradient(135deg, ${brand.accent}, ${secondaryAccent})` }}
        >
          <div className="w-full h-full bg-white rounded-3xl relative overflow-hidden">
            {/* Decorative geometric elements - Top Left */}
            <div className="absolute -top-16 -left-16 w-64 h-64">
              <div className="relative w-full h-full">
                {/* Gold squares */}
                <div className="absolute top-8 left-8 w-24 h-24 transform rotate-45" style={{ backgroundColor: brand.accent }}></div>
                <div className="absolute top-16 left-24 w-16 h-16 transform rotate-45" style={{ backgroundColor: secondaryAccent }}></div>
  
                {/* Dark squares */}
                <div className="absolute top-24 left-16 w-20 h-20 bg-gray-800 transform rotate-45"></div>
                <div className="absolute top-12 left-32 w-12 h-12 bg-gray-700 transform rotate-45"></div>
  
                {/* Accent squares */}
                <div className="absolute top-32 left-8 w-16 h-16 bg-gray-900 transform rotate-45"></div>
                <div className="absolute top-4 left-16 w-12 h-12 bg-gray-600 transform rotate-45"></div>
  
                {/* White accents */}
                <div className="absolute top-20 left-4 w-8 h-8 bg-white transform rotate-45 border-2 border-gray-200"></div>
                <div className="absolute top-28 left-28 w-8 h-8 bg-white transform rotate-45 border-2 border-gray-200"></div>
              </div>
            </div>
  
            {/* Decorative geometric elements - Bottom Right */}
            <div className="absolute -bottom-16 -right-16 w-64 h-64">
              <div className="relative w-full h-full">
                {/* Gold squares */}
                <div className="absolute bottom-8 right-8 w-24 h-24 transform rotate-45" style={{ backgroundColor: brand.accent }}></div>
                <div className="absolute bottom-16 right-24 w-16 h-16 transform rotate-45" style={{ backgroundColor: secondaryAccent }}></div>
  
                {/* Dark squares */}
                <div className="absolute bottom-24 right-16 w-20 h-20 bg-gray-800 transform rotate-45"></div>
                <div className="absolute bottom-12 right-32 w-12 h-12 bg-gray-700 transform rotate-45"></div>
  
                {/* Accent squares */}
                <div className="absolute bottom-32 right-8 w-16 h-16 bg-gray-900 transform rotate-45"></div>
                <div className="absolute bottom-4 right-16 w-12 h-12 bg-gray-600 transform rotate-45"></div>
  
                {/* White accents */}
                <div className="absolute bottom-20 right-4 w-8 h-8 bg-white transform rotate-45 border-2 border-gray-200"></div>
                <div className="absolute bottom-28 right-28 w-8 h-8 bg-white transform rotate-45 border-2 border-gray-200"></div>
              </div>
            </div>
  
            {/* Logo - Top Right */}
            <div className="absolute top-16 right-20 z-20">
              {useDarkLogoSurface ? (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "360px",
                    height: "200px",
                    padding: "40px",
                    borderRadius: "44px",
                    backgroundColor: brand.primary,
                    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.16)",
                  }}
                >
                  <img
                    src={brand.logo}
                    alt={`Logo ${brand.name}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <img
                  src={brand.logo}
                  alt={`Logo ${brand.name}`}
                  className="w-44 h-56 opacity-90"
                  style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
                />
              )}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-32 text-center">
              {/* Certificate title */}
              <div className="mb-20">
                <h1 className="text-9xl font-extrabold mb-6 tracking-wider">
                  <span className="text-gray-900" style={{ fontSize: "120px" }}>{firstWord || "CERTIFICADO"}</span>
                </h1>
                <h2 className="text-8xl font-extrabold tracking-wider" style={{ fontSize: "100px", color: brand.accent }}>{secondLine}</h2>
              </div>
  
              {/* Awarded to */}
              <div className="mb-20">
                <p className="text-5xl text-gray-800 font-medium mb-8" style={{ fontSize: "60px" }}>Otorgado a</p>
  
                {/* Recipient name with decorative line */}
                <div className="relative">
                  <h3 className="font-serif italic text-gray-900 mb-6 px-16" style={{ fontSize: "90px" }}>{recipientName}</h3>
                  <div className="w-full max-w-5xl mx-auto h-3" style={{ backgroundColor: brand.accent }}></div>
                </div>
              </div>
  
              {/* Course description */}
              <div className="mb-20 max-w-7xl px-12">
                <p className="text-gray-800 leading-relaxed" style={{ fontSize: "50px" }}>
                  Por haber completado satisfactoriamente el curso
                </p>
                <p className="font-bold text-gray-900 mt-6" style={{ fontSize: "70px" }}>{courseName}</p>
                {scoreLabel && (
                  <p className="font-semibold mt-8" style={{ fontSize: "46px", color: brand.primary }}>
                    Aprobado con calificación de {scoreLabel}
                  </p>
                )}
              </div>
  
              {/* Date */}
              <div className="mb-24">
                <p className="text-gray-700 font-semibold" style={{ fontSize: "45px" }}>{completionDate}</p>
              </div>

              {/* Footer: QR and metadata centered */}
              {showQR && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                      verificationUrl as string
                    )}`}
                    alt="QR de verificación"
                    className="w-56 h-56 bg-white p-3 rounded-xl shadow-xl border-2 border-gray-400"
                  />
                  {certificateId && (
                    <span className="mt-5 text-2xl text-gray-700 font-semibold">ID: {certificateId}</span>
                  )}
                  <span className="mt-2 text-xl text-gray-600">Escanea para verificar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
