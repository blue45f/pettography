/**
 * socket.io-client 스텁 — @heejun/deskcloud 의 *선택적* peer placeholder.
 * ──────────────────────────────────────────────────────────────────────────
 * 이 앱은 SDK 의 realtime/chat 클라이언트(socket 기반)를 쓰지 않는다. SDK 는
 * socket.io-client 를 동적 import 로만 참조하므로 실제로 로드되지 않지만, Vite
 * dev dep-optimizer 가 그 동적 import 의 bare specifier 를 해석하려다 실패한다
 * (미설치 optional peer). vite.config 의 resolve.alias 로 이 스텁을 가리켜 dev
 * 해석을 통과시킨다. 실행되면(즉, 누군가 chat/realtime connect 를 호출하면)
 * 명확히 실패시켜, 의도치 않은 socket 사용을 드러낸다.
 *
 * 프로덕션 Rollup 빌드는 미사용 클라이언트를 트리셰이크하므로 이 스텁조차 번들에
 * 포함되지 않는다.
 */
export function io(): never {
  throw new Error(
    '[pettography] socket.io-client is not installed. This app does not use DeskCloud realtime/chat. ' +
      'Install socket.io-client and remove the alias in vite.config.ts to enable them.'
  )
}

export default { io }
