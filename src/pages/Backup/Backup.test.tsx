import { ToastProvider } from '@components/common/Toast'
import { render, waitFor } from '@testing-library/react'
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

  it('restores only Pettography-owned localStorage keys from an imported backup', async () => {
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

    await waitFor(() => {
      expect(localStorage.getItem('pettography.diary')).toBe('restored-diary')
    })
    expect(localStorage.getItem('onboarding-store')).toBe('restored-onboarding')
    expect(localStorage.getItem('token')).toBe('existing-auth-token')
    expect(localStorage.getItem('other-app.setting')).toBeNull()
  })
})
