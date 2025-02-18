const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const currentTrackDiv = document.getElementById("current-track");
const userInfoDiv = document.getElementById("user-info");
const userNameDiv = document.getElementById("user-name");

const clientID = "91786cabf39742208a39728600d93595";
const clientSecret = "ba8b994793d54ebd9a02e8fe2271accb";
const redirectUri = "https://thojayson.github.io/spotify-search-project/";
let accessToken = null;
let player = null;
let currentTrackUri = null;
let isPlaying = false;

// Check if the user is logged in
function checkLoginStatus() {
    const token = localStorage.getItem("access_token");
    if (token) {
        accessToken = token;
        loginBtn.textContent = "Logged In";
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
        userInfoDiv.style.display = "block";
        getUserInfo();  // Fetch user info
        initializeSpotifyPlayer();  // Initialize the player when logged in
    }
}

// Redirect to Spotify login
function loginSpotify() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-library-read playlist-read-private playlist-read-collaborative streaming`;
    window.location.href = authUrl;
}

// Get access token from authorization code
async function getAccessTokenFromCode(code) {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(clientID + ":" + clientSecret)
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri
        })
    });

    const data = await response.json();
    if (data.access_token) {
        accessToken = data.access_token;
        localStorage.setItem("access_token", accessToken); // Store token
        window.location.href = "/"; // Redirect back to homepage
    }
}

// Get the user's profile information
async function getUserInfo() {
    const response = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });

    const data = await response.json();
    if (data) {
        userNameDiv.textContent = data.display_name; // Show the user's name
    }
}

// Search Spotify API for tracks
async function searchSpotify(query) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=10`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });

    const data = await response.json();
    return data;
}

// Display search results
function displayResults(data) {
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

// Log out the user
function logoutSpotify() {
    localStorage.removeItem("access_token");
    window.location.href = "/"; // Reload page to reset UI
}

// Event listeners
searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (query) {
        const data = await searchSpotify(query);
        if (data) {
            displayResults(data);
        }
    }
});

loginBtn.addEventListener("click", loginSpotify);
logoutBtn.addEventListener("click", logoutSpotify);
playPauseBtn.addEventListener("click", togglePlayPause);
prevBtn.addEventListener("click", prevTrack);
nextBtn.addEventListener("click", nextTrack);

// Initialize page if the user is already logged in
checkLoginStatus();
