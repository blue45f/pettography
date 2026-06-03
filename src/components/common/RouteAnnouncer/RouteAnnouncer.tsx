import useRouteAnnouncer from '@hooks/useRouteAnnouncer'

/**
 * RouteAnnouncer — SPA 라우트 전환을 스크린리더에 알리고 포커스를 본문으로 이동시킨다.
 *
 * 클라이언트 사이드 네비게이션은 전체 페이지 리로드가 없어 보조기술 사용자가
 * "페이지가 바뀌었다"는 사실을 인지하지 못한다. 이 컴포넌트는 시각적으로 숨겨진
 * aria-live 영역에 새 페이지 제목을 announce 하고, 동시에 본문(main) 포커스를
 * 재설정해 키보드/스크린리더 사용자가 새 콘텐츠 흐름의 처음으로 이동하도록 한다.
 *
 * 시각적 출력이 없으므로 기존 화면 레이아웃에는 영향을 주지 않는다.
 */
function RouteAnnouncer() {
  const message = useRouteAnnouncer()

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  )
}

export default RouteAnnouncer
