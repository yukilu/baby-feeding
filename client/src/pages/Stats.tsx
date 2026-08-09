import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h${m}min`
  return `${m}min`
}

// 页面缓存
const statsCache = { stats: [] as DailyStats[], scroll: 0, page: 1, totalPages: 0, loaded: false, startDate: '', endDate: '' }

export default function Stats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DailyStats[]>(statsCache.stats)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [startDate, setStartDate] = useState(statsCache.startDate)
  const [endDate, setEndDate] = useState(statsCache.endDate)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(statsCache.page)
  const totalPagesRef = useRef(statsCache.totalPages)
  const statsRef = useRef(stats)
  statsRef.current = stats
  const startDateRef = useRef(startDate)
  startDateRef.current = startDate
  const endDateRef = useRef(endDate)
  endDateRef.current = endDate

  const loadStats = async (currentPage: number = 1) => {
    const response = await api.getStats(currentPage, 10, startDateRef.current || undefined, endDateRef.current || undefined)
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
      statsCache.startDate = startDateRef.current
      statsCache.endDate = endDateRef.current
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

  const handleFilterChange = () => {
    pageRef.current = 1
    totalPagesRef.current = 0
    loadStats(1)
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
    startDateRef.current = ''
    endDateRef.current = ''
    pageRef.current = 1
    totalPagesRef.current = 0
    api.getStats(1, 10).then(response => {
      setStats(response.data)
      pageRef.current = 1
      totalPagesRef.current = response.totalPages
    })
  }

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
          <button onClick={() => navigate(-1)} className="mr-3 hover:opacity-80">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">📊 统计</h1>
        </div>
      </div>

      {/* 时间范围筛选 - 吸顶固定 */}
      <div className="sticky top-[57px] z-10 bg-gray-50 p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 truncate pointer-events-none">
              {startDate ? startDate.slice(5) : '开始日期'}
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          <span className="text-gray-400 text-sm shrink-0">至</span>
          <div className="relative flex-1 min-w-0">
            <div className="px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 truncate pointer-events-none">
              {endDate ? endDate.slice(5) : '结束日期'}
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          <button
            onClick={handleFilterChange}
            className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition whitespace-nowrap shrink-0"
          >
            搜索
          </button>
          <button
            onClick={handleClearFilter}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition whitespace-nowrap shrink-0"
          >
            清空
          </button>
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
                  <div className="bg-teal-50 rounded-lg p-2 text-center">
                    <div className="text-base mb-0.5">⏱️</div>
                    <div className="text-sm font-bold text-teal-600">{formatDuration(stat.breastmilkDuration)}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2 text-center">
                    <div className="text-base mb-0.5">💩</div>
                    <div className="text-sm font-bold text-yellow-700">{stat.poopCount}次</div>
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
