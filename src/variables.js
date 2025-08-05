module.exports = function getVariables(self) {
  return [
    { variableId: 'display_brightness', name: 'Display Brightness' },
    { variableId: 'duration_time_s', name: 'Timer duration time in seconds' },
    { variableId: 'remaining_time_hms', name: 'Timer remaining time in HH:MM:SS' },
  ]
}
