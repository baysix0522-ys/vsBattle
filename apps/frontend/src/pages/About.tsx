import { useNavigate } from 'react-router-dom'
import './Legal.css'

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="legal-screen">
      <header className="legal-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>회사소개</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="legal-content">
        <section className="about-hero">
          <div className="about-logo">🐼</div>
          <h2>사주배틀</h2>
          <p className="about-tagline">재미있는 사주 대결 서비스</p>
        </section>

        <section>
          <h2>서비스 소개</h2>
          <p>
            사주배틀은 전통적인 사주명리학을 현대적으로 재해석하여,
            누구나 쉽고 재미있게 자신의 운세를 확인하고
            친구들과 사주 대결을 즐길 수 있는 서비스입니다.
          </p>
        </section>

        <section>
          <h2>주요 기능</h2>
          <p>
            - 오늘의 운세: 매일 새로운 운세 확인<br />
            - 사주 분석: 상세한 사주 리포트<br />
            - 사주 대결: 친구와 사주 스탯 비교<br />
            - 이름 풀이: 한자 기반 이름 분석
          </p>
        </section>

        <section>
          <h2>사업자 정보</h2>
          <div className="business-info">
            <p><strong>상호명:</strong> 사주배틀</p>
            <p><strong>대표자:</strong> 홍길동</p>
            <p><strong>사업자등록번호:</strong> 123-45-67890</p>
            <p><strong>통신판매업신고:</strong> 제2025-서울강남-0000호</p>
            <p><strong>주소:</strong> 서울특별시 강남구 테헤란로 123</p>
            <p><strong>이메일:</strong> contact@sajubattle.com</p>
            <p><strong>고객센터:</strong> 02-1234-5678</p>
          </div>
        </section>

        <div className="legal-footer">
          <p>Copyright 2025. 사주배틀 All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
