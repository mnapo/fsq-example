// libraries
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const {Sequelize, DataTypes} = require('sequelize');
const fs = require('feathers-sequelize');

// new exp-feathers app instance
const app = express(feathers());

// new Sq connection instance
const sequelize = new Sequelize(
  'postgres://postgres:1newpass@localhost:5432/fsp',
  {logging: false}
);

// seq models
const Client = sequelize.define('client', {
  name: {type: DataTypes.STRING, allowNull: false}, //shorthand syntax: {name: DataTypes.STRING}
  address: {type: DataTypes.STRING, defaultValue: 'unspecified'}
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
Estimate.belongsTo(Client); //, {as: 'EstimateClient', constraints: false}



// express deployment
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.configure(express.rest());
app.use(express.errorHandler());

// routes for services
app.use('/clients', fs({Model: Client}));
app.use('/estimates', fs({Model: Estimate}));
app.use('/populate-estimates', (req, res) => {
  Estimate.create({ammount: 165706.25, clientId: 4});
  console.log('called');
  res.json({done: true});
});
/*const associateEstimateToClient = (context) => {

};*/

// hooking example
app.service('estimates').hooks({
  before: {
    //create: [ associateEstimateToClient ]
  }
});

// start server
app.listen(3030).on('listening', () =>
  console.log('Feathers server listening on localhost:3030')
);

// DB connection testings
//testSeq();

/* syncronize seq models with DB, meaning it will create the required tables (or add/alter missing/differing 
* tables for such casses).
* this is an example repository so 'force' and 'alter' options are setted to true, which specifies that it will dump and create 
* again the tables specified by models.
* Check Migrations for production phase: https://sequelize.org/master/manual/migrations.html */
sequelize.sync({force: true, alter: true})
// fill DB with dummy models instances
.then(() => {
  try { Client.bulkCreate(
    [ {name: 'Client 1', address: '1st Street'},
    {name: 'Client 2', address: '2nd Street'},
    {name: 'Client 3', address: '3rd Street'},
    {name: 'Client 4', address: '4th Street'} ]
  ) } catch (error) {
    console.log(error);
  }
}).finally(() => {
  console.log('successful rows insertion')
});