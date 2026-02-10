import { Helmet } from 'react-helmet-async'

type SEOProps = {
  title?: string
  description?: string
  path?: string
  image?: string
}

const SITE_NAME = '사주대결'
const SITE_URL = 'https://yspace.kr'
const DEFAULT_IMAGE = `${SITE_URL}/banners/banner02.png`
const DEFAULT_DESC = '사주로 겨루는 운명의 대결! 오늘의 운세, 타로, 이름 풀이, 사주 분석까지 다양한 운세 서비스를 무료로 즐겨보세요.'

export default function SEO({ title, description, path = '/', image }: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - 운세 서비스`
  const pageDesc = description || DEFAULT_DESC
  const pageUrl = `${SITE_URL}${path}`
  const pageImage = image || DEFAULT_IMAGE

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  )
}
