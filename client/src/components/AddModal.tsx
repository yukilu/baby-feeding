import { useState } from 'react'
import { api } from '../api'
import type { Record, RecordType } from '../types'

const typeLabels: Record<RecordType, string> = {
  breastmilk: '🤱 母乳',
  formula: '🍼 奶粉',
  poop: '💩 大便',
}

interface AddModalProps {
  record?: Record
  onClose: () => void
  onRecordUpdated: () => void
}

export default function AddModal({ record, onClose, onRecordUpdated }: AddModalProps) {
  const isEdit = !!record
  const [selectedType, setSelectedType] = useState<RecordType>(record?.type || 'breastmilk')
  const [amount, setAmount] = useState(record?.amount?.toString() || '')
  const [duration, setDuration] = useState(record?.duration?.toString() || '')
  const [note, setNote] = useState(record?.note || '')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      if (isEdit) {
        await api.updateRecord(record.id, {
          amount: amount ? parseInt(amount) : undefined,
          duration: duration ? parseInt(duration) : undefined,
          note: note || undefined,
        })
      } else {
        await api.createRecord({
          type: selectedType,
          amount: amount ? parseInt(amount) : undefined,
          duration: duration ? parseInt(duration) : undefined,
          note: note || undefined,
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
            {isEdit ? '编辑记录' : '添加记录'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 类型选择 - 仅添加时可编辑 */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">选择类型</h3>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(typeLabels) as [RecordType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => !isEdit && setSelectedType(type)}
                disabled={isEdit}
                className={`p-3 rounded-lg border-2 text-center transition ${
                  selectedType === type
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="inline-block w-7 text-lg mb-1">{label.split(' ')[0]}</div>
                <div className="text-xs">{label.split(' ')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 表单 */}
        {selectedType && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
            {selectedType === 'formula' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">奶量 (mL)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入奶量"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
            {selectedType === 'breastmilk' && (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">奶量 (mL)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="请输入奶量"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">时长 (分钟)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="请输入时长"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="可选备注"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
