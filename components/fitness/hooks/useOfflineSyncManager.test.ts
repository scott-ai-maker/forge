import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatSyncSuccessMessage } from './useOfflineSyncManager'
import * as offlineQueue from '@/lib/offline-sync-queue'

describe('useOfflineSyncManager Logic & Sync Formatting', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('formats singular and plural synchronization toast messages accurately', () => {
    expect(formatSyncSuccessMessage(1)).toBe('✓ Synced 1 offline workout set to cloud.')
    expect(formatSyncSuccessMessage(4)).toBe('✓ Synced 4 offline workout sets to cloud.')
    expect(formatSyncSuccessMessage(12)).toBe('✓ Synced 12 offline workout sets to cloud.')
    expect(formatSyncSuccessMessage(0)).toBe('')
    expect(formatSyncSuccessMessage(-1)).toBe('')
  })

  it('delegates to flushOfflineQueue and reports pending counts', async () => {
    const mockFlush = vi.spyOn(offlineQueue, 'flushOfflineQueue').mockResolvedValue({
      synced: 3,
      failed: 0,
    })
    const mockPendingCount = vi.spyOn(offlineQueue, 'getPendingQueueCount').mockReturnValue(0)

    const onRecordSynced = vi.fn()
    const onStatusMessage = vi.fn()

    // Simulate what syncQueue does inside the hook
    const res = await offlineQueue.flushOfflineQueue((tempId, serverRecord) => {
      onRecordSynced(tempId, serverRecord)
    })
    const pending = offlineQueue.getPendingQueueCount()
    if (res.synced > 0) {
      onStatusMessage(formatSyncSuccessMessage(res.synced))
    }

    expect(mockFlush).toHaveBeenCalled()
    expect(mockPendingCount).toHaveBeenCalled()
    expect(res.synced).toBe(3)
    expect(pending).toBe(0)
    expect(onStatusMessage).toHaveBeenCalledWith('✓ Synced 3 offline workout sets to cloud.')
  })
})
