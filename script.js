// When redirecting the user to Spotify for authentication
const scopes = 'user-read-private user-read-email streaming playlist-read-private user-library-read';

const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${scopes}`;

window.location.href = authUrl;

// Display search results with correct onclick handler
function displayResults(data) {
    resultsDiv.innerHTML = ""; // Clear previous results

    if (data && data.tracks && data.tracks.items.length > 0) {
        data.tracks.items.forEach(track => {
            const trackDiv = document.createElement("div");
            trackDiv.classList.add("result-item");

            const trackImage = track.album.images[2]?.url || "https://via.placeholder.com/50";
            const trackName = track.name;
            const artistName = track.artists[0].name;
            const trackUri = track.uri;  // Correctly access the track URI

            // Now the onclick function will call playSong with trackUri and trackName
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

// Play song using track URI
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
