'use strict';

module.exports = {
  vid: 0x2a03,
  pid: 0x0043,
  serial: 553383436393517060,

  baud: 9600,

  modulePrefix: 'FSR',
  definitions: [{
    type: 'event',
    identifier: 'FSR_PRESSURE',
    fields: [
      {
        name: 'value',
        type: 'number',
        units: '0-1',
      },
    ],
  }]
};
