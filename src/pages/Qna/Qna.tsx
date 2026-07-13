import {
  QNA_AUTHOR_MAX,
  QNA_BODY_MAX,
  QNA_TITLE_MAX,
  answersFor,
  parseTags,
  qnaAnswerFormSchema,
  qnaQuestionFormSchema,
  useQnaStore,
  type QnaAnswerFormValues,
  type QnaQuestionFormInputValues,
  type QnaQuestionFormValues,
} from '@domains/qna'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import styles from './Qna.module.css'

const COPY = {
  ko: {
    title: '질문 노트',
    subtitle: '궁금한 점과 답변 후보를 이 브라우저 안에서 정리하세요.',
    localTitle: '공개 게시판이 아닙니다',
    local:
      '여기에 쓴 내용은 서버나 다른 사용자에게 전송되지 않습니다. 같은 브라우저의 로컬 저장소에만 남습니다.',
    medicalTitle: '건강 이상은 답변을 기다리지 마세요',
    medical:
      '호흡 곤란, 출혈, 경련, 의식 저하, 급격한 악화가 있으면 즉시 응급 안내와 진료 기관을 확인하세요.',
    sos: '응급 안내',
    hospitals: '병원 찾기',
    newQuestion: '새 질문 정리',
    nickname: '구분용 이름',
    nicknameHint: '실명 대신 알아보기 쉬운 별칭',
    questionTitle: '질문 제목',
    titleHint: '한 문장으로 핵심을 적어주세요',
    details: '상황과 관찰 내용',
    detailsHint: '언제 시작했는지, 환경 수치와 변화, 이미 해본 일을 적어주세요.',
    tags: '태그',
    tagsHint: '쉼표로 구분, 최대 5개',
    add: '질문 저장',
    search: '저장한 질문 검색',
    recent: '최근 순',
    unanswered: '답변 없는 질문',
    empty: '아직 저장한 질문이 없습니다.',
    answerCount: '{{count}}개 답변 후보',
    answer: '답변 후보 추가',
    answerHint: '출처와 불확실성을 함께 기록하면 나중에 판단하기 쉽습니다.',
    saveAnswer: '답변 저장',
    selected: '질문 작성자가 선택한 답변',
    select: '이 답변 선택',
    unselect: '선택 해제',
    delete: '삭제',
    deleteQuestion: '질문과 연결된 답변을 모두 삭제할까요?',
    deleteAnswer: '이 답변을 삭제할까요?',
    cancel: '닫기',
    required: '필수 항목을 확인해주세요.',
  },
  en: {
    title: 'Question notebook',
    subtitle: 'Organize questions and possible answers in this browser.',
    localTitle: 'This is not a public forum',
    local:
      'Nothing here is sent to a server or other users. It remains only in this browser’s local storage.',
    medicalTitle: 'Do not wait for an answer when health is deteriorating',
    medical:
      'For breathing difficulty, bleeding, seizures, reduced consciousness, or rapid decline, use emergency guidance and contact a clinic now.',
    sos: 'Emergency guide',
    hospitals: 'Find a clinic',
    newQuestion: 'Capture a new question',
    nickname: 'Reference name',
    nicknameHint: 'Use a recognizable nickname instead of a real name',
    questionTitle: 'Question title',
    titleHint: 'Summarize the issue in one sentence',
    details: 'Context and observations',
    detailsHint: 'Record when it started, environment readings, changes, and what you tried.',
    tags: 'Tags',
    tagsHint: 'Comma separated, up to five',
    add: 'Save question',
    search: 'Search saved questions',
    recent: 'Most recent',
    unanswered: 'Without answers',
    empty: 'No saved questions yet.',
    answerCount: '{{count}} possible answers',
    answer: 'Add a possible answer',
    answerHint: 'Record sources and uncertainty so you can judge it later.',
    saveAnswer: 'Save answer',
    selected: 'Selected by the question author',
    select: 'Select this answer',
    unselect: 'Clear selection',
    delete: 'Delete',
    deleteQuestion: 'Delete this question and all linked answers?',
    deleteAnswer: 'Delete this answer?',
    cancel: 'Close',
    required: 'Check the required fields.',
  },
  ja: {
    title: '質問ノート',
    subtitle: '疑問点と回答候補をこのブラウザ内で整理できます。',
    localTitle: '公開掲示板ではありません',
    local:
      '入力内容はサーバーや他のユーザーに送信されず、このブラウザのローカル保存領域にのみ残ります。',
    medicalTitle: '体調悪化時は回答を待たないでください',
    medical:
      '呼吸困難、出血、けいれん、意識低下、急激な悪化がある場合は、すぐに緊急案内と診療機関を確認してください。',
    sos: '緊急案内',
    hospitals: '病院を探す',
    newQuestion: '新しい質問を整理',
    nickname: '識別用の名前',
    nicknameHint: '実名ではなく分かりやすいニックネーム',
    questionTitle: '質問タイトル',
    titleHint: '要点を一文で記入',
    details: '状況と観察内容',
    detailsHint: '開始時期、環境数値、変化、試したことを記録してください。',
    tags: 'タグ',
    tagsHint: 'カンマ区切り、最大5件',
    add: '質問を保存',
    search: '保存した質問を検索',
    recent: '新しい順',
    unanswered: '回答なし',
    empty: '保存した質問はまだありません。',
    answerCount: '回答候補 {{count}}件',
    answer: '回答候補を追加',
    answerHint: '出典と不確実性も記録すると後から判断しやすくなります。',
    saveAnswer: '回答を保存',
    selected: '質問作成者が選択した回答',
    select: 'この回答を選択',
    unselect: '選択解除',
    delete: '削除',
    deleteQuestion: '質問と関連回答をすべて削除しますか？',
    deleteAnswer: 'この回答を削除しますか？',
    cancel: '閉じる',
    required: '必須項目を確認してください。',
  },
} as const

function Qna() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] as keyof typeof COPY
  const copy = COPY[language] ?? COPY.ko
  const locale = language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'ko-KR'
  useDocumentTitle(copy.title)

  const questions = useQnaStore((state) => state.questions)
  const answers = useQnaStore((state) => state.answers)
  const ownQ = useQnaStore((state) => state.ownQ)
  const ownA = useQnaStore((state) => state.ownA)
  const lastAuthor = useQnaStore((state) => state.lastAuthor)
  const addQuestion = useQnaStore((state) => state.addQuestion)
  const addAnswer = useQnaStore((state) => state.addAnswer)
  const removeQuestion = useQnaStore((state) => state.removeQuestion)
  const removeAnswer = useQnaStore((state) => state.removeAnswer)
  const acceptAnswer = useQnaStore((state) => state.acceptAnswer)
  const [query, setQuery] = useState('')
  const [onlyUnanswered, setOnlyUnanswered] = useState(false)
  const [answeringId, setAnsweringId] = useState<string | null>(null)

  const form = useForm<QnaQuestionFormInputValues, unknown, QnaQuestionFormValues>({
    resolver: zodResolver(qnaQuestionFormSchema),
    defaultValues: { author: lastAuthor, title: '', body: '', tags: '', speciesId: null },
  })
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return [...questions]
      .filter((question) => !onlyUnanswered || answersFor(answers, question.id).length === 0)
      .filter(
        (question) =>
          !needle ||
          `${question.title} ${question.body} ${question.tags.join(' ')}`
            .toLocaleLowerCase()
            .includes(needle)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [answers, onlyUnanswered, query, questions])

  const submitQuestion = form.handleSubmit((values) => {
    addQuestion({ ...values, tags: parseTags(values.tags), category: null })
    form.reset({ author: values.author, title: '', body: '', tags: '', speciesId: null })
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>PRIVATE WORKSPACE</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </header>
      <div className={styles.alerts}>
        <aside className={styles.localNotice}>
          <strong>{copy.localTitle}</strong>
          <p>{copy.local}</p>
        </aside>
        <aside className={styles.medicalNotice}>
          <strong>{copy.medicalTitle}</strong>
          <p>{copy.medical}</p>
          <div>
            <Link to="/sos">{copy.sos}</Link>
            <Link to="/hospitals">{copy.hospitals}</Link>
          </div>
        </aside>
      </div>

      <form className={styles.composer} onSubmit={submitQuestion} noValidate>
        <h2>{copy.newQuestion}</h2>
        <div className={styles.formGrid}>
          <label>
            <span>{copy.nickname}</span>
            <input
              maxLength={QNA_AUTHOR_MAX}
              placeholder={copy.nicknameHint}
              autoComplete="nickname"
              {...form.register('author')}
            />
            {form.formState.errors.author ? <small>{copy.required}</small> : null}
          </label>
          <label className={styles.wide}>
            <span>{copy.questionTitle}</span>
            <input
              maxLength={QNA_TITLE_MAX}
              placeholder={copy.titleHint}
              {...form.register('title')}
            />
            {form.formState.errors.title ? <small>{copy.required}</small> : null}
          </label>
          <label className={styles.wide}>
            <span>{copy.details}</span>
            <textarea
              maxLength={QNA_BODY_MAX}
              rows={5}
              placeholder={copy.detailsHint}
              {...form.register('body')}
            />
            {form.formState.errors.body ? <small>{copy.required}</small> : null}
          </label>
          <label className={styles.wide}>
            <span>{copy.tags}</span>
            <input maxLength={200} placeholder={copy.tagsHint} {...form.register('tags')} />
          </label>
        </div>
        <button type="submit" className={styles.primary}>
          {copy.add}
        </button>
      </form>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="sr-only">{copy.search}</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            maxLength={100}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
          />
        </label>
        <button
          type="button"
          aria-pressed={onlyUnanswered}
          className={onlyUnanswered ? styles.filterActive : undefined}
          onClick={() => setOnlyUnanswered((value) => !value)}
        >
          {copy.unanswered}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>{copy.empty}</div>
      ) : (
        <ol className={styles.questions}>
          {visible.map((question) => {
            const questionAnswers = answersFor(answers, question.id)
            const isOwn = Boolean(ownQ[question.id])
            return (
              <li key={question.id} className={styles.question}>
                <div className={styles.questionMeta}>
                  <span>{question.author}</span>
                  <time dateTime={question.createdAt}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                      new Date(question.createdAt)
                    )}
                  </time>
                </div>
                <h2>{question.title}</h2>
                <p className={styles.body}>{question.body}</p>
                {question.tags.length ? (
                  <div className={styles.tags}>
                    {question.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                ) : null}
                <div className={styles.questionActions}>
                  <span>
                    {copy.answerCount.replace('{{count}}', String(questionAnswers.length))}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAnsweringId((id) => (id === question.id ? null : question.id))
                    }
                  >
                    {answeringId === question.id ? copy.cancel : copy.answer}
                  </button>
                  {isOwn ? (
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => {
                        if (window.confirm(copy.deleteQuestion)) removeQuestion(question.id)
                      }}
                    >
                      {copy.delete}
                    </button>
                  ) : null}
                </div>
                {answeringId === question.id ? (
                  <AnswerComposer
                    copy={copy}
                    defaultAuthor={lastAuthor}
                    onSave={(values) => {
                      addAnswer({ questionId: question.id, ...values })
                      setAnsweringId(null)
                    }}
                  />
                ) : null}
                {questionAnswers.length ? (
                  <ul className={styles.answers}>
                    {questionAnswers.map((answer) => (
                      <li key={answer.id} className={answer.accepted ? styles.accepted : undefined}>
                        <div className={styles.answerMeta}>
                          <span>{answer.author}</span>
                          <time dateTime={answer.createdAt}>
                            {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                              new Date(answer.createdAt)
                            )}
                          </time>
                        </div>
                        {answer.accepted ? (
                          <strong className={styles.selected}>{copy.selected}</strong>
                        ) : null}
                        <p>{answer.body}</p>
                        <div className={styles.answerActions}>
                          {isOwn ? (
                            <button
                              type="button"
                              onClick={() => acceptAnswer(question.id, answer.id)}
                            >
                              {answer.accepted ? copy.unselect : copy.select}
                            </button>
                          ) : null}
                          {ownA[answer.id] ? (
                            <button
                              type="button"
                              className={styles.danger}
                              onClick={() => {
                                if (window.confirm(copy.deleteAnswer)) removeAnswer(answer.id)
                              }}
                            >
                              {copy.delete}
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function AnswerComposer({
  copy,
  defaultAuthor,
  onSave,
}: {
  copy: (typeof COPY)[keyof typeof COPY]
  defaultAuthor: string
  onSave: (values: QnaAnswerFormValues) => void
}) {
  const form = useForm<QnaAnswerFormValues>({
    resolver: zodResolver(qnaAnswerFormSchema),
    defaultValues: { author: defaultAuthor, body: '' },
  })
  return (
    <form className={styles.answerComposer} onSubmit={form.handleSubmit(onSave)} noValidate>
      <p>{copy.answerHint}</p>
      <label>
        <span>{copy.nickname}</span>
        <input maxLength={QNA_AUTHOR_MAX} autoComplete="nickname" {...form.register('author')} />
        {form.formState.errors.author ? <small>{copy.required}</small> : null}
      </label>
      <label>
        <span>{copy.answer}</span>
        <textarea maxLength={QNA_BODY_MAX} rows={4} {...form.register('body')} />
        {form.formState.errors.body ? <small>{copy.required}</small> : null}
      </label>
      <button type="submit" className={styles.primary}>
        {copy.saveAnswer}
      </button>
    </form>
  )
}

export default Qna
