module.exports = function getActions(self, combineRgb) {
  return {
    BrightnessSet: {
      name: 'Set Display Brightness',
      options: [
        {
          type: 'textinput',
          id: 'value',
          label: 'Brightness',
          default: 100,
		      useVariables: true,
          required: true,
        },
        {
          type: 'static-text',
          id: 'info',
          value: 'Variables and simple math can be used, e.g. \'$(variableXY) + 10\''
        },
      ],
      callback: async (action) => {
        const rawInput = action.options.value
        const resolved = await self.parseVariablesInString(rawInput)
        let result = 100;
        try {
          result = parseInt(eval(resolved))
        } catch (err) {
          self.log('error', `Fehler beim Auswerten: ${resolved}`)
          return
        }
        let msg = {};
		    msg.brightness = result >= 0 && result <= 100 ? result : 100
        await self.sendRequest('POST', '/api/v1/config/display', msg)
      },
    },
    timeColor: {
      name: 'Time/Clock set Color',
      options: [
        {
          type: 'colorpicker',
          id: 'color',
          label: 'Color',
          default: combineRgb(0, 0, 255)
        },
      ],
      callback: async (action) => {
        let msg = {};
        msg.color = parseColor(action.options.color)
        await self.sendRequest('POST', '/api/v1/config/time', msg)
      },
    },
    timerAction: {
      name: 'Timer Actions (Start/Stop/Toggle/Reset)',
      options: [
        {
          type: 'dropdown',
          label: 'Format',
          id: 'timerAction',
          default: 'toggle',
          choices: [
            { id: 'start', label: 'Start' },
            { id: 'stop', label: 'Stop' },
            { id: 'toggle', label: 'Toggle' },
            { id: 'reset', label: 'Reset' },
          ],
        },
      ],
      callback: async (action) => {
        await self.sendRequest('POST', '/api/v1/timer/action', {
          action: action.options.timerAction
        })
      },
    },
    timerColor: {
      name: 'Timer set Colors (Base/Warning/Ending Color & Blanking)',
      options: [
        {
          type: 'colorpicker',
          id: 'base',
          label: 'Base Color',
          default: combineRgb(0, 255, 0)
        },
        {
          type: 'colorpicker',
          id: 'warn',
          label: 'Warning Color',
          default: combineRgb(224, 224, 0)
        },
        {
          type: 'colorpicker',
          id: 'end',
          label: 'Ending Color',
          default: combineRgb(255, 0, 0)
        },
        {
          type: 'number',
          id: 'value',
          label: 'Blanking',
          default: 75,
          min: 0,
          max: 255,
          step: 1
        },
      ],
      callback: async (action) => {
        let msg = {"colors": {}};
        msg.colors.base = parseColor(action.options.base)
        msg.colors.warn = parseColor(action.options.warn)
        msg.colors.end = parseColor(action.options.end)
        msg.blanking = 255 - parseInt(action.options.value)
        await self.sendRequest('POST', '/api/v1/config/timer', msg)
      },
    },
    timerSet: {
      name: 'Timer set Time (Set/Jog)',
      options: [
        {
          type: 'dropdown',
          label: 'Action',
          id: 'timerAction',
          default: 'time',
          choices: [
            { id: 'time', label: 'Set Time' },
            { id: 'jog', label: 'Jog' },
          ],
        },
		    {
          type: 'textinput',
          label: 'Time',
          id: 'val',
          default: '0',
		      useVariables: true,
          required: true,
        },
        {
          type: 'static-text',
          id: 'info',
          value: 'Time in seconds or formatted as HH:MM:SS (negative values allowed for jog).'
        }
      ],
      callback: async (action) => {
		    const resolve = await self.parseVariablesInString(action.options.val)
        let msg = {};
        let timeMs = 0;
        const isNegative = resolve.startsWith('-')
		    if(resolve.includes(':')){
          const parts = resolve.replace('-', '').split(':').map(p => parseInt(p) || 0)
          while (parts.length < 3) {parts.unshift(0) }
          const [hours, minutes, seconds] = parts
          const time = ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000
          timeMs = isNegative ? -1 * time : time
        } else {
          timeMs = parseInt(resolve) * 1000
        }
        msg[action.options.timerAction] = timeMs
        if (isNegative && action.options.timerAction === "time") return
        await self.sendRequest('POST', '/api/v1/timer/timer', msg)
      },
    },
    timerTimes: {
      name: 'Timer set Timings for Colors (Warning/Ending Time)',
      options: [
        {
          type: 'dropdown',
          label: 'Action',
          id: 'timerAction',
          default: 'warn',
          choices: [
            { id: 'warn', label: 'Warning Color Time' },
            { id: 'end', label: 'Ending Color Time' },
          ],
        },
		    {
          type: 'textinput',
          label: 'Time',
          id: 'val',
          default: '0',
		      useVariables: true,
          required: true,
        },
        {
          type: 'static-text',
          id: 'info',
          value: 'Time in seconds or formatted as HH:MM:SS).'
        },
      ],
      callback: async (action) => {
		    const resolve = await self.parseVariablesInString(action.options.val)
        let msg = {"times":{}};
        let timeMs = 0;
        const isNegative = resolve.startsWith('-')
        if (isNegative) return
		    if(resolve.includes(':')){
          const parts = resolve.replace('-', '').split(':').map(p => parseInt(p) || 0)
          while (parts.length < 3) {parts.unshift(0) }
          const [hours, minutes, seconds] = parts
          timeMs = ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000
        } else {
          timeMs = parseInt(resolve) * 1000
        }
        msg.times[action.options.timerAction] = timeMs
        await self.sendRequest('POST', '/api/v1/config/timer', msg)
      },
    },
    videoColor: {
      name: 'Video set Colors (Base/Warning/Ending Color & Blanking)',
      options: [
        {
          type: 'colorpicker',
          id: 'base',
          label: 'Base Color',
          default: combineRgb(0, 255, 0)
        },
        {
          type: 'colorpicker',
          id: 'warn',
          label: 'Warning Color',
          default: combineRgb(224, 224, 0)
        },
        {
          type: 'colorpicker',
          id: 'end',
          label: 'Ending Color',
          default: combineRgb(255, 0, 0)
        },
        {
          type: 'number',
          id: 'value',
          label: 'Blanking',
          default: 75,
          min: 0,
          max: 255,
          step: 1
        },
      ],
      callback: async (action) => {
        let msg = {"colors": {}};
        msg.colors.base = parseColor(action.options.base)
        msg.colors.warn = parseColor(action.options.warn)
        msg.colors.end = parseColor(action.options.end)
        msg.blanking = 255 - parseInt(action.options.value)
        await self.sendRequest('POST', '/api/v1/config/video', msg)
      },
    },
    videoSet: {
      name: 'Video set Time (Remaining/Total)',
      options: [
        {
          type: 'dropdown',
          label: 'Action',
          id: 'videoAction',
          default: 'remaining',
          choices: [
            { id: 'remaining', label: 'Remaining (Remaining Time)' },
            { id: 'duration', label: 'Duration (Total Time)' },
          ],
        },
		    {
          type: 'textinput',
          label: 'Time',
          id: 'val',
          default: '0',
		      useVariables: true,
          required: true,
        },
        {
          type: 'static-text',
          id: 'info',
          value: 'Time in seconds or formatted as HH:MM:SS).'
        },
      ],
      callback: async (action) => {
		    const resolve = await self.parseVariablesInString(action.options.val)
        let msg = {};
        let timeMs = 0;
        const isNegative = resolve.startsWith('-')
        if (isNegative) return
		    if(resolve.includes(':')){
          const parts = resolve.replace('-', '').split(':').map(p => parseInt(p) || 0)
          while (parts.length < 3) {parts.unshift(0) }
          const [hours, minutes, seconds] = parts
          timeMs = ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000
        } else {
          timeMs = parseInt(resolve) * 1000
        }
        msg[action.options.videoAction] = timeMs
        await self.sendRequest('POST', '/api/v1/timer/video', msg)
      },
    },
    videoTimes: {
      name: 'Video set Timings for Colors (Warning/Ending Time)r',
      options: [
        {
          type: 'dropdown',
          label: 'Action',
          id: 'timerAction',
          default: 'warn',
          choices: [
            { id: 'warn', label: 'Warning Color Time' },
            { id: 'end', label: 'Ending Color Time' },
          ],
        },
		    {
          type: 'textinput',
          label: 'Time',
          id: 'val',
          default: '0',
		      useVariables: true,
          required: true,
        },
        {
          type: 'static-text',
          id: 'info',
          value: 'Time in seconds or formatted as HH:MM:SS).'
        },
      ],
      callback: async (action) => {
		    const resolve = await self.parseVariablesInString(action.options.val)
        let msg = {"times":{}};
        let timeMs = 0;
        const isNegative = resolve.startsWith('-')
        if (isNegative) return
		    if(resolve.includes(':')){
          const parts = resolve.replace('-', '').split(':').map(p => parseInt(p) || 0)
          while (parts.length < 3) {parts.unshift(0) }
          const [hours, minutes, seconds] = parts
          timeMs = ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000
        } else {
          timeMs = parseInt(resolve) * 1000
        }
        msg.times[action.options.timerAction] = timeMs
        await self.sendRequest('POST', '/api/v1/config/video', msg)
      },
    }, 
    videoToggle: {
      name: 'Video Timer Visible',
      options: [
        {
          type: 'dropdown',
          label: 'Hide/Show Timer',
          id: 'videoToggle',
          default: 'toggle',
          choices: [
            { id: 'toggle', label: 'Toggle' },
            { id: 'true', label: 'Show' },
            { id: 'false', label: 'Hide' },
          ],
        },
      ],
      callback: async (action) => {
        let msg = {};
		    const videoToggle = action.options.videoToggle
        if(videoToggle == 'true') msg.visible = true;
        if(videoToggle == 'false') msg.visible = false;
        if(videoToggle == 'toggle'){
          msg.visible = self.timerStatus.video.visible ? false : true
        }
        await self.sendRequest('POST', '/api/v1/timer/video', msg)
      },
    },
	}
}

function parseColor(color) {
	return {
		red:   (color >> 16) & 0xff,
		green: (color >> 8) & 0xff,
		blue:  color & 0xff,
	}
}