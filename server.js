// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var Llama = require('./models/llama');
var User = require('./models/user');
var Task = require('./models/task');
var bodyParser = require('body-parser');
var router = express.Router();

//replace this with your Mongolab URL
mongoose.connect('mongodb://admin:admin@ds023480.mlab.com:23480/mwojci23_mp4');

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  if('OPTIONS' == req.method) {
    res.sendStatus(200);
  }
  else{
    next();
  }
};
app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// All our routes will start with /api
app.use('/api', router);

//Default route here
var homeRoute = router.route('/');

homeRoute.get(function(req, res) {
  res.json({ message: 'Nothing here. Go to /users or /tasks.' });
});

//Llama route
var llamaRoute = router.route('/llamas');

llamaRoute.get(function(req, res) {
  res.json([{ "name": "alice", "height": 12 }, { "name": "jane", "height": 13 }]);
});

llamaRoute.post(function(req, res) {
  res.send();
});

function toJSO(param) {
  return eval("("+param+")");
}

function getError(err) {
  var msg = 'Error: ';

  if(!err.errors) {
    msg += err.message;
  }

  else {
    for(var key in err.errors) {
      msg += err.errors[key].message + ' ';
    }
  }
  return msg;
}

//Add more routes here

// Users

var usersRoute = router.route('/users');

usersRoute.get(function(req, res) {
  if(req.query.count) {
    User.count(toJSO(req.query.where))
        .exec(function(err, count) {
          if(err) {
            res.status(500);
            res.json({message: getError(err), data: []});
          }
          res.json({"message": "OK", "data": count});
        });
  }
  else {
    User.find(toJSO(req.query.where))
        .sort(toJSO(req.query.sort))
        .select(toJSO(req.query.select))
        .skip(req.query.skip)
        .limit(req.query.limit)
        .exec(function(err, users) {
          if(err) {
            res.status(500);
            res.json({message: getError(err), data: []});
          }
          else res.json({"message": "OK", "data": users});
        });
  }
});

usersRoute.post(function(req, res) {
  var user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.save(function(err) {
    if(err) {
      res.status(500);
      if(err.code == 11000) {
        res.json({message: 'Email already exists', data: []});
      } else {
        res.json({message: getError(err), data: []});
      }
    } else {
      res.status(201);
      res.json({message: 'User added to database', data: user});
    }
  });
});

usersRoute.options(function(req, res){
  res.writeHead(200);
  res.end();
});

//Tasks

var tasksRoute = router.route('/tasks');

tasksRoute.get(function(req, res) {
  if(req.query.count) {
    Task.count(toJSO(req.query.where))
        .exec(function(err, count) {
          if(err) {
            res.status(500);
            res.json({message: getError(err), data: []});
          }
          res.json({"message": "OK", "data": count});
        });
  }
  else {
    Task.find(toJSO(req.query.where))
        .sort(toJSO(req.query.sort))
        .select(toJSO(req.query.select))
        .skip(req.query.skip)
        .limit(req.query.limit)
        .exec(function(err, tasks) {
          if(err) {
            res.status(500);
            res.json({message: getError(err), data: []});
          }
          else res.json({"message": "OK", "data": tasks});
        });
  }
});

tasksRoute.post(function(req, res) {
  var task = new Task();
  task.name = req.body.name;
  task.description = req.body.description;
  task.deadline = req.body.deadline;
  task.assignedUser = req.body.assignedUser;
  task.assignedUserName = req.body.assignedUserName;
	task.completed = req.body.completed;
  task.save(function(err) {
    if(err) {
      res.status(500);
      res.json({message: getError(err), data: []});
    } else {
      res.status(201);
      res.json({message: 'Task added to database', data: task});
    }
  });
});

tasksRoute.options(function(req, res){
  res.writeHead(200);
  res.end();
});


//User by id
var userRoute = router.route('/users/:id');

userRoute.get(function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if(err) {
      res.status(500);
      res.json({message: getError(err), data: []});
    } else if(!user) {
      res.status(404);
      res.json({message: 'User not found', data: []});
    }
    else {
      res.json({message: 'OK', data: user});
    }
  });
});

userRoute.put(function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if(!user) {
      res.status(404);
      res.json({message: "User not found", data: []});
      return;
    }
    user.name = req.body.name;
    user.email = req.body.email;
    user.pendingTasks = req.body.pendingTasks;
    user.save(function(err) {
      if(err) {
        res.status(500);
        res.json({message: getError(err), data: []});
      } else {
        res.status(200);
        res.json({message: 'User updated', data: user});
      }
    });
  });
});

userRoute.delete(function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) {
      res.status(500);
      res.json({message: getError(err), data: []});
    } else if(!user) {
      res.status(404);
      res.json({message: 'User not found', data: []});
    } else {
      res.json({message: 'User deleted', data: []});
    }
  });
});

userRoute.options(function(req, res){
  res.writeHead(200);
  res.end();
});

//Task by id

var taskRoute = router.route('/tasks/:id');

taskRoute.get(function(req, res) {
  Task.findById(req.params.id, function(err, task) {
    if(err) {
      res.status(500);
      res.json({message: getError(err), data: []});
    } else if(!task) {
      res.status(404);
      res.json({message: 'Task not found', data: []});
    } else {
      res.json({message: 'OK', data: task});
    }
  });
});

taskRoute.put(function(req, res) {
  Task.findById(req.params.id, function(err, task) {
    if(!task) {
      res.status(404);
      res.json({message: "Task not found", data: []});
      return;
    }
    task.name = req.body.name;
    task.description = req.body.description;
    task.deadline = req.body.deadline;
    task.assignedUser = req.body.assignedUser;
    task.assignedUserName = req.body.assignedUserName;
	  task.completed = req.body.completed;
    task.save(function(err) {
      if(err) {
        res.status(500);
        res.json({message: getError(err), data: []});
      } else {
        res.status(200);
        res.json({message: 'Task updated', data: task});
      }
    });
  });
});

taskRoute.delete(function(req, res) {
  Task.findByIdAndRemove(req.params.id, function(err, task) {
    if(err) {
      res.status(500);
      res.json({message: getError(err), data: []});
    } else if(!task) {
      res.status(404);
      res.json({message: 'Task not found', data: []});
    } else {
      res.json({message: 'Task deleted', data: []});
    }
  });
});

taskRoute.options(function(req, res){
  res.writeHead(200);
  res.end();
});


// Start the server
app.listen(port);
console.log('Server running on port ' + port);
