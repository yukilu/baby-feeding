import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Record, RecordType } from '../types'
import AddModal from '../components/AddModal'

const typeLabels: Record<RecordType, string> = {
  breastmilk: '🤱 母乳',
  formula: '🍼 奶粉',
  poop: '💩 大便',
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

export default function Home() {
  const [records, setRecords] = useState<Record[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record | undefined>()

  const loadRecords = async (currentPage: number = 1) => {
    const response = await api.getRecords(currentPage)
    if (currentPage === 1) {
      setRecords(response.data)
    } else {
      setRecords(prev => [...prev, ...response.data])
    }
    setTotalPages(response.totalPages)
  }

  useEffect(() => {
    loadRecords(1)
  }, [])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadRecords(nextPage)
  }

  const handleRecordUpdated = () => {
    setPage(1)
    loadRecords(1)
  }

  const handleAdd = () => {
    setEditingRecord(undefined)
    setShowModal(true)
  }

  const handleEdit = (record: Record) => {
    setEditingRecord(record)
    setShowModal(true)
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-20">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/stats"
            className="bg-white/20 backdrop-blur rounded-lg p-3 text-center hover:bg-white/30 transition"
          >
            <div className="text-xl">📊</div>
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
          <>
            <div className="space-y-3">
              {records.map(record => (
                <div
                  key={record.id}
                  onClick={() => handleEdit(record)}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100 cursor-pointer hover:border-purple-300 hover:bg-gray-100 transition"
                >
                  {/* 时间 */}
                  <div className="text-xs text-gray-500 mb-2">{formatDate(record.createdAt)}</div>
                  
                  {/* 主内容 */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg">
                      <span className="inline-block w-8">{typeLabels[record.type].split(' ')[0]}</span>
                      {typeLabels[record.type].split(' ')[1]}
                    </span>
                    {record.type === 'formula' && record.amount && (
                      <span className="font-medium text-blue-600">{record.amount}mL</span>
                    )}
                    {record.type === 'breastmilk' && record.amount && (
                      <span className="font-medium text-blue-600">{record.amount}mL</span>
                    )}
                  </div>
                  
                  {/* 备注 */}
                  {record.note && <div className="text-xs text-gray-500 mt-2">{record.note}</div>}
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
