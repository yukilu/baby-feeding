import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { FeedingRecord, RecordType } from '../types'
import AddModal from '../components/AddModal'

const typeLabels: Record<RecordType, string> = {
  breastmilk: '🤱 母乳',
  formula: '🍼 奶粉',
  pee: '💧 尿尿',
  poop: '💩 大便',
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 页面缓存
const homeCache = { records: [] as FeedingRecord[], scroll: 0, page: 1, totalPages: 0, loaded: false }

export default function Home() {
  const [records, setRecords] = useState<FeedingRecord[]>(homeCache.records)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FeedingRecord | undefined>()
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(homeCache.page)
  const totalPagesRef = useRef(homeCache.totalPages)
  const recordsRef = useRef(records)
  recordsRef.current = records

  const loadRecords = async (currentPage: number = 1) => {
    const response = await api.getRecords(currentPage)
    if (currentPage === 1) {
      setRecords(response.data)
    } else {
      setRecords(prev => [...prev, ...response.data])
    }
    pageRef.current = currentPage
    totalPagesRef.current = response.totalPages
  }

  useEffect(() => {
    if (homeCache.loaded) {
      window.scrollTo(0, homeCache.scroll)
    } else {
      loadRecords(1)
    }
    return () => {
      homeCache.records = recordsRef.current
      homeCache.scroll = window.scrollY
      homeCache.page = pageRef.current
      homeCache.totalPages = totalPagesRef.current
      homeCache.loaded = true
    }
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return
    const nextPage = pageRef.current + 1
    if (nextPage > totalPagesRef.current) return
    setLoadingMore(true)
    await loadRecords(nextPage)
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
  }, [handleLoadMore, records])

  const handleRecordUpdated = () => {
    loadRecords(1)
  }

  const handleAdd = () => {
    setEditingRecord(undefined)
    setShowModal(true)
  }

  const handleEdit = (record: FeedingRecord) => {
    setEditingRecord(record)
    setShowModal(true)
  }

  // 使用原生事件处理下拉刷新（兼容微信浏览器）
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
        await loadRecords(1)
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

      {/* 头部 - 固定吸顶 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 shadow-md">
        <div className="grid grid-cols-3 gap-2">
          <Link
            to="/stats"
            className="bg-white/20 backdrop-blur rounded-lg p-3 text-center hover:bg-white/30 transition"
          >
            <div className="text-xl">📊</div>
          </Link>
          <Link
            to="/poop"
            className="bg-white/20 backdrop-blur rounded-lg p-3 text-center hover:bg-white/30 transition"
          >
            <div className="text-xl">💩</div>
          </Link>
          <button
            onClick={handleAdd}
            className="bg-white/20 backdrop-blur rounded-lg p-3 text-center hover:bg-white/30 transition"
          >
            <div className="text-xl">➕</div>
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="p-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无记录，点击上方"➕"开始记录
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(record => (
              <div
                key={record.id}
                onClick={() => handleEdit(record)}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 cursor-pointer hover:border-purple-300 hover:bg-gray-100 transition"
              >
                {/* 时间 */}
                <div className="text-sm text-gray-500 mb-2">{formatDate(record.createdAt)}</div>
                
                {/* 主内容 */}
                <div className="flex justify-between items-center">
                  <span className="text-lg">
                    <span className="inline-block w-8">{typeLabels[record.type].split(' ')[0]}</span>
                    {typeLabels[record.type].split(' ')[1]}
                  </span>
                  {(record.type === 'formula' || record.type === 'breastmilk') && (record.amount || record.duration) ? (
                    <span className="font-medium flex items-center gap-2">
                      {record.duration ? <span className="text-teal-600">{record.duration}min</span> : null}
                      {record.amount ? <span className="text-blue-600">{record.amount}mL</span> : null}
                    </span>
                  ) : null}
                  {(record.type === 'pee' || record.type === 'poop') && record.diaper ? (
                    <span className="font-medium text-green-600">{record.diaper}片</span>
                  ) : null}
                </div>
                
                {/* 备注 */}
                {record.note && <div className="text-xs text-gray-500 mt-2">{record.note}</div>}
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

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <AddModal
          record={editingRecord}
          onClose={() => setShowModal(false)}
          onRecordUpdated={handleRecordUpdated}
        />
      )}
    </div>
  )
}
