import { useState, useEffect } from 'react'
import { api } from '../api'
import type { FeedingRecord, RecordType } from '../types'

const typeLabels: Record<RecordType, string> = {
  breastmilk: '🤱 母乳',
  formula: '🍼 奶粉',
  pee: '💧 尿尿',
  poop: '💩 大便',
}

interface AddModalProps {
  record?: FeedingRecord
  onClose: () => void
  onRecordUpdated: () => void
}

// 将数据库时间格式 "YYYY-MM-DD HH:MM:SS" 转为 datetime-local 所需格式 "YYYY-MM-DDTHH:MM"
const toDateTimeLocal = (dateStr: string) => {
  return dateStr.replace(' ', 'T').slice(0, 16)
}

// 将 datetime-local 格式 "YYYY-MM-DDTHH:MM" 转为数据库格式 "YYYY-MM-DD HH:MM:SS"
const toDbFormat = (dateStr: string) => {
  return dateStr.replace('T', ' ') + ':00'
}

// 获取当前东八区时间的 datetime-local 格式
const getNowDateTimeLocal = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export default function AddModal({ record, onClose, onRecordUpdated }: AddModalProps) {
  const isEdit = !!record
  const [selectedType, setSelectedType] = useState<RecordType>(record?.type || 'breastmilk')
  const [amount, setAmount] = useState(record?.amount?.toString() || '')
  const [duration, setDuration] = useState(record?.duration?.toString() || '')
  const [diaper, setDiaper] = useState(record?.diaper?.toString() || '')
  const [note, setNote] = useState(record?.note || '')
  const [createdAt, setCreatedAt] = useState(record?.createdAt ? toDateTimeLocal(record.createdAt) : getNowDateTimeLocal())
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 新增时获取最新记录的时间作为默认值
  useEffect(() => {
    if (!isEdit) {
      api.getRecords(1, 1).then(response => {
        if (response.data.length > 0) {
          setCreatedAt(toDateTimeLocal(response.data[0].createdAt))
        }
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      if (isEdit) {
        await api.updateRecord(record.id, {
          amount: amount !== '' ? parseInt(amount) : undefined,
          duration: duration !== '' ? parseInt(duration) : undefined,
          diaper: diaper !== '' ? parseInt(diaper) : undefined,
          note: note || undefined,
          createdAt: createdAt ? toDbFormat(createdAt) : undefined,
        })
      } else {
        await api.createRecord({
          type: selectedType,
          amount: amount !== '' ? parseInt(amount) : undefined,
          duration: duration !== '' ? parseInt(duration) : undefined,
          diaper: diaper !== '' ? parseInt(diaper) : undefined,
          note: note || undefined,
          createdAt: createdAt ? toDbFormat(createdAt) : undefined,
        })
      }
      onRecordUpdated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!record) return
    if (confirm('确定要删除这条记录吗？')) {
      setDeleting(true)
      try {
        await api.deleteRecord(record.id)
        onRecordUpdated()
        onClose()
      } finally {
        setDeleting(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? typeLabels[selectedType] : '添加记录'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 类型选择 - 仅添加时可编辑 */}
        {!isEdit && (
        <div className="p-4">
          <div className="grid gap-2 grid-cols-4">
            {(Object.entries(typeLabels) as [RecordType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-2 rounded-lg border-2 text-center transition ${
                  selectedType === type
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-base mb-0.5">{label.split(' ')[0]}</div>
                <div className="text-xs">{label.split(' ')[1]}</div>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* 表单 */}
        {selectedType && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
            <div className="flex items-center mb-3">
              <label className="text-xs font-medium text-gray-700 shrink-0">时间：</label>
              <input
                type="datetime-local"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {selectedType === 'formula' && (
              <div className="flex items-center mb-3">
                <label className="text-xs font-medium text-gray-700 shrink-0">奶量：</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入奶量"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
            {selectedType === 'breastmilk' && (
              <>
                <div className="flex items-center mb-3">
                  <label className="text-xs font-medium text-gray-700 shrink-0">奶量：</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="请输入奶量"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center mb-3">
                  <label className="text-xs font-medium text-gray-700 shrink-0">时长：</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="请输入时长（单位分钟）"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}
            {(selectedType === 'pee' || selectedType === 'poop') && (
              <div className="flex items-center mb-3">
                <label className="text-xs font-medium text-gray-700 shrink-0">尿不湿：</label>
                <input
                  type="number"
                  value={diaper}
                  onChange={(e) => setDiaper(e.target.value)}
                  placeholder="默认1片"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
            <div className="flex items-center mb-4">
              <label className="text-xs font-medium text-gray-700 shrink-0">备注：</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="可选备注"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex gap-2">
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || loading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
                >
                  {deleting ? '删除中...' : '删除'}
                </button>
              )}
              <button
                type="submit"
                disabled={loading || deleting}
                className={`py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 ${isEdit ? 'flex-1' : 'w-full'}`}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
