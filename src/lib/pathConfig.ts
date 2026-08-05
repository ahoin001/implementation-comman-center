import type {
  DataAssetKey,
  ImageAssetsStatus,
  PathConfig,
  Project,
} from '@/types'
import { DATA_ASSET_KEYS, DATA_IMPORT_INVENTORY_KEYS } from '@/types'

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

  return {
    ssoEnabled: overrides.ssoEnabled ?? true,
    imageAssets: overrides.imageAssets ?? 'pending',
    hasResumeData,
    dataAssets: { ...dataAssets, resumes: hasResumeData },
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
