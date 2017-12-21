var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var url = require('url');
var bodyParser = require('body-parser');
var json = require('json');
var logger = require('logger');
var methodOverride = require('method-override');

var nano = require('nano')('http://localhost:5984');

var db = nano.use('address');
var app = express();

app.set('port',process.env.PORT ||3000);
app.set('views', path.join(__dirname,'views'));
app.set('view engine','jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride());
//app.use(express.state(path.join(__dirname,'public')));

app.get('/',routes.index);

app.post('/createdb',function(req,res){
  nano.db.create(req.body.dbname,function(error){
    if(error){
      res.send("Error creating database "+req.body.dbname);
      return;
    }

    res.send("Database :" + req.body.dbname + "created successfully");
  })
})

app.post('/new_contact',function(request,response){
  var name = request.body.name;
  var phone = request.body.phone;

  db.insert({name:name, phone:phone, crazy:true}, phone, function(error,body,header){
    if(error)
    {
      response.send("Error inserting contact");
    }

    response.send("Contact created successfully");
  });
});


app.post('/view_contact',function(request,response){
  var alldoc = "Following are the contacts";
  db.get(request.body.phone, {revs_info:true}, function(error,body){
    if(!error)
    {
      console.log(body);
    }

    if(body) {
      alldoc = "Name : "+body.name+"<br/>Phone Number : "+body.phone;
    }
    else
    {
      alldoc = "No records found";
    }
  });
});


app.post('/delete_contact',function(request,response){
  db.get(request.body.phone, {revs_info:true}, function(error,body){
    if(!error) {
      db.destroy(request.body.phone, body._rev, function(error,body) {
        if(error) {
          response.send("Error deleting contact");
        }
      });
      response.send("Contacts deleted successfully");
    }
  });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port" + app.get('port'));
})
