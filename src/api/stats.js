import api from './index'

export function getWeeklyStats(userId) {
  return api.get(`/api/v1/stats/weekly/${userId}`)
}

export function getMonthlyStats(userId) {
  return api.get(`/api/v1/stats/monthly/${userId}`)
}

export function getPeriodStats(userId, from, to) {
  return api.get(`/api/v1/stats/period/${userId}`, { params: { from, to } })
}
