'use strict';

module.exports = {
  vid: 0x2a03,
  pid: 0x0043,
  serial: 553383436393517060,

  baud: 9600,

  modulePrefix: 'FSR',
  definitions: [{
    type: 'action',
    identifier: 'HAND_TEMP_LED',
    fields: [
      {
        name: 'temp',
        type: 'number',
        units: 'deg',
      }
    ]
  }, {
    type: 'action',
    identifier: 'HAND_VIBRATE',
    fields: [
      {
        name: 'temp',
        type: 'number',
        units: 'deg',
      }
    ]
  }, {
    type: 'event',
    identifier: 'HAND_PRESSURE',
    fields: [
      {
        name: 'value',
        type: 'number',
        units: '',
      },
    ],
  }, {
    type: 'event',
    identifier: 'HAND_TEMPERATURE',
    fields: [
      {
        name: 'value',
        type: 'number',
        units: 'deg',
      },
    ],
  }]
};
