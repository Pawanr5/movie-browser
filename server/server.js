const express = require("express");
const path = require("path");

const app = express();

// Load movie data from the JSON file
const movies = require("./movies_metadata.json");

// API: List all movies
app.get("/api/movies", (request, response) => {
  console.log("❇️ Received GET request to /api/movies");
  response.json({ data: movies });
});

// API: Get a single movie by ID
app.get("/api/movies/:id", (request, response) => {
  console.log("❇️ Received GET request to /api/movies/" + request.params.id);
  const movieId = parseInt(request.params.id);
  const movie = movies.find((m) => m.id === movieId);
  if (movie) {
    response.json({ data: movie });
  } else {
    response.status(404).json({ error: "Movie not found" });
  }
});

// Express port-switching logic
let port;
console.log("❇️ NODE_ENV is", process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  port = process.env.PORT || 3000;
  app.use(express.static(path.join(__dirname, "../build")));
  app.get("*", (request, response) => {
    response.sendFile(path.join(__dirname, "../build", "index.html"));
  });
} else {
  port = 3001;
  console.log("⚠️ Not seeing your changes as you develop?");
  console.log(
    "⚠️ Do you need to set 'start': 'npm run development' in package.json?"
  );
}

// Start the listener!
const listener = app.listen(port, () => {
  console.log("❇️ Express server is running on port", listener.address().port);
});
