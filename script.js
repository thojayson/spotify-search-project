document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();  // Ensure this is called after the DOM is loaded
});

const clientID = "91786cabf39742208a39728600d93595";
const clientSecret = "ba8b994793d54ebd9a02e8fe2271accb";
const redirectUri = "https://thojayson.github.io/spotify-search-project/";
let accessToken = null;
let player = null;
let isPlaying = false;

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const loginBtn = document.getElementById("loginBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const currentTrackDiv = document.getElementById("current-track");
const userInfoDiv = document.getElementById("userInfo");

// Check if the user is logged in
function checkLoginStatus() {
    const token = localStorage.getItem("access_token");
    if (token && userInfoDiv) {
        accessToken = token;
        loginBtn.textContent = "Logout";
        loginBtn.onclick = logoutSpotify;
        displayUserInfo();  // Display user's name after login
        initializeSpotifyPlayer();  // Initialize the player when logged in
    } else {
        loginBtn.textContent = "Login with Spotify";
        loginBtn.onclick = loginSpotify;
        userInfoDiv.textContent = "Not logged in";
    }
}

// Display user info (name)
function displayUserInfo() {
    const userName = localStorage.getItem("user_name");
    if (userName && userInfoDiv) {
        userInfoDiv.textContent = `Logged in as: ${userName}`;
    } else {
        userInfoDiv.textContent = "Logged in as: Unknown";
    }
}

// Redirect to Spotify login
function loginSpotify() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-library-read playlist-read-private playlist-read-collaborative streaming`;
    window.location.href = authUrl;
}

// Logout and remove session data
function logoutSpotify() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    accessToken = null;
    checkLoginStatus(); // Update UI after logout
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
        currentTrackDiv.textContent = `Playing: ${trackName}`;
        player.play({ uris: [uri] }).then(() => {
            isPlaying = true;
            playPauseBtn.textContent = "Pause";
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
                console.log("Player is ready with device ID " + device_id);
            });

            // Connect to the player
            player.connect();
        };
    };
}

// Event listener for search button
searchBtn.addEventListener("click", async () => {
    const query = searchInput.value;
    if (query) {
        const data = await searchSpotify(query);
        displayResults(data);
    }
});

// Get access token after redirect
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get("code");
if (code) {
    getAccessTokenFromCode(code);
}
