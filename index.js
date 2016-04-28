'use strict';

const _ = require('lodash');

const client = require('rotonde-client/node/rotonde-client')('ws://rotonde:4224');
const uuid = require('node-uuid');

const config = require('./config.js');

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

const startDevice = (status, port) => {
  const actionHandler = (a) => {
    const index = _.findIndex(config.definitions, {identifier: a.identifier});

    if (index < 0) {
      return;
    }

    const def = config.definitions[index];
    let cmd = '';
    if (typeof def.processFields == 'function') {
      cmd = def.processFields(a, index);
    } else {
      cmd = _.reduce(def.fields, (cmd, field) => {
        return cmd + ',' + a.data[field.name];
      }, index) + ';';
    }

    console.log(cmd);
    send(port, cmd);
  };
  _.forEach(config.definitions, def => {
    client.addLocalDefinition(def.type, def.identifier, def.fields);
    if (def.type == 'action') {
      client.actionHandlers.attach(def.identifier, actionHandler);
    }
  });

  const readHandler = (e) => {
    console.log(e);
    const cmd = e.data.data.replace(';', '').split(',');
    if (cmd.length < 1) {
      return;
    }
    const def = config.definitions[cmd[0]];

    if (!def || def.type != 'event') {
      return;
    }

    const args = cmd.slice(1);
    let data = {};
    if (typeof def.processFields == 'function') {
      data = def.processFields(args);
    } else {
      data = _.reduce(args, (data, arg, i) => {
        const field = def.fields[i];
        data[field.name] = arg;
        return data;
      }, {});
    }

    client.sendEvent(def.identifier, data);
  };
  client.eventHandlers.attach('SERIAL_READ', readHandler);

  const lostHandler = (e) => {
    if (!_.isEqual(port, e.data)) {
      return;
    }
    client.eventHandlers.detach('SERIAL_PORT_LOST', lostHandler);
    client.eventHandlers.detach('SERIAL_READ', readHandler);
    _.forEach(config.definitions, def => {
      client.removeLocalDefinition(def.type, def.identifier, def.fields);
      if (def.type == 'action') {
        client.actionHandlers.detach(def.identifier, actionHandler);
      }
    });
  };
  client.eventHandlers.attach('SERIAL_PORT_LOST', lostHandler);
}

const processPort = (port) => {
  if (!(port.productId == config.pid && port.vendorId == config.vid && (config.serial == '*' || port.serialNumber == config.serial))) {
    return;
  }

  // status is the name of the event used to report serial port status
  const status = 'SERIAL_OPEN_'+uuid.v1();
  client.sendAction('SERIAL_OPEN', {
    port: port.comName,
    baud: config.baud,
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
      client.sendEvent(config.modulePrefix + '_ERROR', {
        port
      });
      process.exit(1);
    }
    client.sendEvent(config.modulePrefix + '_FOUND', {
      port,
      index: 0,
    });
    startDevice(status, port);
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
