const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const loginBtn = document.getElementById("loginBtn");

const clientID = "91786cabf39742208a39728600d93595";
const clientSecret = "ba8b994793d54ebd9a02e8fe2271accb";
const redirectUri = "https://thojayson.github.io/spotify-search-project/"; // Updated redirect URI
let accessToken = null;

// Check if the user is already logged in by checking localStorage
function checkLoginStatus() {
    const token = localStorage.getItem("access_token");
    if (token) {
        accessToken = token;
        loginBtn.textContent = "Logged In";
        loginBtn.disabled = true;
    }
}

// Redirect user to Spotify login page
function loginSpotify() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-library-read playlist-read-private playlist-read-collaborative`;
    window.location.href = authUrl;
}

// Exchange authorization code for access token
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
        localStorage.setItem("access_token", accessToken); // Store token in localStorage
        window.location.href = "/"; // Redirect back to homepage after login
    }
}

// Fetch and display user playlists
async function getUserPlaylists() {
    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });

    const data = await response.json();
    console.log(data); // Display the user's playlists
    // Handle the response, you can display playlists here
}

// Fetch search results from Spotify API
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
                <a href="${trackLink}" target="_blank">${track.name} - ${track.artists[0].name}</a>
            `;

            resultsDiv.appendChild(trackDiv);
        });
    } else {
        resultsDiv.innerHTML = "No results found.";
    }
}

// Event listener for search button
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

// Event listener for login button
loginBtn.addEventListener("click", () => {
    if (!accessToken) {
        loginSpotify(); // If not logged in, redirect to Spotify login
    }
});

// Check login status on page load
checkLoginStatus();

// Handle callback (after Spotify redirects)
if (window.location.pathname === "/") {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
        getAccessTokenFromCode(code);
    }
}
