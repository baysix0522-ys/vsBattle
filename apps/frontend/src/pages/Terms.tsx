import { useNavigate } from 'react-router-dom'
import './Legal.css'

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="legal-screen">
      <header className="legal-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>이용약관</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="legal-content">
        <section>
          <h2>제1조 (목적)</h2>
          <p>
            본 약관은 사주배틀(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2>제2조 (정의)</h2>
          <p>
            1. "서비스"란 회사가 제공하는 사주 분석, 운세 확인, 사주 대결 등의 서비스를 말합니다.<br />
            2. "회원"이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.<br />
            3. "쌀"이란 서비스 내에서 사용되는 가상 재화를 말합니다.
          </p>
        </section>

        <section>
          <h2>제3조 (약관의 효력)</h2>
          <p>
            본 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다. 회원이 서비스에 가입함으로써 본 약관에 동의한 것으로 간주합니다.
          </p>
        </section>

        <section>
          <h2>제4조 (서비스의 제공)</h2>
          <p>
            1. 회사는 다음과 같은 서비스를 제공합니다.<br />
            - 오늘의 운세 확인<br />
            - 사주 분석 및 리포트<br />
            - 사주 대결<br />
            - 이름 풀이<br />
            - 기타 회사가 추가 개발하는 서비스
          </p>
        </section>

        <section>
          <h2>제5조 (유료 서비스)</h2>
          <p>
            1. 일부 서비스는 "쌀"을 소모하여 이용할 수 있습니다.<br />
            2. "쌀"은 유료로 충전하거나 이벤트를 통해 획득할 수 있습니다.<br />
            3. 충전된 "쌀"은 환불되지 않습니다.
          </p>
        </section>

        <section>
          <h2>제6조 (면책조항)</h2>
          <p>
            1. 서비스에서 제공하는 운세 및 사주 분석은 오락 목적으로 제공됩니다.<br />
            2. 서비스의 결과를 근거로 한 의사결정에 대해 회사는 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2>제7조 (개인정보보호)</h2>
          <p>
            회원의 개인정보 보호에 관한 사항은 개인정보처리방침에 따릅니다.
          </p>
        </section>

        <section>
          <h2>제8조 (회원 탈퇴)</h2>
          <p>
            1. 회원은 언제든지 서비스 내 마이페이지에서 회원 탈퇴를 요청할 수 있습니다.<br /><br />
            2. 회원 탈퇴 시 다음의 정보가 즉시 삭제되며, 복구가 불가능합니다.<br />
            - 사주 분석 기록<br />
            - 사주 대결 기록<br />
            - 오늘의 운세 기록<br />
            - 이름 풀이 기록<br />
            - 보유 쌀 (잔액)<br />
            - 결제 내역<br /><br />
            3. 탈퇴 후 동일한 계정으로 재가입하더라도 이전 데이터는 복구되지 않습니다.<br /><br />
            4. 법령에 따라 보존이 필요한 정보는 해당 기간 동안 보관 후 파기됩니다.
          </p>
        </section>

        <div className="legal-footer">
          <p>시행일: 2025년 1월 1일</p>
        </div>
      </div>
    </div>
  )
}
