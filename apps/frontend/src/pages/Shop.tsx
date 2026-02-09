import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { paymentApi, type PaymentProduct } from '../api/client'
import './Shop.css'

export default function Shop() {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const [products, setProducts] = useState<PaymentProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await paymentApi.getProducts()
        setProducts(res.products)
      } catch (error) {
        console.error('상품 목록 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handlePurchase = async (productId: string) => {
    if (!token || purchasing) return

    setPurchasing(productId)
    try {
      const res = await paymentApi.ready(token, productId)
      // 카카오페이 결제창으로 이동
      window.location.href = res.redirectUrl
    } catch (error) {
      console.error('결제 준비 실패:', error)
      alert('결제 준비 중 오류가 발생했습니다')
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="shop-screen">
        <div className="loading-center">
          <Spin size="large" />
          <p>상품 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-screen">
      {/* 헤더 */}
      <div className="shop-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className="shop-title">쌀 충전소</h1>
      </div>

      {/* 현재 잔액 */}
      <div className="balance-card">
        <div className="balance-info">
          <span className="balance-icon">🍚</span>
          <div className="balance-details">
            <span className="balance-label">내 쌀</span>
            <span className="balance-amount">{user.rice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="shop-notice">
        <p>카카오페이로 간편하게 쌀을 충전하세요!</p>
        <p className="notice-sub">충전된 쌀은 운세 확인, 사주 분석 등에 사용됩니다.</p>
      </div>

      {/* 상품 목록 */}
      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-info">
              <div className="product-rice">
                <span className="rice-emoji">🍚</span>
                <span className="rice-count">{product.rice.toLocaleString()}</span>
                {product.bonus > 0 && (
                  <span className="bonus-badge">+{product.bonus}</span>
                )}
              </div>
              <div className="product-total">
                총 {(product.rice + product.bonus).toLocaleString()}쌀
              </div>
            </div>
            <div className="product-action">
              <span className="product-price">
                {product.price.toLocaleString()}원
              </span>
              <button
                className="purchase-btn"
                onClick={() => handlePurchase(product.id)}
                disabled={purchasing !== null}
              >
                {purchasing === product.id ? (
                  <Spin size="small" />
                ) : (
                  '구매하기'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 결제 안내 */}
      <div className="payment-info">
        <h3>결제 안내</h3>
        <ul>
          <li>카카오페이를 통해 결제가 진행됩니다.</li>
          <li>결제 완료 후 즉시 쌀이 충전됩니다.</li>
          <li>충전된 쌀은 환불되지 않습니다.</li>
        </ul>
      </div>
    </div>
  )
}
