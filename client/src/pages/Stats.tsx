import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function Stats() {
  const [stats, setStats] = useState<DailyStats[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const loadStats = async (currentPage: number = 1) => {
    const response = await api.getStats(currentPage)
    if (currentPage === 1) {
      setStats(response.data)
    } else {
      setStats(prev => [...prev, ...response.data])
    }
    setTotalPages(response.totalPages)
  }

  useEffect(() => {
    loadStats(1)
  }, [])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadStats(nextPage)
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
        <div className="flex items-center mb-3">
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
          <>
            <div className="space-y-3">
              {stats.map(stat => (
                <div key={stat.date} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
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
            </div>
            {page < totalPages && (
              <button
                onClick={handleLoadMore}
                className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                加载更多
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
