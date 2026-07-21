import type {
  DataAssetKey,
  ImageAssetsStatus,
  PathConfig,
  Project,
} from '@/types'
import { DATA_ASSET_KEYS } from '@/types'

export function createDefaultPathConfig(overrides: Partial<PathConfig> = {}): PathConfig {
  const dataAssets = DATA_ASSET_KEYS.reduce(
    (acc, key) => {
      acc[key] = Boolean(overrides.dataAssets?.[key])
      return acc
    },
    {} as Record<DataAssetKey, boolean>
  )

  return {
    ssoEnabled: overrides.ssoEnabled ?? true,
    imageAssets: overrides.imageAssets ?? 'pending',
    dataAssets: { ...dataAssets, ...overrides.dataAssets },
  }
}

export function normalizePathConfig(raw?: Partial<PathConfig> | null): PathConfig {
  const imageAssets: ImageAssetsStatus =
    raw?.imageAssets === 'provided' || raw?.imageAssets === 'not_providing'
      ? raw.imageAssets
      : 'pending'

  return createDefaultPathConfig({
    ssoEnabled: raw?.ssoEnabled !== false,
    imageAssets,
    dataAssets: raw?.dataAssets,
  })
}

export function isSsoEnabled(project: Project): boolean {
  return project.pathConfig?.ssoEnabled !== false
}

/** SSO credentials required only when SSO is enabled for this association */
export function needsSsoCredentials(project: Project): boolean {
  if (!isSsoEnabled(project)) return false
  if (project.archived) return false
  return !project.deliverables?.sso_test_credentials?.received
}

export function getDataAssetsReceived(project: Project): DataAssetKey[] {
  return DATA_ASSET_KEYS.filter((key) => Boolean(project.pathConfig?.dataAssets?.[key]))
}

export function getImageAssetsLabel(status: ImageAssetsStatus): string {
  if (status === 'provided') return 'Images provided'
  if (status === 'not_providing') return 'No images'
  return 'Images pending'
}
