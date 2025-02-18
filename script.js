// Retrieve the access token
let accessToken = localStorage.getItem('access_token');
let username = localStorage.getItem('username'); // Store the username for display

// DOM Elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const usernameDiv = document.getElementById("usernameDiv"); // Display username when logged in

// Check if the access token exists, and fetch it if necessary
function checkToken() {
    if (!accessToken) {
        // If no access token, redirect to Spotify login
        window.location.href = 'https://accounts.spotify.com/authorize?client_id=91786cabf39742208a39728600d93595&response_type=code&redirect_uri=https://thojayson.github.io/spotify-search-project/&scope=user-library-read playlist-read-private playlist-read-collaborative streaming';
    }
}

// Retrieve the access token if redirected from Spotify (after login)
if (window.location.search.includes("code=")) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
        getAccessTokenFromCode(code);
    }
}

// Get access token from Spotify API after the user logs in
async function getAccessTokenFromCode(code) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa('91786cabf39742208a39728600d93595' + ':' + 'ba8b994793d54ebd9a02e8fe2271accb'),
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://thojayson.github.io/spotify-search-project/',
        }),
    });

    const data = await response.json();
    if (data.access_token) {
        accessToken = data.access_token;
        localStorage.setItem('access_token', accessToken); // Store the token
        window.location.href = 'https://thojayson.github.io/spotify-search-project/'; // Redirect to the main page
    } else {
        console.error('Failed to obtain access token:', data);
    }
}

// Use the access token for making API requests
async function searchSpotify(query) {
    checkToken(); // Ensure the token is valid

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=10`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        const errorData = await response.json();
        console.error('Error fetching search results:', errorData);
    }
}

// Display search results
function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    if (data && data.tracks && data.tracks.items.length > 0) {
        data.tracks.items.forEach(track => {
            const trackDiv = document.createElement("div");
            trackDiv.classList.add("result-item");

            const trackImage = track.album.images[2]?.url || "https://via.placeholder.com/50";
            const trackLink = track.external_urls.spotify;
            trackDiv.innerHTML = `
                <img src="${trackImage}" alt="${track.name}" />
                <a href="javascript:void(0)" onclick="playSong('${track.uri}', '${track.name}')">${track.name} - ${track.artists[0].name}</a>
            `;
            resultsDiv.appendChild(trackDiv);
        });
    } else {
        resultsDiv.innerHTML = "No results found.";
    }
}

// Play selected song
function playSong(uri, trackName) {
    if (player) {
        currentTrackUri = uri;  // Store the current song's URI
        currentTrackDiv.textContent = `Playing: ${trackName}`;
        player.play({ uris: [uri] }).then(() => {
            isPlaying = true;
            playPauseBtn.textContent = "Pause";  // Change button to "Pause"
        }).catch(e => console.log(e));
    }
}

// Initialize Spotify Player
function initializeSpotifyPlayer() {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);

    script.onload = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
            player = new Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: (cb) => { cb(accessToken); },
                volume: 0.5
            });

            // Error handling
            player.addListener("initialization_error", ({ message }) => { console.error(message); });
            player.addListener("authentication_error", ({ message }) => { console.error(message); });
            player.addListener("account_error", ({ message }) => { console.error(message); });
            player.addListener("playback_error", ({ message }) => { console.error(message); });

            // Playback state changes
            player.addListener("player_state_changed", (state) => {
                if (!state) return;
                console.log(state);
            });

            // Ready to play
            player.addListener("ready", ({ device_id }) => {
                console.log("Player is ready with device ID", device_id);
            });

            // Connect to the player
            player.connect();
        };
    };
}

// Handle play/pause toggle
function togglePlayPause() {
    if (isPlaying) {
        player.pause().then(() => {
            isPlaying = false;
            playPauseBtn.textContent = "Play";  // Change button to "Play"
        });
    } else {
        player.resume().then(() => {
            isPlaying = true;
            playPauseBtn.textContent = "Pause";  // Change button to "Pause"
        });
    }
}

// Skip to next track
function nextTrack() {
    player.nextTrack();
}

// Skip to previous track
function prevTrack() {
    player.previousTrack();
}

// Event listeners for buttons and actions
loginBtn.addEventListener("click", () => {
    if (!accessToken) {
        window.location.href = 'https://accounts.spotify.com/authorize?client_id=91786cabf39742208a39728600d93595&response_type=code&redirect_uri=https://thojayson.github.io/spotify-search-project/&scope=user-library-read playlist-read-private playlist-read-collaborative streaming';
    }
});

logoutBtn.addEventListener("click", () => {
    // Remove the access token and username from localStorage and redirect
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.location.href = 'https://thojayson.github.io/spotify-search-project/';
});

// Display user info if logged in
function displayUserInfo() {
    if (accessToken) {
        loginBtn.style.display = "none"; // Hide login button
        logoutBtn.style.display = "block"; // Show logout button
        usernameDiv.style.display = "block";
        usernameDiv.textContent = `Logged in as: ${username}`;
    } else {
        loginBtn.style.display = "block"; // Show login button
        logoutBtn.style.display = "none"; // Hide logout button
        usernameDiv.style.display = "none";
    }
}

// Initialize the login state and user info
displayUserInfo();

// Search functionality
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (query) {
        const data = await searchSpotify(query);
        if (data) {
            displayResults(data);
        }
    } else {
        alert("Please enter a search query.");
    }
});
