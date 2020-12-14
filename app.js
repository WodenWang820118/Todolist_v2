//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});

//create the schema
const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("item", itemsSchema);

//default items
const item1 = new Item({
  name: "todo1"
});

const item2 = new Item({
  name: "todo2"
});

const item3 = new Item({
  name: "todo3"
});

// default array
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
};

const List = mongoose.model("list", listSchema);

app.get("/:customListName", function(req, res){
  // convert only the first character to uppercase
  // the other character will be lowercase
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundLists){
    // deal with error
    if (err){
      console.log(err);
      // check the list
    } else {
      // create a new list
      if (foundLists === null) {
        list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        console.log(customListName);
        console.log("creates new default list");
        res.redirect("/" + customListName);
      } else {
        // show the existing list
        console.log(customListName);
        console.log("already has the default list");
        res.render("list", {listTitle: foundLists.name, newListItems: foundLists.items})
      }
    }
  });
  
  //console.log(customListName);

});

// when find all the items in the foundItems array
// if the array's length is 0, then adding the default items and redirecting to the home route
// if there are already items in the array, just rendering it into the the list.ejs
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err){console.log(err)} else {console.log("Adding default values successfully");}
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // create the item first
  // remember to build every single object instead of using create
  // since it's easier to manipulate later
  const item = new Item({
    name:itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if (err) {console.log(err);}
      else {
        //put the item in the items list inside the foundlist
        foundList.items.push(item);
        //save the foundlist
        foundList.save();
        // redirect to the listName url, which is dealt by the get method
        // /:customListName
        res.redirect("/" + listName);
      }
    });
  } 
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;

  if (listName === "Today"){
    Item.findOneAndDelete({_id: checkedItemId}, function(err){
      if (err){console.log(err);} else {console.log("Reomve successfully");}
    });
    res.redirect("/");
  } else {
    // https://docs.mongodb.com/manual/reference/operator/update/pull/index.html
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err){
      if (err){console.log(err);} else {res.redirect("/" + listName);}
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
