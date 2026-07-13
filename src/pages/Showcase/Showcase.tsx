import {
  CONTEST_THEMES,
  showcaseFormSchema,
  useShowcaseStore,
  type ShowcaseFormValues,
  type ShowcaseThemeId,
} from '@domains/showcase'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Showcase.module.css'

type Filter = ShowcaseThemeId | 'all'
const COPY = {
  ko: {
    title: '로컬 사진 보드',
    subtitle: '우리 아이 사진과 사육장 아이디어를 이 브라우저 안에서만 모아보세요.',
    localTitle: '공개 업로드가 아닙니다',
    local: '사진 주소와 메모는 다른 사용자에게 보이지 않으며 이 브라우저에만 저장됩니다.',
    privacyTitle: '외부 이미지 주소에 관한 안내',
    privacy:
      'HTTPS 이미지 주소를 열 때 해당 이미지 서버에 접속 정보가 전달될 수 있습니다. 개인정보가 포함된 비공개 링크는 사용하지 마세요.',
    addTitle: '사진 카드 추가',
    nickname: '구분용 이름',
    image: 'HTTPS 이미지 주소',
    caption: '메모',
    category: '분류',
    add: '보드에 추가',
    all: '전체',
    empty: '아직 저장한 사진 카드가 없습니다.',
    delete: '삭제',
    deleteConfirm: '이 사진 카드를 삭제할까요?',
    broken: '이미지를 불러오지 못했습니다. 주소와 공개 범위를 확인하세요.',
    required: '입력값을 확인해주세요.',
    themes: {
      freestyle: '자유 기록',
      postShed: '탈피 기록',
      enclosureFull: '사육장 전경',
      feedingReaction: '급여 순간',
      baby: '성장 기록',
    },
  },
  en: {
    title: 'Local photo board',
    subtitle: 'Collect pet photos and enclosure ideas only in this browser.',
    localTitle: 'This is not a public upload',
    local: 'Photo URLs and notes are visible only in this browser, not to other users.',
    privacyTitle: 'About external image URLs',
    privacy:
      'Loading an HTTPS image can share connection information with its host. Do not use private links containing personal data.',
    addTitle: 'Add a photo card',
    nickname: 'Reference name',
    image: 'HTTPS image URL',
    caption: 'Note',
    category: 'Category',
    add: 'Add to board',
    all: 'All',
    empty: 'No saved photo cards yet.',
    delete: 'Delete',
    deleteConfirm: 'Delete this photo card?',
    broken: 'The image could not be loaded. Check its URL and visibility.',
    required: 'Check this value.',
    themes: {
      freestyle: 'Free note',
      postShed: 'Shed log',
      enclosureFull: 'Enclosure view',
      feedingReaction: 'Feeding moment',
      baby: 'Growth log',
    },
  },
  ja: {
    title: 'ローカル写真ボード',
    subtitle: 'ペットの写真と飼育環境のアイデアをこのブラウザ内だけにまとめます。',
    localTitle: '公開アップロードではありません',
    local: '写真URLとメモは他のユーザーには表示されず、このブラウザにのみ保存されます。',
    privacyTitle: '外部画像URLについて',
    privacy:
      'HTTPS画像を読み込む際、接続情報が画像サーバーに伝わる場合があります。個人情報を含む非公開リンクは使わないでください。',
    addTitle: '写真カードを追加',
    nickname: '識別用の名前',
    image: 'HTTPS画像URL',
    caption: 'メモ',
    category: '分類',
    add: 'ボードに追加',
    all: 'すべて',
    empty: '保存した写真カードはまだありません。',
    delete: '削除',
    deleteConfirm: 'この写真カードを削除しますか？',
    broken: '画像を読み込めません。URLと公開範囲を確認してください。',
    required: '入力内容を確認してください。',
    themes: {
      freestyle: '自由記録',
      postShed: '脱皮記録',
      enclosureFull: '飼育環境全景',
      feedingReaction: '給餌の瞬間',
      baby: '成長記録',
    },
  },
} as const

function Showcase() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] as keyof typeof COPY
  const copy = COPY[language] ?? COPY.ko
  const locale = language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'ko-KR'
  useDocumentTitle(copy.title)
  const posts = useShowcaseStore((state) => state.posts)
  const ownIds = useShowcaseStore((state) => state.ownIds)
  const lastAuthor = useShowcaseStore((state) => state.lastAuthor)
  const addPost = useShowcaseStore((state) => state.addPost)
  const removePost = useShowcaseStore((state) => state.removePost)
  const [filter, setFilter] = useState<Filter>('all')
  const form = useForm<ShowcaseFormValues>({
    resolver: zodResolver(showcaseFormSchema),
    defaultValues: { author: lastAuthor, imageUrl: '', caption: '', themeId: 'freestyle' },
  })
  const localPosts = useMemo(
    () =>
      posts
        .filter((post) => ownIds[post.id])
        .filter((post) => filter === 'all' || post.themeId === filter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filter, ownIds, posts]
  )
  const submit = form.handleSubmit((values) => {
    addPost(values)
    form.reset({ author: values.author, imageUrl: '', caption: '', themeId: values.themeId })
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>PRIVATE COLLECTION</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </header>
      <div className={styles.notices}>
        <aside>
          <strong>{copy.localTitle}</strong>
          <p>{copy.local}</p>
        </aside>
        <aside>
          <strong>{copy.privacyTitle}</strong>
          <p>{copy.privacy}</p>
        </aside>
      </div>
      <form className={styles.composer} onSubmit={submit} noValidate>
        <h2>{copy.addTitle}</h2>
        <div className={styles.formGrid}>
          <label>
            <span>{copy.nickname}</span>
            <input maxLength={40} autoComplete="nickname" {...form.register('author')} />
            {form.formState.errors.author ? <small>{copy.required}</small> : null}
          </label>
          <label>
            <span>{copy.category}</span>
            <select {...form.register('themeId')}>
              {CONTEST_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {copy.themes[theme.id]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wide}>
            <span>{copy.image}</span>
            <input
              type="url"
              inputMode="url"
              maxLength={500}
              placeholder="https://example.com/photo.jpg"
              {...form.register('imageUrl')}
            />
            {form.formState.errors.imageUrl ? <small>{copy.required}</small> : null}
          </label>
          <label className={styles.wide}>
            <span>{copy.caption}</span>
            <textarea rows={3} maxLength={200} {...form.register('caption')} />
            {form.formState.errors.caption ? <small>{copy.required}</small> : null}
          </label>
        </div>
        <button type="submit" className={styles.primary}>
          {copy.add}
        </button>
      </form>
      <div className={styles.filters} aria-label={copy.category}>
        <button
          type="button"
          aria-pressed={filter === 'all'}
          className={filter === 'all' ? styles.active : undefined}
          onClick={() => setFilter('all')}
        >
          {copy.all}
        </button>
        {CONTEST_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-pressed={filter === theme.id}
            className={filter === theme.id ? styles.active : undefined}
            onClick={() => setFilter(theme.id)}
          >
            {theme.emoji} {copy.themes[theme.id]}
          </button>
        ))}
      </div>
      {localPosts.length === 0 ? (
        <div className={styles.empty}>{copy.empty}</div>
      ) : (
        <ul className={styles.grid}>
          {localPosts.map((post) => (
            <li key={post.id} className={styles.card}>
              <SafePhoto
                src={post.imageUrl}
                alt={post.caption || copy.themes[post.themeId]}
                fallback={copy.broken}
              />
              <div className={styles.cardBody}>
                <span className={styles.theme}>{copy.themes[post.themeId]}</span>
                {post.caption ? <p>{post.caption}</p> : null}
                <div className={styles.meta}>
                  <span>{post.author}</span>
                  <time dateTime={post.createdAt}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                      new Date(post.createdAt)
                    )}
                  </time>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(copy.deleteConfirm)) removePost(post.id)
                  }}
                >
                  {copy.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SafePhoto({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <div className={styles.imageFallback}>{fallback}</div>
  ) : (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

export default Showcase
