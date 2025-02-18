const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

const clientID = "91786cabf39742208a39728600d93595";
const clientSecret = "ba8b994793d54ebd9a02e8fe2271accb";

// Function to get access token from Spotify API
async function getAccessToken() {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(clientID + ":" + clientSecret)
        },
        body: new URLSearchParams({
            grant_type: "client_credentials"
        })
    });

    const data = await response.json();
    return data.access_token;
}

// Function to search Spotify
async function searchSpotify(query) {
    const token = await getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track,artist,genre&limit=10`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const data = await response.json();
    return data;
}

// Display search results
function displayResults(data) {
    resultsDiv.innerHTML = "";
    if (data.tracks && data.tracks.items.length > 0) {
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
    const query = searchInput.value;
    if (query) {
        const data = await searchSpotify(query);
        displayResults(data);
    } else {
        alert("Please enter a search query.");
    }
});
