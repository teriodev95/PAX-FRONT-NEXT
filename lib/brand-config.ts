export type EmpresaKey = "xpress" | "gocash"

export interface BrandConfig {
  key: EmpresaKey
  name: string
  logo: string
  primary: string
  primaryDark: string
  accent: string
  accentHover: string
  onAccent: string
  accentScale: string[]
}

export const sharedBrandColors = {
  success: "#5FCE2F",
  complete: "#046C4E",
  error: "#E91741",
  warning: "#F48225",
  background: "#EFF1F5",
  border: "#D8D8D8",
  label: "#B5C2C9",
  white: "#FFFFFF",
  mutedBlue: "#696974",
}

export const brandConfigs: Record<EmpresaKey, BrandConfig> = {
  xpress: {
    key: "xpress",
    name: "Xpress",
    logo: "/dep_logo.svg",
    primary: "#09354C",
    primaryDark: "#09354C",
    accent: "#D6B557",
    accentHover: "#C8A446",
    onAccent: "#111827",
    accentScale: [
      "#FBF8EE",
      "#F7F0DD",
      "#F3E9CD",
      "#EFE1BC",
      "#EBDAAB",
      "#E6D39A",
      "#E2CB89",
      "#DEC479",
      "#DABC68",
      "#D6B557",
    ],
  },
  gocash: {
    key: "gocash",
    name: "GoCash",
    logo: "/gocash_logo.svg",
    primary: "#001491",
    primaryDark: "#001491",
    accent: "#13D5FF",
    accentHover: "#2DD0FF",
    onAccent: "#00132B",
    accentScale: [
      "#E8FBFF",
      "#D1F6FF",
      "#BAF2FF",
      "#A3EDFF",
      "#8CE9FF",
      "#75E4FF",
      "#5EE0FF",
      "#47DBFF",
      "#2DD0FF",
      "#13D5FF",
    ],
  },
}

export const normalizeEmpresaKey = (empresa?: string | null): EmpresaKey => {
  return empresa?.toLowerCase() === "gocash" ? "gocash" : "xpress"
}

export const getBrandByEmpresa = (empresa?: string | null): BrandConfig => {
  return brandConfigs[normalizeEmpresaKey(empresa)]
}

export const applyBrandToDocument = (brand: BrandConfig) => {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.style.setProperty("--brand-primary", brand.primary)
  root.style.setProperty("--brand-primary-dark", brand.primaryDark)
  root.style.setProperty("--brand-accent", brand.accent)
  root.style.setProperty("--brand-accent-hover", brand.accentHover)
  root.style.setProperty("--brand-on-accent", brand.onAccent)
}
