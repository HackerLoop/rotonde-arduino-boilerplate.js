'use strict';

const _ = require('lodash');

module.exports = {
  vid: 0x0403,
  pid: 0x6015,
  serial: '*',

  baud: 115200,

  modulePrefix: 'HAND',
  definitions: [{
    type: 'action',
    identifier: 'HAND_FINGERS',
    processFields: (a, index) => {
      const cmd = _.reduce(a.data.fingers, (c, f, i) => {
        return c + ',' + Math.floor(f.position*10000)/10000 + ',' + Math.floor(f.speed*10000)/10000;
      }, ''+index)+';';
      console.log(cmd);
      return cmd;
    },
    fields: [
      {
        name: 'fingers',
        type: 'array',
        units: 'position: 0-1, speed: 0-1',
      }
    ],
  }]
};
