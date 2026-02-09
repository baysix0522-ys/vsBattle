import { useNavigate } from 'react-router-dom'
import './Legal.css'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="legal-screen">
      <header className="legal-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>개인정보처리방침</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="legal-content">
        <section>
          <h2>1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            회사는 다음의 목적을 위하여 개인정보를 처리합니다.<br />
            - 회원 가입 및 관리<br />
            - 서비스 제공 (사주 분석, 운세 확인 등)<br />
            - 결제 및 환불 처리<br />
            - 서비스 개선 및 통계 분석
          </p>
        </section>

        <section>
          <h2>2. 수집하는 개인정보 항목</h2>
          <p>
            <strong>필수 항목:</strong><br />
            - 카카오 로그인: 카카오 계정 정보 (닉네임, 프로필 이미지)<br />
            - 생년월일, 성별 (사주 분석용)<br /><br />
            <strong>선택 항목:</strong><br />
            - 출생 시간
          </p>
        </section>

        <section>
          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            - 회원 탈퇴 시까지<br />
            - 관련 법령에 따른 보존 기간<br />
            - 결제 기록: 5년 (전자상거래법)
          </p>
        </section>

        <section>
          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.<br />
            - 회원의 동의가 있는 경우<br />
            - 법령의 규정에 의한 경우
          </p>
        </section>

        <section>
          <h2>5. 개인정보의 파기</h2>
          <p>
            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br /><br />
            <strong>회원 탈퇴 시 파기되는 개인정보:</strong><br />
            - 카카오 계정 연동 정보 (닉네임, 프로필 이미지)<br />
            - 생년월일, 성별, 출생시간<br />
            - 서비스 이용 기록 (사주 분석, 운세, 대결 등)<br /><br />
            <strong>파기 방법:</strong><br />
            - 전자적 파일: 복구 불가능한 방법으로 영구 삭제<br />
            - 종이 문서: 분쇄기로 분쇄 또는 소각<br /><br />
            <strong>예외:</strong><br />
            - 전자상거래법에 따른 결제 기록: 5년 보관 후 파기
          </p>
        </section>

        <section>
          <h2>6. 이용자의 권리</h2>
          <p>
            회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보의 삭제를 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2>7. 개인정보 보호책임자</h2>
          <p>
            성명: 홍길동<br />
            이메일: privacy@sajubattle.com
          </p>
        </section>

        <div className="legal-footer">
          <p>시행일: 2025년 1월 1일</p>
        </div>
      </div>
    </div>
  )
}
