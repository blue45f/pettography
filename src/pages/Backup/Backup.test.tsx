import { ToastProvider } from '@components/common/Toast'
import { render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import Backup from './Backup'

function renderBackup() {
  return render(
    <ToastProvider>
      <Backup />
    </ToastProvider>,
  )
}

describe('Backup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('previews an import and only applies Pettography-owned keys after confirmation', async () => {
    const user = userEvent.setup()
    localStorage.setItem('pettography.diary', 'old-diary')
    localStorage.setItem('token', 'existing-auth-token')

    const { container } = renderBackup()
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(fileInput).toBeTruthy()

    const backupFile = new File(
      [
        JSON.stringify({
          app: 'pettography',
          version: 1,
          exportedAt: new Date().toISOString(),
          data: {
            'pettography.diary': 'restored-diary',
            'onboarding-store': 'restored-onboarding',
            token: 'malicious-token',
            'other-app.setting': 'should-not-import',
          },
        }),
      ],
      'pettography-backup.json',
      { type: 'application/json' },
    )

    await user.upload(fileInput as HTMLInputElement, backupFile)

    // Selecting a file shows a confirmation preview and must not touch storage yet.
    const dialog = await waitFor(() => {
      const el = container.querySelector<HTMLElement>('[role="alertdialog"]')
      if (!el) throw new Error('preview not shown')
      return el
    })
    expect(localStorage.getItem('pettography.diary')).toBe('old-diary')

    // The first action button in the panel restores; the second cancels.
    const restoreButton = within(dialog).getAllByRole('button')[0]
    await user.click(restoreButton)

    await waitFor(() => {
      expect(localStorage.getItem('pettography.diary')).toBe('restored-diary')
    })
    expect(localStorage.getItem('onboarding-store')).toBe('restored-onboarding')
    expect(localStorage.getItem('token')).toBe('existing-auth-token')
    expect(localStorage.getItem('other-app.setting')).toBeNull()
  })

  it('cancels a previewed import without mutating storage', async () => {
    const user = userEvent.setup()
    localStorage.setItem('pettography.diary', 'old-diary')

    const { container } = renderBackup()
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')

    const backupFile = new File(
      [
        JSON.stringify({
          app: 'pettography',
          version: 1,
          exportedAt: new Date().toISOString(),
          data: { 'pettography.diary': 'restored-diary' },
        }),
      ],
      'pettography-backup.json',
      { type: 'application/json' },
    )

    await user.upload(fileInput as HTMLInputElement, backupFile)

    const dialog = await waitFor(() => {
      const el = container.querySelector<HTMLElement>('[role="alertdialog"]')
      if (!el) throw new Error('preview not shown')
      return el
    })

    // Second button cancels; storage stays untouched and the panel closes.
    const cancelButton = within(dialog).getAllByRole('button')[1]
    await user.click(cancelButton)

    await waitFor(() => {
      expect(container.querySelector('[role="alertdialog"]')).toBeNull()
    })
    expect(localStorage.getItem('pettography.diary')).toBe('old-diary')
  })
})
