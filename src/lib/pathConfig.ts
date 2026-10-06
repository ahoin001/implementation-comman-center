import type {
  DataAssetKey,
  ImageAssetsStatus,
  PathConfig,
  Project,
} from '@/types'
import { DATA_ASSET_KEYS, DATA_IMPORT_INVENTORY_KEYS } from '@/types'

/** Host label from a project abbreviation. AAFS becomes aafs. */
export function abbreviationHost(abbreviation: string) {
  return abbreviation.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
}

/** Public page on the client's career center, so they can see where an image lands. */
export function sitePreviewUrl(abbreviation: string, path = '/') {
  const host = abbreviationHost(abbreviation)
  if (!host) return ''
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `https://${host}.webscribble.com${suffix}`
}

export function defaultSecureUploadUrl(abbreviation: string) {
  const host = abbreviationHost(abbreviation)
  if (!host) return ''
  return `https://${host}.webscribble.com/smartway/file-manager`
}

/** A stored override, or null when it is blank or not an https address. */
export function cleanSecureUploadUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return null
    return trimmed
  } catch {
    return null
  }
}

export function resolveSecureUploadUrl(abbreviation: string, override?: string | null) {
  return cleanSecureUploadUrl(override) || defaultSecureUploadUrl(abbreviation)
}

export function createDefaultPathConfig(overrides: Partial<PathConfig> = {}): PathConfig {
  const hasResumeData =
    overrides.hasResumeData !== undefined
      ? Boolean(overrides.hasResumeData)
      : Boolean(overrides.dataAssets?.resumes)

  const dataAssets = DATA_ASSET_KEYS.reduce(
    (acc, key) => {
      acc[key] = Boolean(overrides.dataAssets?.[key])
      return acc
    },
    {} as Record<DataAssetKey, boolean>
  )
  dataAssets.resumes = hasResumeData
  const secureUploadUrl = cleanSecureUploadUrl(overrides.secureUploadUrl)

  return {
    ssoEnabled: overrides.ssoEnabled ?? true,
    imageAssets: overrides.imageAssets ?? 'pending',
    hasResumeData,
    weHandleSales: overrides.weHandleSales ?? false,
    dataAssets: { ...dataAssets, resumes: hasResumeData },
    ...(secureUploadUrl ? { secureUploadUrl } : {}),
  }
}

export function normalizePathConfig(raw?: Partial<PathConfig> | null): PathConfig {
  const imageAssets: ImageAssetsStatus =
    raw?.imageAssets === 'provided' || raw?.imageAssets === 'not_providing'
      ? raw.imageAssets
      : 'pending'

  // Prefer explicit flag; fall back to legacy inventory checkbox so older rows upgrade cleanly
  const hasResumeData =
    raw?.hasResumeData !== undefined
      ? Boolean(raw.hasResumeData)
      : Boolean(raw?.dataAssets?.resumes)

  return createDefaultPathConfig({
    ssoEnabled: raw?.ssoEnabled !== false,
    imageAssets,
    hasResumeData,
    weHandleSales: Boolean(raw?.weHandleSales),
    secureUploadUrl: raw?.secureUploadUrl,
    dataAssets: raw?.dataAssets,
  })
}

export function isSsoEnabled(project: Project): boolean {
  return project.pathConfig?.ssoEnabled !== false
}

export function hasResumeData(project: Project): boolean {
  return (
    project.pathConfig?.hasResumeData === true ||
    Boolean(project.pathConfig?.dataAssets?.resumes)
  )
}

export function weHandleSales(project: Project): boolean {
  return project.pathConfig?.weHandleSales === true
}

/** SSO credentials required only when SSO is enabled for this association */
export function needsSsoCredentials(project: Project): boolean {
  if (!isSsoEnabled(project)) return false
  if (project.archived) return false
  return !project.deliverables?.sso_test_credentials?.received
}

/** Inventory rows only (resumes excluded — use hasResumeData) */
export function getInventoryAssetsReceived(project: Project): DataAssetKey[] {
  return DATA_IMPORT_INVENTORY_KEYS.filter((key) =>
    Boolean(project.pathConfig?.dataAssets?.[key])
  )
}

/** All data types currently marked on, including resumes via site setting */
export function getDataAssetsReceived(project: Project): DataAssetKey[] {
  return DATA_ASSET_KEYS.filter((key) => {
    if (key === 'resumes') return hasResumeData(project)
    return Boolean(project.pathConfig?.dataAssets?.[key])
  })
}

export function getImageAssetsLabel(status: ImageAssetsStatus): string {
  if (status === 'provided') return 'Images provided'
  if (status === 'not_providing') return 'No images'
  return 'Images pending'
}

export function getResumeDataLabel(on: boolean): string {
  return on ? 'Resumes on site' : 'No resumes on site'
}
