module.exports = function getPresets(self, combineRgb) {
  const presets = {}
  const addButton = (key, name, action, options = {}, color = [255, 255, 255], bgcolor = [0, 0, 0], fontsize, feedbackIds = [], feedbackOptions = {}) => {
    presets[key] = {
      type: 'button',
      category: 'STGTIME',
      name: key,
      style: {
        text: name,
        size: fontsize,
        color: combineRgb(...color),
        bgcolor: combineRgb(...bgcolor),
      },
      steps: action
        ? [{ down: [{ actionId: action, options }], up: [] }]
        : [],
      feedbacks: Array.isArray(feedbackIds)
        ? feedbackIds.map((id) => ({
          feedbackId: id,
          options: feedbackOptions[id] || {},
          style:
            id === 'timer_running'
              ? { bgcolor: combineRgb(0, 200, 0), color: combineRgb(0, 0, 0) }
              : id === 'timer_stopped'
              ? { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) }
              : id === 'duration_match'
              ? {
                  bgcolor: combineRgb(0, 180, 180),
                  color: combineRgb(0, 0, 0),
              }
              : {},
        }))
        : [],
    }
  }
  addButton('Timer Toggle', '▶️ Start/\n⏹ Stop', 'timerAction', { timerAction: 'toggle' }, [255, 255, 255], [180, 0, 0], 18, ['timer_running', 'timer_stopped'])
  addButton('Timer Start', '▶️ Start', 'timerAction', { timerAction: 'start' }, [255, 255, 255], [0, 0, 180], 24)
  addButton('Timer Stop', '⏹ Stop', 'timerAction', { timerAction: 'stop' }, [255, 255, 255], [0, 0, 180], 24)
  addButton('Timer Reset', '🔄 Reset', 'timerAction', { timerAction: 'reset' }, [255, 255, 255], [0, 0, 180], 24)
  addButton('Timer -60 Seconds', '⏪ Jog\n-60s', 'timerSet', { timerAction: 'jog', val: -60 }, [255, 255, 255], [180, 0, 180], 18)
  addButton('Timer -10 Seconds', '⏪ Jog\n-10s', 'timerSet', { timerAction: 'jog', val: -10 }, [255, 255, 255], [180, 0, 180], 18)
  addButton('Timer +10 Seconds', '⏩ Jog\n+10s', 'timerSet', { timerAction: 'jog', val: 10 }, [255, 255, 255], [180, 0, 180], 18)
  addButton('Timer +60 Seconds', '⏩ Jog\n+60s', 'timerSet', { timerAction: 'jog', val: 60 }, [255, 255, 255], [180, 0, 180], 18)
  const times = [
    { label: '⏱\n5 Min', seconds: 300 },
    { label: '⏱\n10 Min', seconds: 600 },
    { label: '⏱\n15 Min', seconds: 900 },
    { label: '⏱\n20 Min', seconds: 1200 },
    { label: '⏱\n30 Min', seconds: 1800 },
    { label: '⏱\n45 Min', seconds: 2700 },
    { label: '⏱\n60 Min', seconds: 3600 },
  ]
  times.forEach((t) => {
    const key = `Timer Preset Set Time to ${t.seconds} Seconds`
    addButton(key, t.label, 'timerSet', { timerAction: 'time', val: t.seconds }, [255, 255, 255], [0, 100, 100], 18, ['duration_match'], { duration_match: { duration: t.seconds } })
  })
  presets['videoToggle'] = {
    type: 'button',
    category: 'STGTIME',
    name: 'Toggle Video Timer visibility',
    style: {
      text: 'Toggle\nVideo\nTimer',
      size: 14,
	  alignment: 'center:center',
	  show_topbar: true,
      bgcolor: combineRgb(180, 0, 0),
      color: combineRgb(255, 255, 255),
    },
    steps: [{down: [{ actionId: 'videoToggle', options: { videoToggle: 'toggle' } }], up: [],},
  ],
    feedbacks: [
      {
        feedbackId: 'video_visible',
		style: {
            bgcolor: combineRgb(0, 180, 0),
            color: combineRgb(0, 0, 0),
        }
      },
    ],
  }
  presets['brightnes-10'] = {
    type: 'button',
    category: 'STGTIME',
    name: 'Display Brightness -10%',
    style: {
      text: 'Value: $(STGTIME:display_brightness)\nBrightness\n-10',
      size: 14,
	  alignment: 'center:center',
	  show_topbar: true,
      bgcolor: combineRgb(0, 64, 32),
      color: combineRgb(255, 255, 255),
    },
    steps: [{down: [{ actionId: 'BrightnessSet', options: { value: '$(STGTIME:display_brightness) - 10' } }], up: [],},
  ],
    feedbacks: [],
  }
  presets['brightnes+10'] = {
    type: 'button',
    category: 'STGTIME',
    name: 'Display Brightness +10%',
    style: {
      text: 'Value: $(STGTIME:display_brightness)\nBrightness\n+10',
      size: 14,
	  alignment: 'center:center',
	  show_topbar: true,
      bgcolor: combineRgb(0, 64, 32),
      color: combineRgb(255, 255, 255),
    },
    steps: [{down: [{ actionId: 'BrightnessSet', options: { value: '$(STGTIME:display_brightness) + 10' } }], up: [],},
  ],
    feedbacks: [],
  }
  presets['screen'] = {
    type: 'button',
    category: 'STGTIME',
    name: 'Display Live Image',
    style: {
      text: 'LIVE IMAGE',
      size: 10,
	  alignment: 'center:top',
	  show_topbar: false,
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
    },
    steps: [],
    feedbacks: [
      {
        feedbackId: 'display_image',
      },
    ],
  }
  return presets
}