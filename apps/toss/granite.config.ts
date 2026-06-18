import { defineConfig } from '@apps-in-toss/web-framework/config'

// 희귀 반려동물 종 정보·케어 가이드. 비게임=partner. 의료(병원 예약/추천)는 제외.
export default defineConfig({
  appName: 'pettography',
  brand: { displayName: '페토그래피', primaryColor: '#5FB37A', icon: '' },
  web: { host: 'localhost', port: 5188, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  outdir: 'dist',
  webViewProps: { type: 'partner' },
  navigationBar: { withBackButton: true, withHomeButton: true },
})
