//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


/* Database*/

const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const buyFood = new Item({
  name: "Buy Food"
});

const cookFood = new Item({
  name: "Cook Food"
});

const eatFood = new Item({
  name: "Eat Food"
});

const defaultItems = [buyFood, cookFood, eatFood];

var docs_exist = false;


/* GET, POST*/

app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({}, function(err, results) {
    if (err) {
      console.log(err);
    } else {

      if (results.length === 0) { // Check if empty then initiate
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successful list initiation");
          }
        });
      } else {

        res.render("list", {
          listTitle: day,
          newListItems: results
        });
      }
    }
  });

});

app.get("/:customListName", function(req, res) {
  const constListName = _.capitalize(req.params.customListName);

  List.findOne({name: constListName}, function(err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: constListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + constListName);
      }
      else{
        res.render("list", {
          listTitle: results.name,
          newListItems: results.items
        });
      }
    }
  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
  name: itemName
  });

  if (listName === date.getDate()){
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checked_item_id = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == date.getDate()){
    Item.findByIdAndRemove(checked_item_id, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted!");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checked_item_id}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
