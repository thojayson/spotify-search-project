// Your client ID and redirect URI
const clientId = '91786cabf39742208a39728600d93595';
const redirectUri = 'https://thojayson.github.io/spotify-search-project/';
const scopes = 'streaming user-read-email user-library-read';

// Get the access token from the URL after redirect
function getAccessToken() {
    const hash = window.location.hash.substring(1).split('&');
    const params = {};
    hash.forEach(item => {
        const pair = item.split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
    });
    return params.access_token;
}

// Redirect to Spotify authorization URL if access token is not found
function authorizeSpotify() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = authUrl;
}

// Display search results
function displayResults(data) {
    resultsDiv.innerHTML = ""; // Clear previous results

    if (data && data.tracks && data.tracks.items.length > 0) {
        data.tracks.items.forEach(track => {
            const trackDiv = document.createElement("div");
            trackDiv.classList.add("result-item");

            const trackImage = track.album.images[2]?.url || "https://via.placeholder.com/50";
            const trackName = track.name;
            const artistName = track.artists[0].name;
            const trackUri = track.uri;

            // Add an event listener to play the selected song
            trackDiv.innerHTML = `
                <img src="${trackImage}" alt="${trackName}" />
                <a href="javascript:void(0);" onclick="playSong('${trackUri}', '${trackName}')">${trackName} - ${artistName}</a>
            `;
            resultsDiv.appendChild(trackDiv);
        });
    } else {
        resultsDiv.innerHTML = "No results found.";
    }
}

// Play the selected song
function playSong(uri, trackName) {
    if (player && uri) {
        currentTrackUri = uri;  // Store the URI of the current song
        currentTrackDiv.textContent = `Playing: ${trackName}`;

        // Play the song through the player
        player.play({ uris: [uri] }).then(() => {
            isPlaying = true;
            playPauseBtn.textContent = "Pause";  // Change button to "Pause"
        }).catch((error) => {
            console.error("Error playing song: ", error);
        });
    }
}

// Initialize the Spotify player
function initializeSpotifyPlayer(accessToken) {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);

    script.onload = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
            player = new Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: cb => { cb(accessToken); },
                volume: 0.5
            });

            player.addListener("initialization_error", ({ message }) => { console.error("Initialization Error: ", message); });
            player.addListener("authentication_error", ({ message }) => { console.error("Authentication Error: ", message); });
            player.addListener("account_error", ({ message }) => { console.error("Account Error: ", message); });
            player.addListener("playback_error", ({ message }) => { console.error("Playback Error: ", message); });

            player.addListener("ready", ({ device_id }) => {
                console.log("Player is ready with device ID", device_id);
            });

            player.connect().then((success) => {
                if (success) {
                    console.log("Player connected successfully!");
                } else {
                    console.log("Failed to connect to the player.");
                }
            });
        };
    };
}

// Handle Spotify login and token retrieval
function handleLogin() {
    const accessToken = getAccessToken();

    if (accessToken) {
        initializeSpotifyPlayer(accessToken);
    } else {
        // If there's no access token, redirect to Spotify login
        authorizeSpotify();
    }
}

// Fetch Spotify search results for a query
function searchSpotify(query) {
    const accessToken = getAccessToken();

    if (!accessToken) {
        console.log("Access token not found. Please log in.");
        return;
    }

    const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`;
    fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displayResults(data);
    })
    .catch(error => {
        console.error("Error fetching search results: ", error);
    });
}

// Event listener for the search button
document.querySelector("#search-button").addEventListener("click", () => {
    const query = document.querySelector("#search-input").value;
    searchSpotify(query);
});

// Call the login handler on page load
window.onload = () => {
    handleLogin();
};
