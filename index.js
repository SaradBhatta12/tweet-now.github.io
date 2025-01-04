import "dotenv/config";
import express from "express";
import { TwitterApi } from "twitter-api-v2";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// Initialize Twitter API client
const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
});

const twiterClient = client.readWrite;

// Initialize Google Generative AI
const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = googleAI.getGenerativeModel({ model: "gemini-pro" });

// Function to generate and post a tweet
const tweet = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing or invalid.");
      return;
    }

    // Generate content using Gemini
    const result = await model.generateContent(
      "Generate a tweet. Keep it between 10-40 words, asking questions about web development and app technologies. and latest and old technologies related to development and another new technologies not only web developement."
    );

    // Check if response exists
    const tweetText =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!tweetText) {
      console.error("No response text from AI");
      return;
    }

    const tags =
      "#Developer #technologies #tech #webdevelopment #coding #codewithsarad #development";
    const finalTweet = `${tweetText} ${tags} ☺️`; // Add tags and emoji at the end

    // Post the tweet
    const response = await twiterClient.v2.tweet(finalTweet);
    console.log("Tweet posted successfully:", response.data);
    return response.data; // Return the tweet data for use in the route
  } catch (error) {
    console.error("Error in tweet function:", error);
    throw error; // Throw the error to handle it in the route
  }
};

// Call the tweet function immediately (optional)
tweet();

// Schedule the tweet function to run every 90 minutes
const interval = 90 * 60 * 1000; // 90 minutes in milliseconds
setInterval(tweet, interval);

// Express route to manually trigger the tweet function
app.get("/", async (req, res) => {
  try {
    const tweetData = await tweet(); // Automatically trigger the tweet function
    return res.json({
      success: true,
      message: "Tweet posted successfully",
      tweet: tweetData,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log("Server is running on port " + process.env.PORT);
});
