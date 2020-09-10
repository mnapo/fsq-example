// libraries
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const {Sequelize, DataTypes} = require('sequelize');

// new exp-feathers app instance
const app = express(feathers());

// new Sq connection instance
const sequelize = new Sequelize(
  'postgres://postgres:contrasenia@localhost:5432/fsp',
  {logging: false}
);

// seq models
const Client = sequelize.define('client', {
  name: {type: DataTypes.STRING, allowNull: false}, //shorthand syntax: {name: DataTypes.STRING}
  address: {type: DataTypes.STRING, defaultValue: "unspecified"}
  // id, createdAt and updatedAt are included and updated automatically (BUT NOT by direct SQL queries)
},
  {} // model options (e.g: tableName, timestamps)
);

const Estimate = sequelize.define('estimate', {
  // full datatypes coverage: https://sequelize.org/v5/manual/data-types.html
  ammount: {type: DataTypes.FLOAT, defaultValue: 0}
}, {});

/* models relationship
  * one-to-many: source model can be connected to many target ones
  * mandatory: target model can't exist without source a model's foreign key assigned
*/
Client.hasMany(Estimate, {
  foreignKey: {
    //name: 'cId',
    allowNull: false
  }
});
Estimate.belongsTo(Client);

// check connecting and modeling
async function testSeq() {
  try {
    await sequelize.authenticate();
    console.log('Successful DB connection',
      //Client === sequelize.models.Client,
      //Estimate === sequelize.models.Estimate
    );
  } catch (error) {
    console.error('Error connecting to DB:', error);
  };
};

/* syncronize seq models with DB, meaning it will create the required tables (or add/alter missing/differing 
* tables for such casses).
* this is an example repository so 'force' and 'alter' options are setted to true, which specifies that it will dump and create 
* again the tables specified by models.
* Check Migrations for production phase: https://sequelize.org/master/manual/migrations.html */
sequelize.sync({force: true, alter: true}).
// fill DB with dummy models instances
then(() => {
  // use bulkCreate() for massive addition
  Client.create({name: 'Ff', address: 'Gg'}).then(() => {
    console.log('successful row insertion');
  }).finally(() => {
    sequelize.close();
  });
});


// express deployment
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.configure(express.rest());
app.use(express.errorHandler());

// feathers example service 
class MessageService {
  constructor() {
    this.messages = [];
  }

  async find () {
    return this.messages;
  }

  async create (data) {
    const message = {
      id: this.messages.length,
      text: data.text
    }

    this.messages.push(message);

    return message;
  }
}

// new route for example service
app.use('/messages', new MessageService());

const createdAt = async context => {
  context.data.text = new Date();
  
  return context;
};

// hooking example
app.service('messages').hooks({
  before: {
    create: [ createdAt ]
  }
});


/* //working on services example
app.on('connection', connection =>
  app.channel('everybody').join(connection)
);

app.service('messages').on('created', message => {
  console.log('A new message has been created', message);
});

app.service('messages').create({
  text: 'Hello world from the server'
});*/

// main func
const main = async () => {
  await app.service('messages').create({
    text: 'Hello Feathers'
  });

  /*await app.service('messages').create({
    text: 'Hello again'
  });

  const messages = await app.service('messages').find();

  console.log('All messages', messages);*/
};

// start server
app.listen(3030).on('listening', () =>
  console.log('Feathers server listening on localhost:3030')
);

// init testings
testSeq();
main();