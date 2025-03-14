const express = require('express')
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const app = express()
const cors = require('cors')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI);

var userSchema = new mongoose.Schema({
  username: String,
  logs: [{
    _id: String,
    username: String,
    date: String,
    duration: Number,
    description: String
  }]
});

var userModel = mongoose.model("user", userSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// ADDING USERS - START
app.post('/api/users', async function(req, res) {
  var newUser = new userModel({
    username: req.body.username
  });

  const saveResult = await newUser.save();
  res.json({
    username: saveResult.username,
    _id: saveResult._id
  });

});

app.get('/api/users',async function(req, res) {
  const allUsers = await userModel.find({}).select('_id username');
  res.json(allUsers);
});
// ADDING USERS - END

// ADDING EXERCISE LOGS - START
app.post('/api/users/:_id/exercises', async function(req, res) {
    var userID = req.params._id;
    var inputDesc = req.body.description;
    var inputDuration = req.body.duration;
    var inputDate = new Date();
    var dateString = inputDate.toDateString();

    if (req.body.date) {
      inputDate = new Date(req.body.date);
      dateString = inputDate.toDateString();
    }

    var inputUser = await userModel.findOne({_id: userID});
    var inputUsername = inputUser.username;
    var updatedLogs = inputUser.logs;
    updatedLogs.push({
      _id: userID.toString(),
      username: inputUsername,
      date: dateString,
      duration: inputDuration,
      description: inputDesc
    });

    const update = { logs: updatedLogs };

    await userModel.findOneAndUpdate({ _id: userID }, update);

    res.json({
      _id: userID,
      username: inputUsername,
      date: dateString,
      duration: Number(inputDuration),
      description: inputDesc
    });
});

app.get('/api/users/:_id/logs', async function(req, res) {
  var userID = req.params._id;
  const inputUser = await userModel.findOne({ _id: userID });
  let {from, to, limit} = req.query;
  var fromDate = new Date(1900, 0, 1);
  var toDate = new Date();
  var inputUserLogs = inputUser.logs;

  // Example format for testing
  // /api/users/:_id/logs?from=1900-10-10&to=1900-10-11&limit=3

  if (from) { fromDate = new Date(from); }
  if (to) { toDate = new Date(to); }

  var filteredLogs = inputUserLogs.filter(log => {
    let logDate = new Date(log.date);

    return (logDate.getTime() >= fromDate.getTime() && logDate.getTime() <= toDate.getTime());
  });

  if (limit && filteredLogs.length > 1) {
    filteredLogs = filteredLogs.slice(0, limit);
  }

  res.json({
    username: inputUser.username,
    count: inputUser.logs.length,
    _id: userID,
    log: filteredLogs
  });
});
// ADDING EXERCISE LOGS - END

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
