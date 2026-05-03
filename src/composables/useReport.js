import { ref } from 'vue'
import { reportPost } from '@/api/feed.js'

export function useReport() {
  const showReportModal = ref(false)
  const reportTargetId = ref(null)

  // 신고할 게시글 ID를 저장하고 모달 열기
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
      // 성공 여부와 관계없이 모달은 닫기
      showReportModal.value = false
      const message = e.response?.data?.message
      alert(message)
    }
  }

  return { showReportModal, openReport, submitReport }
}
