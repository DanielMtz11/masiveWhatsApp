const MySQLEvents = require('@rodrigogs/mysql-events');

var instance = null;
const program = async () => {
    instance = new MySQLEvents({
        host: '78.138.46.28',//'147.185.238.85',
        user: 'aplicacion',
        password: '4pl1c4c10N01!',
    }, {
        startAtEnd: true,
    });
  
    try {
        await instance.start();
        console.log('Async Start...', data);
    } catch (err) {
        console.log('Async Error...', err);
    }

    instance.addTrigger({
        name: 'Insert',
        expression: 'test.initial',
        statement: MySQLEvents.STATEMENTS.INSERT,
        onEvent: async (event) => {
          // Here you will get the events for the given expression/statement.
          // This could be an async function.
          console.log('Insert', event);
        }
    });
    
    instance.addTrigger({
        name: 'Update',
        expression: 'test.initial',
        statement: MySQLEvents.STATEMENTS.UPDATE,
        onEvent: async (event) => {
          // Here you will get the events for the given expression/statement.
          // This could be an async function.
          console.log('Update', event);
        }
    });

    
    instance.addTrigger({
        name: 'Delete',
        expression: 'test.initial',
        statement: MySQLEvents.STATEMENTS.DELETE,
        onEvent: async (event) => {
          // Here you will get the events for the given expression/statement.
          // This could be an async function.
          console.log('Delete', event);
        }
    });

    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, (err) => console.error('CONN', err));
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, (err) => {
        console.error('ERROR', err);
    });

};
  
program()
    .then(() => {
        console.log('Waiting for database vents...');
    })
    .catch(console.error);