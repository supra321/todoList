const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended : true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemSchema = new mongoose.Schema ({
	name: String
});

const listItem = mongoose.model("listItem", itemSchema);

const item1 = new listItem({
	name: "Eat"
});

const item2 = new listItem({
	name: "Sleep"
});

const item3 = new listItem({
	name: "Code"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
	listName: String,
	items: [itemSchema]
});

const List = mongoose.model("list", listSchema);

app.get("/", (req, res) => {
	listItem.find({}, (err, items) => {
		if (err) {
			console.log(err);
		} else {
			if (items.length === 0) {
				listItem.insertMany(defaultItems, (err) => err ? console.log(err) : console.log("All Items Inserted"));
			} else {
				res.render("list", {heading : "Today's List", newListItems : items})
			}
		}
	})
	.then(() => res.redirect("/"));
})

app.get("/about", (req, res) => {
	res.render("about");
})

app.get("/:listName", (req, res) => {
	const customListName = _.capitalize(req.params.listName);

	List.findOne({ listName: customListName }, (err, list) => {
		if (err) {
			console.log(err);
		} else {
			if (!list) {
				const list = new List ({
					listName: customListName,
					items : defaultItems
				});

				list.save()
				.then(() => res.redirect(`/${customListName}`));
			} else {
				res.render("list", {heading : list.listName, newListItems : list.items});
			}
		}
	});
})

app.post("/", (req, res) => {
	if (req.body.listItem.length > 0) {
		const newItem = new listItem({
			name: req.body.listItem
		});
		newItem.save().then(() => res.redirect("/"));
	} else {
		res.redirect("/");
	}
})

app.post("/search", (req, res) => {
	const customListName = _.capitalize(req.body.listTitle);
	res.redirect(`/${customListName}`);
})

app.post("/delete", (req, res) => {
	const customListName = _.capitalize(req.body.listTitle);
	const itemId = req.body.itemId;

	if (customListName === _.capitalize("Today's List")) {
		listItem.findByIdAndRemove(itemId, (err) => err ? console.log(err) : console.log("Item Deleted"))
		.then(() => res.redirect("/"));
	} else {
		List.findOneAndUpdate({ listName: customListName }, {$pull: {items: {_id: itemId}}}, (err, list) => {
			if (err) {
				console.log(err);
			}
		}).then(() => res.redirect(`/${customListName}`));
	}	
})

app.post("/:listName", (req, res) => {
	const customListName = _.capitalize(req.params.listName);

	if (req.body.listItem.length > 0) {
		const newItem = new listItem({
			name: req.body.listItem
		});
		List.findOne({ listName: customListName }, (err, list) => {
			if (err) {
				console.log(err);
			} else {
				list.items.push(newItem);
				list.save().then(() => res.redirect(`/${customListName}`));
			}
		});
	} else {
		res.redirect(`/${customListName}`);
	}
})

const PORT = process.env.PORT || 3000;
app.listen(PORT,() => {
	console.log(`Listening to port ${PORT}`);
})