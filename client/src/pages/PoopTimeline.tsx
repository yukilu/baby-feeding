import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { FeedingRecord } from '../types'
import AddModal from '../components/AddModal'

const formatTimelineDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  if (diffDays === 0) return { label: '今天', time }
  if (diffDays === 1) return { label: '昨天', time }
  if (diffDays === 2) return { label: '前天', time }
  return {
    label: `${date.getMonth() + 1}月${date.getDate()}日`,
    time,
  }
}

// 页面缓存
const poopCache = { records: [] as FeedingRecord[], scroll: 0, page: 1, totalPages: 0, loaded: false }

export default function PoopTimeline() {
  const [records, setRecords] = useState<FeedingRecord[]>(poopCache.records)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FeedingRecord | undefined>()
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(poopCache.page)
  const totalPagesRef = useRef(poopCache.totalPages)
  const recordsRef = useRef(records)
  recordsRef.current = records

  const loadRecords = async (currentPage: number = 1) => {
    const response = await api.getRecords(currentPage, 10, 'poop')
    if (currentPage === 1) {
      setRecords(response.data)
    } else {
      setRecords(prev => [...prev, ...response.data])
    }
    pageRef.current = currentPage
    totalPagesRef.current = response.totalPages
  }

  useEffect(() => {
    if (poopCache.loaded) {
      window.scrollTo(0, poopCache.scroll)
    } else {
      loadRecords(1)
    }
    return () => {
      poopCache.records = recordsRef.current
      poopCache.scroll = window.scrollY
      poopCache.page = pageRef.current
      poopCache.totalPages = totalPagesRef.current
      poopCache.loaded = true
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

  const handleEdit = (record: FeedingRecord) => {
    setEditingRecord(record)
    setShowModal(true)
  }

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

      {/* 头部 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 shadow-md">
        <div className="flex items-center">
          <Link to="/" className="mr-3 hover:opacity-80">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">💩 大便记录</h1>
        </div>
      </div>

      {/* 时间线列表 */}
      <div className="p-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无大便记录
          </div>
        ) : (
          <div className="pl-8">
            {records.map((record, index) => {
              const { label, time } = formatTimelineDate(record.createdAt)
              const isFirst = index === 0
              const isLast = index === records.length - 1
              // 最近一条：红色系，第二近：橙色系，其他：黄色系
              const colorConfig = index === 0
                ? { dot: 'bg-red-500', text: 'text-red-600', line: 'bg-red-300' }
                : index === 1
                ? { dot: 'bg-orange-500', text: 'text-orange-600', line: 'bg-orange-300' }
                : { dot: 'bg-yellow-500', text: 'text-yellow-600', line: 'bg-yellow-300' }
              return (
                <div key={record.id} className="relative pb-5">
                  {/* 竖线上半段 - 从顶部延伸过圆点中心 */}
                  {!isFirst && (
                    <div
                      className={`absolute w-0.5 ${colorConfig.line}`}
                      style={{ left: '-29px', top: 0, height: '14px' }}
                    />
                  )}
                  {/* 竖线下半段 - 从圆点中心延伸到底部 */}
                  {!isLast && (
                    <div
                      className={`absolute w-0.5 ${colorConfig.line}`}
                      style={{ left: '-29px', top: '7px', bottom: 0 }}
                    />
                  )}
                  {/* 时间线节点 - 圆点盖住竖线 */}
                  <div className={`absolute w-2.5 h-2.5 rounded-full ${colorConfig.dot} ring-2 ring-white`} style={{ left: '-33px', top: '5px' }} />

                  {/* 内容 */}
                  <div
                    onClick={() => handleEdit(record)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className={`text-base font-semibold ${colorConfig.text}`}>{label} {time}</span>
                      {record.diaper ? (
                        <span className="text-sm text-green-600">{record.diaper}片</span>
                      ) : null}
                    </div>
                    {/* 最新一条显示距现在的时间 */}
                    {index === 0 && (() => {
                      const diff = Date.now() - new Date(record.createdAt).getTime()
                      const totalMinutes = Math.floor(diff / 60000)
                      const days = Math.floor(totalMinutes / 1440)
                      const hours = Math.floor((totalMinutes % 1440) / 60)
                      const minutes = totalMinutes % 60
                      const parts: string[] = []
                      if (days > 0) parts.push(`${days}天`)
                      if (hours > 0) parts.push(`${hours}小时`)
                      if (minutes > 0) parts.push(`${minutes}分钟`)
                      if (parts.length === 0) parts.push('0分钟')
                      // 超过三天红色，超过两天橙色，其他蓝色
                      const textColor = days > 3 ? 'text-red-500' : days > 2 ? 'text-orange-500' : 'text-blue-500'
                      return <div className={`text-sm ${textColor} mt-0.5`}>距现在 {parts.join('')}</div>
                    })()}
                    {/* 距离上次的时间差 */}
                    {index < records.length - 1 && (() => {
                      const diff = new Date(record.createdAt).getTime() - new Date(records[index + 1].createdAt).getTime()
                      const totalMinutes = Math.floor(diff / 60000)
                      const days = Math.floor(totalMinutes / 1440)
                      const hours = Math.floor((totalMinutes % 1440) / 60)
                      const minutes = totalMinutes % 60
                      const parts: string[] = []
                      if (days > 0) parts.push(`${days}天`)
                      if (hours > 0) parts.push(`${hours}小时`)
                      if (minutes > 0) parts.push(`${minutes}分钟`)
                      if (parts.length === 0) parts.push('0分钟')
                      return <div className="text-sm text-gray-400 mt-0.5">距上次 {parts.join('')}</div>
                    })()}
                  </div>
                </div>
              )
            })}

            {/* 滚动哨兵 */}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="text-center py-3 text-gray-500 text-sm">加载中...</div>
            )}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
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
