const port = 8080; // Port number
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas
mongoose.connect(process.env.REACT_APP_MONOGO)
  .then(() => { console.log("MongoDB Connected...");   console.log(`Server is running at http://localhost:${port}`);})
  .catch(err => console.error("MongoDB Connection Error: ", err));

// Mongoose Schema
const VocaSchema = new mongoose.Schema({
  days: [
    {
      id: String,
      day: Number
    }
  ],
  words: [
    {
      id: String,
      day: String,
      word: String,
      meaning: String,
      isDone: Boolean
    }
  ] // Keeps `words` array as it is
}, { collection: "voca" });

const VocaModel = mongoose.model("voca", VocaSchema);

//Get all days
app.get("/api/days", async (req, res) => {
  try {
    const { day } = req.query; // Extract query parameter
    const dayList = await VocaModel.find().lean();

    if (!dayList || !dayList[0].days) {
        return res.status(404).json({ message: "No days found" });
    }      
    // const daysArray = dayList[0].days || [];
    // const strDays = daysArray.map(item => item.day);
    // console.log(strDays); //check the days
    // console.log(dayList);
    // console.log(dayList[0].days);
    // console.log(day);
    if (day) {
        // Convert day to number for proper filtering
        //console.log(dayList[0].days);
        const filteredDay = dayList[0].days.find(d => d.day === Number(day));
        //console.log(filteredDay);
        if (!filteredDay) {
          //return res.status(404).json({ message: `Day ${day} not found` });
          return res.json({}); //Return empty object
        }  
        return res.json(filteredDay);
      }
  
    res.json(dayList[0].days);
  } catch (error) {
    console.error("Failed to fetch days: ", error);
    res.status(500).json({ message: "Error fetching days", error });
  }
});

// Get all words
app.get("/api/words", async (req, res) => {
  try {
    const { day } = req.query; // Extract query parameter
    const wordsList = await VocaModel.find().lean();
    // const wordsArray = wordsList[0].words || [];
    // const strWords = wordsArray.map(item => item.word);
    // console.log(strWords); //check the words
    if (!wordsList || !wordsList[0].words) {
        return res.status(404).json({ message: "No words found" });
    }
    if (day) {
      // Convert day to string for matching (MongoDB stores day as a string)
      const filteredWords = wordsList[0].words.filter(word => word.day === day.toString());
      if (filteredWords.length === 0) {
        return res.json({}); //Return empty object
      }
      return res.json(filteredWords);
    }
    res.json(wordsList[0].words);
  } catch (error) {
    console.error("Failed to fetch words: ", error);
    res.status(500).json({ message: "Error fetching words", error });
  }
});

//Create new day
app.post("/api/days", async (req, res) => {
  try {
    //const lastDay = await dayModel.find().sort({ day: -1 }).limit(1);
    const dayList = await VocaModel.find().lean();
    const lastDay = dayList.length > 0 && dayList[0].days.length > 0 
    ? dayList[0].days.reduce((max, item) => Math.max(max, item.day), 0) : null;    

    const newDayNumber = lastDay ? lastDay + 1 : 1;   
    const result = await VocaModel.updateOne({}, 
      { $push: { days: { id: newDayNumber.toString(), day: newDayNumber } } }
    );
    //console.log("Update Result:", result);
    if (result.modifiedCount > 0) {
        res.json({ message: "Day added successfully", day: req.body });
    } else {
        res.status(500).json({ error: "Failed to add word" });
    }
  } catch (error) {
    console.error("❌ Failed to create day:", error);    
    //Return full error details for debugging
    return res.status(500).json({ 
      message: "Error creating day", 
      error: error.message || error.toString()  //Capture actual error message
    });
  }
});

//Create new word
app.post("/api/words", async (req, res) => {
  try {
    console.log("app.post");
    const { id, day, word, meaning } = req.body;
    console.log(req.body);
    // const id = "example1"; 
    // const day = "6"; 
    // const word = "example1"; 
    // const meaning = "an instance illustrating a rule";    
    if (!id || !day || !word || !meaning) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const result = await VocaModel.updateOne(
    {},
    { 
        $push: { words: { id, day, word, meaning, isDone: false || false } } }
    );
    
    if (result.modifiedCount > 0) {
        res.json({ message: "Word added successfully", word: req.body });
    } else {
        res.status(500).json({ error: "Failed to add word" });
    }
  } catch (error) {
    console.error("Failed to create word:", error);
    res.status(500).json({ message: "Error creating word", error });
  }
});


// Run server
app.listen(port, () => console.log(`Server running on port ${port}`));
