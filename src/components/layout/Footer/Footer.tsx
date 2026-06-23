import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Footer.module.css'

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>{t('footer.copyright', { year: currentYear })}</p>
        <div className={styles.links}>
          <Link to="/about" className={styles.link}>
            {t('footer.about')}
          </Link>
          <Link to="/support" className={styles.link}>
            {t('footer.support')}
          </Link>
          <Link to="/contact" className={styles.link}>
            {t('footer.contact')}
          </Link>
          <Link to="/terms" className={styles.link}>
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" className={styles.link}>
            {t('footer.privacy')}
          </Link>
          <Link to="/support?category=bug" className={styles.link}>
            {t('footer.reportBug')}
          </Link>
          <Link to="/faq" className={styles.link}>
            {t('footer.faq')}
          </Link>
          <Link to="/backup" className={styles.link}>
            {t('nav.backup')}
          </Link>
          <Link to="/registry" className={styles.link}>
            {t('nav.registry')}
          </Link>
          <Link to="/sitemap" className={styles.link}>
            사이트맵
          </Link>
          <a
            href="https://github.com/blue45f/pettography"
            target="_blank"
            rel="noreferrer"
            className={styles.link}
          >
            GitHub ↗
          </a>
        </div>
        <div className={styles.businessInfo}>
          <div className={styles.businessGrid}>
            <div>
              <p style={{ fontWeight: 'bold' }}>상호: 에이치준랩스</p>
              <p>대표자: 김희준 | 개인정보보호책임자: 김희준</p>
            </div>
            <div>
              <p>사업자등록번호: 355-07-03473</p>
              <p>주소: 서울특별시 송파구 가락로34길 13, 101호(방이동)</p>
            </div>
            <div>
              <p>이메일: blue45f@gmail.com</p>
              <p>전화번호: 010-3873-4197</p>
            </div>
            <div>
              <p>호스팅 서비스: Vercel (Frontend)</p>
              <p>플랫폼 형태: 희귀 반려동물 예약 및 케어 플랫폼</p>
            </div>
          </div>
          <div className={styles.businessBottom}>
            <span>© {currentYear} Pettography (Beta). All rights reserved.</span>
            <span>위치 기반 매칭 베타 서비스</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
