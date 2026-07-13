import {
  partnerInquiryFormSchema,
  type PartnerInquiryFormValues,
  type PartnerInquiryKind,
} from '@domains/partners'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import styles from './Partners.module.css'

const KINDS: PartnerInquiryKind[] = [
  'hospital',
  'shop',
  'breeder',
  'treat-shop',
  'funeral',
  'other',
]
const COPY = {
  ko: {
    title: '제휴 문의 초안',
    subtitle: '기관 정보를 공개 게시하지 않고, 담당자에게 전달할 문의 내용을 안전하게 정리합니다.',
    privateTitle: '자동 제출이나 공개 등록이 아닙니다',
    private:
      '입력 내용은 저장하거나 서버로 보내지 않습니다. 초안을 만든 뒤 검토하고 공식 문의 채널로 직접 전달하세요.',
    process: ['기관 정보 입력', '문의 초안 확인', '공식 문의 채널로 전달'],
    formTitle: '문의 정보',
    kind: '기관 유형',
    name: '기관명',
    contact: '회신 연락처',
    region: '활동 지역',
    url: '공식 웹사이트',
    description: '제휴 제안과 운영 정보',
    descriptionHint:
      '제공 서비스, 대상 동물, 인허가·전문성, 협업 방식과 확인이 필요한 내용을 적어주세요.',
    build: '문의 초안 만들기',
    draftTitle: '검토할 문의 초안',
    copy: '초안 복사',
    copied: '복사했습니다',
    copyFailed: '복사하지 못했습니다. 직접 선택해 주세요.',
    contactPage: '문의 채널로 이동',
    error: '입력값을 확인해주세요.',
    kinds: {
      hospital: '동물병원',
      shop: '용품점',
      breeder: '브리더·번식자',
      'treat-shop': '먹이·간식 업체',
      funeral: '동물장묘업체',
      other: '기타',
    },
  },
  en: {
    title: 'Partnership inquiry draft',
    subtitle: 'Prepare an inquiry without publicly listing an organization’s details.',
    privateTitle: 'This does not submit or publish anything',
    private:
      'Entries are neither stored nor sent to a server. Review the draft and deliver it through an official contact channel.',
    process: ['Enter organization details', 'Review the draft', 'Send through an official channel'],
    formTitle: 'Inquiry details',
    kind: 'Organization type',
    name: 'Organization name',
    contact: 'Reply contact',
    region: 'Operating region',
    url: 'Official website',
    description: 'Proposal and operating details',
    descriptionHint:
      'Describe services, species served, licensing or expertise, collaboration model, and points to verify.',
    build: 'Build inquiry draft',
    draftTitle: 'Inquiry draft to review',
    copy: 'Copy draft',
    copied: 'Copied',
    copyFailed: 'Could not copy. Select the text manually.',
    contactPage: 'Go to contact channel',
    error: 'Check this value.',
    kinds: {
      hospital: 'Veterinary clinic',
      shop: 'Supply shop',
      breeder: 'Breeder',
      'treat-shop': 'Feed or treat supplier',
      funeral: 'Animal funeral provider',
      other: 'Other',
    },
  },
  ja: {
    title: '提携問い合わせ下書き',
    subtitle: '機関情報を公開せず、担当者へ送る問い合わせ内容を安全に整理します。',
    privateTitle: '自動送信・公開登録ではありません',
    private:
      '入力内容は保存もサーバー送信もされません。下書きを確認し、公式の問い合わせ窓口へ直接送ってください。',
    process: ['機関情報を入力', '下書きを確認', '公式窓口へ送信'],
    formTitle: '問い合わせ情報',
    kind: '機関種別',
    name: '機関名',
    contact: '返信先',
    region: '活動地域',
    url: '公式ウェブサイト',
    description: '提携提案と運営情報',
    descriptionHint:
      '提供サービス、対象動物、許認可・専門性、協業方法、確認事項を記入してください。',
    build: '問い合わせ下書きを作成',
    draftTitle: '確認用の問い合わせ下書き',
    copy: '下書きをコピー',
    copied: 'コピーしました',
    copyFailed: 'コピーできませんでした。テキストを選択してください。',
    contactPage: '問い合わせ窓口へ',
    error: '入力内容を確認してください。',
    kinds: {
      hospital: '動物病院',
      shop: '用品店',
      breeder: 'ブリーダー',
      'treat-shop': 'フード・おやつ業者',
      funeral: '動物葬祭業者',
      other: 'その他',
    },
  },
} as const

function Partners() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] as keyof typeof COPY
  const copy = COPY[language] ?? COPY.ko
  useDocumentTitle(copy.title)
  const [draft, setDraft] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const form = useForm<PartnerInquiryFormValues>({
    resolver: zodResolver(partnerInquiryFormSchema),
    defaultValues: {
      kind: 'hospital',
      name: '',
      contact: '',
      region: '',
      description: '',
      url: '',
    },
  })
  const submit = form.handleSubmit((values) => {
    setDraft(
      [
        `${copy.kind}: ${copy.kinds[values.kind]}`,
        `${copy.name}: ${values.name}`,
        `${copy.region}: ${values.region}`,
        `${copy.contact}: ${values.contact}`,
        values.url ? `${copy.url}: ${values.url}` : '',
        '',
        copy.description,
        values.description,
      ]
        .filter(Boolean)
        .join('\n')
    )
    setCopyState('idle')
  })
  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>PARTNERSHIP INQUIRY</p>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <ol>
          {copy.process.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </header>
      <aside className={styles.notice}>
        <span aria-hidden="true">i</span>
        <div>
          <strong>{copy.privateTitle}</strong>
          <p>{copy.private}</p>
        </div>
      </aside>
      <div className={styles.workspace}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <h2>{copy.formTitle}</h2>
          <label>
            <span>{copy.kind}</span>
            <select {...form.register('kind')}>
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {copy.kinds[kind]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{copy.name}</span>
            <input maxLength={80} autoComplete="organization" {...form.register('name')} />
            {form.formState.errors.name ? <small>{copy.error}</small> : null}
          </label>
          <label>
            <span>{copy.contact}</span>
            <input maxLength={80} autoComplete="email" {...form.register('contact')} />
            {form.formState.errors.contact ? <small>{copy.error}</small> : null}
          </label>
          <label>
            <span>{copy.region}</span>
            <input maxLength={80} autoComplete="address-level1" {...form.register('region')} />
            {form.formState.errors.region ? <small>{copy.error}</small> : null}
          </label>
          <label>
            <span>{copy.url}</span>
            <input
              type="url"
              inputMode="url"
              maxLength={300}
              placeholder="https://"
              {...form.register('url')}
            />
            {form.formState.errors.url ? <small>{copy.error}</small> : null}
          </label>
          <label>
            <span>{copy.description}</span>
            <textarea
              rows={7}
              minLength={10}
              maxLength={1000}
              placeholder={copy.descriptionHint}
              {...form.register('description')}
            />
            {form.formState.errors.description ? <small>{copy.error}</small> : null}
          </label>
          <button type="submit" className={styles.primary}>
            {copy.build}
          </button>
        </form>
        <section className={styles.draft} aria-live="polite">
          <h2>{copy.draftTitle}</h2>
          {draft ? (
            <>
              <pre>{draft}</pre>
              <div className={styles.actions}>
                <button type="button" onClick={() => void copyDraft()}>
                  {copy.copy}
                </button>
                <Link to="/contact">{copy.contactPage}</Link>
              </div>
              {copyState !== 'idle' ? (
                <p className={copyState === 'failed' ? styles.copyError : styles.copySuccess}>
                  {copyState === 'copied' ? copy.copied : copy.copyFailed}
                </p>
              ) : null}
            </>
          ) : (
            <div className={styles.draftEmpty}>{copy.process[0]}</div>
          )}
        </section>
      </div>
    </section>
  )
}

export default Partners
