import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const formatTitle = (date: string) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DailyRecords() {
  const { date } = useParams<{ date: string }>()
  const [records, setRecords] = useState<FeedingRecord[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FeedingRecord | undefined>()

  const loadRecords = async () => {
    if (!date) return
    const data = await api.getRecordsByDate(date)
    setRecords(data)
  }

  useEffect(() => {
    loadRecords()
  }, [date])

  const handleEdit = (record: FeedingRecord) => {
    setEditingRecord(record)
    setShowModal(true)
  }

  const handleRecordUpdated = () => {
    loadRecords()
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* 头部 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 shadow-md">
        <div className="flex items-center">
          <Link to="/stats" className="mr-3 hover:opacity-80">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold">{date ? formatTitle(date) : ''}</h1>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="p-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">当天暂无记录</div>
        ) : (
          <div className="space-y-3">
            {records.map(record => (
              <div
                key={record.id}
                onClick={() => handleEdit(record)}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 cursor-pointer hover:border-purple-300 hover:bg-gray-100 transition"
              >
                <div className="text-sm text-gray-500 mb-2">{formatDate(record.createdAt)}</div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">
                    <span className="inline-block w-8">{typeLabels[record.type].split(' ')[0]}</span>
                    {typeLabels[record.type].split(' ')[1]}
                  </span>
                  {record.type === 'formula' && record.amount ? (
                    <span className="font-medium text-blue-600">{record.amount}mL</span>
                  ) : null}
                  {record.type === 'breastmilk' && (record.amount || record.duration) ? (
                    <span className="font-medium">
                      {record.duration ? <span className="text-teal-600">{record.duration}min</span> : null}
                      {record.amount && record.duration ? ' ' : ''}
                      {record.amount ? <span className="text-blue-600">{record.amount}mL</span> : null}
                    </span>
                  ) : null}
                  {(record.type === 'pee' || record.type === 'poop') && record.diaper ? (
                    <span className="font-medium text-green-600">{record.diaper}片</span>
                  ) : null}
                </div>
                {record.note && <div className="text-xs text-gray-500 mt-2">{record.note}</div>}
              </div>
            ))}
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
