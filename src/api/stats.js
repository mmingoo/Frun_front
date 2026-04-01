import api from './index'

export function getWeeklyStats(userId, date) {
  return api.get(`/api/v1/stats/${userId}/weekly`, { params: { date } })
}

export function getMonthlyStats(userId, year, month) {
  return api.get(`/api/v1/stats/${userId}/monthly`, { params: { year, month } })
}

export function getPeriodStats(userId, from, to) {
  return api.get(`/api/v1/stats/${userId}/period`, { params: { from, to } })
}
