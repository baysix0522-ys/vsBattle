import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { paymentApi } from '../api/client'
import './PaymentCallback.css'

type CallbackStatus = 'processing' | 'success' | 'cancel' | 'fail'

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token, isLoading, updateRice } = useAuth()

  const [status, setStatus] = useState<CallbackStatus>('processing')
  const [riceAmount, setRiceAmount] = useState<number>(0)
  const [newBalance, setNewBalance] = useState<number>(0)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // 인증 로딩 중이면 대기
    if (isLoading) return

    const callbackStatus = searchParams.get('status')
    const pgToken = searchParams.get('pg_token')
    const orderId = searchParams.get('orderId')

    // 취소 또는 실패 처리
    if (callbackStatus === 'cancel') {
      setStatus('cancel')
      return
    }

    if (callbackStatus === 'fail') {
      setStatus('fail')
      setError('결제가 실패했습니다. 다시 시도해주세요.')
      return
    }

    // 성공 처리 - approve API 호출
    if (callbackStatus === 'success' && pgToken && orderId && token) {
      const approvePayment = async () => {
        try {
          const res = await paymentApi.approve(token, pgToken, orderId)
          if (res.success) {
            setStatus('success')
            setRiceAmount(res.riceAmount)
            setNewBalance(res.newBalance)
            // 쌀 잔액 업데이트
            updateRice(res.newBalance)
          } else {
            setStatus('fail')
            setError('결제 승인에 실패했습니다.')
          }
        } catch (err) {
          console.error('결제 승인 실패:', err)
          setStatus('fail')
          setError('결제 승인 중 오류가 발생했습니다.')
        }
      }

      approvePayment()
    } else if (!token) {
      setStatus('fail')
      setError('로그인이 필요합니다.')
    }
  }, [searchParams, token, isLoading, updateRice])

  // 사주 분석 플로우에서 쌀 충전한 경우 (sessionStorage에 returnTo 있음)
  const hasSajuReturn = !!sessionStorage.getItem('saju_returnTo')

  const handleGoToMyPage = () => {
    navigate('/mypage')
  }

  const handleGoToSaju = () => {
    navigate('/saju')
  }

  const handleRetry = () => {
    navigate('/shop')
  }

  return (
    <div className="callback-screen">
      {status === 'processing' && (
        <div className="callback-content">
          <Spin size="large" />
          <h2>결제 처리 중...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="callback-content success">
          <div className="success-icon">🎉</div>
          <h2>결제 완료!</h2>
          <div className="result-box">
            <div className="result-item">
              <span className="result-label">충전된 쌀</span>
              <span className="result-value rice">+{riceAmount.toLocaleString()}</span>
            </div>
            <div className="result-divider"></div>
            <div className="result-item">
              <span className="result-label">현재 잔액</span>
              <span className="result-value balance">{newBalance.toLocaleString()} 쌀</span>
            </div>
          </div>
          {hasSajuReturn ? (
            <button className="primary-btn" onClick={handleGoToSaju}>
              사주 분석으로 돌아가기
            </button>
          ) : (
            <button className="primary-btn" onClick={handleGoToMyPage}>
              마이페이지로 이동
            </button>
          )}
        </div>
      )}

      {status === 'cancel' && (
        <div className="callback-content cancel">
          <div className="cancel-icon">😔</div>
          <h2>결제가 취소되었습니다</h2>
          <p>다음에 다시 이용해주세요.</p>
          <div className="button-group">
            <button className="secondary-btn" onClick={hasSajuReturn ? handleGoToSaju : handleGoToMyPage}>
              {hasSajuReturn ? '사주 분석으로' : '마이페이지'}
            </button>
            <button className="primary-btn" onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        </div>
      )}

      {status === 'fail' && (
        <div className="callback-content fail">
          <div className="fail-icon">❌</div>
          <h2>결제 실패</h2>
          <p className="error-message">{error}</p>
          <div className="button-group">
            <button className="secondary-btn" onClick={hasSajuReturn ? handleGoToSaju : handleGoToMyPage}>
              {hasSajuReturn ? '사주 분석으로' : '마이페이지'}
            </button>
            <button className="primary-btn" onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
