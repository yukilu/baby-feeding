import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { DailyStats } from '../types'

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 页面缓存
const statsCache = { stats: [] as DailyStats[], scroll: 0, page: 1, totalPages: 0, loaded: false }

export default function Stats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DailyStats[]>(statsCache.stats)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(statsCache.page)
  const totalPagesRef = useRef(statsCache.totalPages)
  const statsRef = useRef(stats)
  statsRef.current = stats

  const loadStats = async (currentPage: number = 1) => {
    const response = await api.getStats(currentPage)
    if (currentPage === 1) {
      setStats(response.data)
    } else {
      setStats(prev => [...prev, ...response.data])
    }
    pageRef.current = currentPage
    totalPagesRef.current = response.totalPages
  }

  useEffect(() => {
    if (statsCache.loaded) {
      window.scrollTo(0, statsCache.scroll)
    } else {
      loadStats(1)
    }
    return () => {
      statsCache.stats = statsRef.current
      statsCache.scroll = window.scrollY
      statsCache.page = pageRef.current
      statsCache.totalPages = totalPagesRef.current
      statsCache.loaded = true
    }
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return
    const nextPage = pageRef.current + 1
    if (nextPage > totalPagesRef.current) return
    setLoadingMore(true)
    await loadStats(nextPage)
    setLoadingMore(false)
  }, [loadingMore])

  // 滚动到底部自动加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      { rootMargin: '100px' }
    )
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }
    return () => observer.disconnect()
  }, [handleLoadMore, stats])

  // 下拉刷新
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY
        isPulling.current = true
      } else {
        isPulling.current = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return
      const distance = e.touches[0].clientY - touchStartY.current
      if (distance > 0) {
        e.preventDefault()
        const newDistance = Math.min(distance * 0.5, 80)
        pullDistanceRef.current = newDistance
        setPullDistance(newDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return
      isPulling.current = false
      if (pullDistanceRef.current > 50) {
        setRefreshing(true)
        setPullDistance(0)
        pullDistanceRef.current = 0
        await loadStats(1)
        setRefreshing(false)
      } else {
        setPullDistance(0)
        pullDistanceRef.current = 0
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* 下拉刷新提示 */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex justify-center items-center text-gray-500 text-sm"
          style={{ height: refreshing ? 40 : pullDistance }}
        >
          {refreshing ? '刷新中...' : pullDistance > 50 ? '释放刷新' : '下拉刷新'}
        </div>
      )}

      {/* 头部 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 shadow-md">
        <div className="flex items-center">
          <Link to="/" className="mr-3 hover:opacity-80">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">📊 统计</h1>
        </div>
      </div>

      {/* 统计列表 */}
      <div className="p-4">
        {stats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无统计数据
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map(stat => (
              <div
                key={stat.date}
                onClick={() => navigate(`/stats/${stat.date}`)}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 cursor-pointer hover:border-purple-300 hover:bg-gray-100 transition"
              >
                <h3 className="font-semibold text-gray-800 mb-3">{formatDate(stat.date)}</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <div className="text-base mb-0.5">🍼</div>
                    <div className="text-sm font-bold text-orange-600">{stat.formulaAmount}mL</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-2 text-center">
                    <div className="text-base mb-0.5">🤱</div>
                    <div className="text-sm font-bold text-pink-600">{stat.breastmilkAmount}mL</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2 text-center">
                    <div className="text-base mb-0.5">💩</div>
                    <div className="text-sm font-bold text-yellow-700">{stat.poopCount}次</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-base mb-0.5">🧷</div>
                    <div className="text-sm font-bold text-green-600">{stat.diaperCount}片</div>
                  </div>
                </div>
              </div>
            ))}
            {/* 滚动哨兵 */}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="text-center py-3 text-gray-500 text-sm">加载中...</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
