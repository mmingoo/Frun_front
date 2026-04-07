import { ref } from 'vue'
import { reportPost } from '@/api/feed.js'

export function useReport() {
  const showReportModal = ref(false)
  const reportTargetId = ref(null)

  function openReport(runningLogId) {
    reportTargetId.value = runningLogId
    showReportModal.value = true
  }

  async function submitReport({ reason }) {
    try {
      await reportPost(reportTargetId.value, reason)
      showReportModal.value = false
      alert('신고를 완료했습니다.')
    } catch (e) {
      showReportModal.value = false
      const message = e.response?.data?.message
      alert(message)
    }
  }

  return { showReportModal, openReport, submitReport }
}
