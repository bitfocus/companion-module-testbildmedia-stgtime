module.exports = function getFeedbacks(self, combineRgb) {
  return {
    display_image: {
      name: 'Display Live View',
      type: 'advanced',
      callback: async () => {
			return self.screenImg
		},
    },
	duration_match: {
	  name: 'Timer set Time compare',
	  type: 'boolean',
      defaultStyle: {
        bgcolor: combineRgb(0, 180, 180),
        color: combineRgb(0, 0, 0),
      },
	  options: [
		{
		  type: 'number',
		  label: 'Seconds',
		  id: 'duration',
		  min: 0,
		  default: 0,
		},
	  ],
	  callback: async (feedback) => {
		return self.timerStatus.timer.duration === feedback.options.duration * 1000 ? true : false
	  },
	},
    timer_running: {
      name: 'Timer running',
      type: 'boolean',
      defaultStyle: {
        bgcolor: combineRgb(0, 180, 0),
        color: combineRgb(0, 0, 0),
      },
      callback: () => {
        return self.timerStatus.timer.running === true
      },
    },
	timer_stopped: {
      name: 'Timer stopped',
      type: 'boolean',
      defaultStyle: {
        bgcolor: combineRgb(180, 0, 0),
        color: combineRgb(255, 255, 255),
      },
      callback: () => {
        return self.timerStatus.timer.running === false
      },
    },
	video_visible: {
      name: 'Video Timer Visible',
      type: 'boolean',
      defaultStyle: {
        bgcolor: combineRgb(200, 0, 0),
        color: combineRgb(0, 0, 0),
      },
      callback: () => {
        return self.timerStatus.video.visible === true
      },
    },
  }
}
