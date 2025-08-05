export const configFields = [
  {
    type: 'textinput',
    id: 'host',
    label: 'STGTIME Host',
    default: '127.0.0.1',
    width: 6,
    required: true,
  },
  {
    type: 'number',
    id: 'port',
    label: 'STGTIME Port',
    default: 8000,
    width: 6,
    min: 0,
    required: true,
    tooltip: 'Defualt Port is 8000',
  },
  {
    type: 'number',
    id: 'pollms',
    label: 'API Polling Time (in ms)',
    default: 250,
    width: 12,
    min: 100,
    max: 1000,
    required: true,
    tooltip: 'Default is 250ms. Lowest Value you should use is 100ms and highest 1000ms.',
  },
  {
    type: 'static-text',
    id: 'apiPollInfo',
    width: 12,
    label: 'API Poll Interval warning',
    value: 'Adjusting the API Polling Interval can impact performance. <br />' +
      'A lower interval allows for more responsive feedback, but may impact CPU usage.',
  },
];