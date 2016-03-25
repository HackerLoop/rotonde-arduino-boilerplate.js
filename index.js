'use strict';

const _ = require('lodash');

const client = require('rotonde-client/node/rotonde-client')('ws://rotonde:4224');
const uuid = require('node-uuid');

/**
 * Fill these
 */

const vid = 0x0;
const pid = 0x0;
const serial = 0x0;

const baud = 0;

const modulePrefix = '';
const definitions = [/*{
  type: 'event' or 'action',
  identifier: ''
  fields: [
    {
      name: '',
      type: '',
      units: '',
    }
  ]
}*/];

const send = (port, data) => {
  const status = uuid.v1();
  client.sendAction('SERIAL_WRITE', {
    port: port.comName,
    response: status,
    data,
  });
  client.eventHandlers.attachOnce(status, (e) => {
    console.log(e);
  });
}

const startBionicoHand = (status, port) => {
  const actionHandler = (a) => {
    const index = _.findIndex(definitions, {identifier: a.identifier});

    if (!index) {
      return;
    }

    const def = definitions[index];
    const cmd = _.reduce(def.fields, (cmd, field) => {
      return cmd + ',' + a.data[field];
    }, index) + ';';

    send(port, cmd);
  };
  _.forEach(definitions, def => {
    client.addLocalDefinition(def.type, def.identifier, def.fields);
  });

  client.eventHandlers.attach('SERIAL_READ', (e) => {
    const cmd = e.data.replace(';', '').split(',');
    if (cmd.length < 1) {
      return;
    }
    const def = definitions[cmd[0]];

    if (def.type != 'event') {
      return;
    }

    const data = _.reduce(cmd.slice(1), (data, arg, i) => {
      const field = def.fields[i];
      data[field.name] = arg;
      return data;
    }, {});

    client.sendEvent(def.identifier, data);
  });

  const handler = (e) => {
    if (_.isEqual(port, e.data)) {
      client.eventHandlers.detach('SERIAL_PORT_LOST', handler);
    }
  };
  client.eventHandlers.attach('SERIAL_PORT_LOST', handler);
}

const processPort = (port) => {
  if (port.productId != pid || port.vendorId != vid || port.serialNumber != serial) {
    return;
  }

  // status is the name of the event used to report serial port status
  const status = 'SERIAL_OPEN_'+uuid.v1();
  client.sendAction('SERIAL_OPEN', {
    port: port.comName,
    baud: baud,
    parser: 'READLINE',
    separator: ';',
    response: status,
  });
  client.eventHandlers.attachOnce(status, (e) => {
    if (e.data.status != 'OK') {
      if (e.data.status == 'ALREADY_OPENNED') {
        client.sendAction('SERIAL_CLOSE', {
          port: port.comName
        });
        process.exit(1);
      }
      client.sendEvent(modulePrefix + '_ERROR', {
        port
      });
      process.exit(1);
    }
    client.sendEvent(modulePrefix + '_FOUND', {
      port,
      index: 0,
    });
    startBionicoHand(status, port);
  });
}

client.onReady(() => {
  client.bootstrap({'SERIAL_LIST': {}}, ['SERIAL_PORTS_AVAILABLE'], ['SERIAL_PORT_DISCOVERED', 'SERIAL_PORT_LOST']).then((ports) => {

    _.forEach(ports[0].data.ports, processPort);

    client.eventHandlers.attach('SERIAL_PORT_DISCOVERED', (e) => {
      processPort(e.data);
    });

    client.unDefinitionHandlers.attach('*', (d) => {
      if (_.includes(['SERIAL_PORTS_AVAILABLE', 'SERIAL_PORT_DISCOVERED', 'SERIAL_PORT_LOST'], d.identifier)) {
        console.log('Lost serial module, exiting.');
        process.exit(1);
      }
    });

  }, (err) => {
    console.log(err);
    process.exit();
  });
});

client.connect();
